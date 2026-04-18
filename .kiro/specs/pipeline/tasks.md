# Pipeline — tasks

## Phase A — Hello-world vertical slice (Day 1)
- [ ] **A1.** `src/lib/vision.ts` — Gemini 2.5 Flash wrapper. Input: image URL or base64. Output: `VisionResult`. Includes the structured prompt from `design.md`. Falls back on parse error.
- [ ] **A2.** `src/lib/elevenlabs/tts.ts` — streaming TTS. Input: `voice_id`, `text`. Output: `ReadableStream` of audio bytes. Uses `eleven_flash` model.
- [ ] **A3.** `src/app/api/photos/analyze/route.ts` — POST handler accepting multipart image. For the hello-world phase: call vision, pick a hard-coded voice_id, stream TTS, respond with the audio URL after uploading to R2.
- [ ] **A4.** Minimal page UI: file upload, display identified category, play greeting audio.

## Phase B — Resolver + categories (Day 2)
- [ ] **B1.** `src/lib/specs/loader.ts` + `fingerprint.ts`.
- [ ] **B2.** `src/lib/elevenlabs/voice-design.ts` — calls `POST /v1/text-to-voice/design`, picks the first preview, returns `voice_id`.
- [ ] **B3.** `src/lib/elevenlabs/sound-effects.ts` — calls the Sound Effects endpoint, uploads result to R2, returns `r2_key`.
- [ ] **B4.** `src/lib/characters.ts` — implement the 4-branch resolver.
- [ ] **B5.** Update `/api/photos/analyze` to call `resolveCharacter` instead of the hard-coded path.
- [ ] **B6.** `scripts/bootstrap-characters.ts` — reads all specs, creates overheard + agents, writes to DB.

## Phase C — Landmarks + conversation (Day 3)
- [ ] **C1.** `src/lib/elevenlabs/agents.ts` — create/update agent: system prompt from `buildSystemPrompt`, voice_id from voice-design or landmark override.
- [ ] **C2.** `src/lib/elevenlabs/conversation.ts` — signed WebSocket URL provisioning.
- [ ] **C3.** `src/app/api/converse/start/route.ts`.
- [ ] **C4.** `src/app/api/webhooks/elevenlabs/route.ts` — post-conversation transcript persister.
- [ ] **C5.** `src/components/ConverseButton.tsx` — browser-side WS client using `@elevenlabs/client`.
- [ ] **C6.** Hook first-person landmark branch into `resolveCharacter`.

## Phase D — Pairings + polish (Day 4)
- [ ] **D1.** Update the Gemini prompt in `vision.ts` to reliably extract `secondary` when two subjects present.
- [ ] **D2.** `matchPair()` helper in `characters.ts` — normalize signatures, look up `pair_specs`.
- [ ] **D3.** `/pair/[id]/page.tsx` — dramatic unveil UI.
- [ ] **D4.** Hook #2 `pairing-signature-validator.md`.
- [ ] **D5.** MCP server under `mcp-servers/character-db/`.
- [ ] **D6.** Final polish pass — transitions, color grade, audio ducking.

## Dependencies
- Phase A must complete before B (needs the API route shell).
- Phase B depends on character-schema tasks T1-T3.
- Phase C depends on B's `voice_id` availability.
- Phase D depends on B's pair_specs being seeded.
