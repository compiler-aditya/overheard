# Pipeline — design

## Sequence

```
Client                         Next.js route                External
  │                                  │                           │
  │── POST /api/photos/analyze ─────▶│                           │
  │   (multipart: image file)        │                           │
  │                                  │── PUT image to R2 ───────▶│ R2
  │                                  │◀── { r2_key, r2_url } ────│
  │                                  │                           │
  │                                  │── Gemini 2.5 Flash ──────▶│ Google AI
  │                                  │   (vision + text prompt)  │
  │                                  │◀── VisionResult ──────────│
  │                                  │                           │
  │                                  │── resolveCharacter() ────▶│
  │                                  │   (pair > landmark > mem  │
  │                                  │    > new; see below)      │
  │                                  │◀── CharacterRecord ───────│
  │                                  │                           │
  │                                  │── streamTTS(voice, line)─▶│ ElevenLabs
  │                                  │◀── audio/mpeg chunks ─────│
  │                                  │                           │
  │◀── 200 JSON + audio URL ─────────│                           │
  │   { character_id, greeting_url,                              │
  │     ambient_url, agent_id }                                  │
  │                                                              │
  │── <audio> plays greeting                                     │
  │── User taps "Talk back"                                      │
  │── GET /api/converse/start?char=... ──▶ returns signed WS URL │
  │── WS to wss://api.elevenlabs.io/v1/convai/conversation ─────▶│ ElevenLabs
```

## `VisionResult` contract

```ts
// Output of src/lib/vision.ts → identify(imageUrl)
export interface VisionResult {
  primary: Subject;
  secondary?: Subject;             // present only when two clear objects in frame
  landmark_slug?: string;          // set when Gemini confidently identifies a landmark
  description: string;             // 1-2 sentence natural-language description
}
export interface Subject {
  category: string;                // must map to a category slug (normalized)
  attributes: string[];            // 3-6 descriptive tags (color, condition, era)
  confidence: number;              // 0-1
}
```

Gemini is called with a structured prompt asking for JSON matching this shape. The response is validated; on parse failure the pipeline falls back to `{ primary: { category: "artwork", attributes: [], confidence: 0.3 } }`.

## Character resolver — priority order

`src/lib/characters.ts` implements `resolveCharacter(userId, vision, imageR2Key)`:

```ts
export async function resolveCharacter(
  userId: string,
  vision: VisionResult,
  imageR2Key: string
): Promise<CharacterRecord> {
  // 1. PAIR: both primary+secondary present, normalized signatures match a pair spec
  if (vision.secondary) {
    const pair = await matchPair(vision.primary, vision.secondary);
    if (pair) return createPairInstance(userId, pair, imageR2Key);
  }
  // 2. LANDMARK: landmark_slug matches a landmark spec
  if (vision.landmark_slug) {
    const landmark = await getLandmarkBySlug(vision.landmark_slug);
    if (landmark) return asCharacterRecord(landmark);
  }
  // 3. MEMORY: existing (user_id, fingerprint) object
  const fingerprint = makeFingerprint(vision.primary);
  const existing = await findObjectByFingerprint(userId, fingerprint);
  if (existing) {
    await touchLastSeen(existing.id);
    return asCharacterRecord(existing);
  }
  // 4. NEW: design voice + agent from category spec, persist
  const spec = await getCategorySpec(vision.primary.category);
  const voice = await designVoice(spec);
  const agent = await createAgent(spec, voice.voice_id);
  const ambient = await generateAmbient(spec.ambient_signature);
  const object = await insertObject({
    user_id: userId,
    fingerprint,
    category: spec.slug,
    image_r2_key: imageR2Key,
    voice_id: voice.voice_id,
    agent_id: agent.agent_id,
    ambient_r2_key: ambient.r2_key,
  });
  return asCharacterRecord(object);
}
```

## Fingerprinting

```ts
// src/lib/specs/fingerprint.ts
export function makeFingerprint(s: Subject): string {
  const norm = [s.category, ...s.attributes]
    .map(x => x.trim().toLowerCase())
    .sort()
    .join("|");
  return sha1(norm).slice(0, 16);
}
```

Imperfect by design — two similar plants will collide and share a voice. This is acceptable for the hackathon and honest: we note the limitation in the submission write-up.

## Greeting generation

For known characters, `greeting_templates` is a fixed list of 3-5 strings. The pipeline picks one deterministically keyed by `(object_id, day-of-year)` so the same return visit doesn't hear the same greeting twice, but a day-later return might.

For landmarks with prior memory, the greeting is LLM-assembled: the system prompt from `buildSystemPrompt(spec, memory)` is applied, and Gemini produces a single-line greeting consistent with the character.

## Caching
- Vision result per image hash: cached 24h in Postgres (`photo_identifications` table, optional — skip for MVP).
- Greeting audio: R2-cached keyed by `(voice_id, text_sha1)`; re-plays are instant.
- Ambient beds: R2-cached keyed by `(category_slug)`.

## Error handling

Every external call in the pipeline is wrapped in a try/catch that logs and returns a typed `ServiceResult<T>`. The route handler translates errors into user-facing fallbacks:
- Vision failure → "I can't see right now" default voice line.
- TTS failure → serve a pre-recorded fallback audio clip from `public/fallback/...`.
- Agent creation failure (for a new object) → still return the voice greeting, but disable the Converse button with a tooltip.

## Data flow to the database
After `resolveCharacter` succeeds, the route handler upserts:
- `objects` (insert or update `last_seen_at`)
- `pair_instances` (insert when pair path taken)

It never writes to `landmarks` or `pair_specs` at request time — those are populated by `scripts/bootstrap-characters.ts`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/photos/analyze` | Main ingest. Multipart body with `image`. Returns `{ character_id, greeting_url, ambient_url, agent_id }`. |
| `GET` | `/api/characters/:id` | Fetch character metadata + recent conversation. |
| `POST` | `/api/converse/start` | Body `{ character_id }`. Returns `{ ws_url, agent_id, conversation_id }`. The `ws_url` is signed with a short-TTL token if the agent is private; otherwise the agent_id is returned for the client SDK to connect directly. |
| `POST` | `/api/webhooks/elevenlabs` | Receives post-conversation transcript and persists to `conversations`. Signature verified via the ElevenLabs webhook secret. |
