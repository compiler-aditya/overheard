# Pipeline — requirements

## Problem
A user takes a photo; within a few seconds they must hear a distinctive, in-character voice greeting and be able to tap to talk back. Between photo and voice live four concerns: vision identification, spec matching, voice/agent provisioning, and audio delivery. The pipeline must be fast, idempotent, and cacheable — and must gracefully degrade when any external service is slow or unreliable.

## Goal
Specify the photo-to-voice flow end-to-end, in a way that reads naturally to a judge browsing `.kiro/specs/`, and that directly corresponds to the code in `src/lib/characters.ts` + the route handler at `src/app/api/photos/analyze/route.ts`.

## User stories

**US-1 — First encounter with a new object.**
> As a user photographing a plant for the first time, I want to hear a distinctive plant-voice greeting within ~5 seconds of pressing the shutter.

Acceptance criteria:
- WHEN I upload a photo of a houseplant THEN within 5 seconds the app plays a greeting synthesized with a voice matching the `houseplant` category spec.
- WHEN the same photo is re-uploaded THEN the greeting comes from cache and plays within 1 second.

**US-2 — Returning to the same object.**
> As a user returning to my same desk plant the next day, I want the plant to be the plant I already met.

Acceptance criteria:
- WHEN I photograph an object that matches an existing `(user_id, fingerprint)` row in `objects` THEN the pipeline returns that object's `voice_id` + `agent_id` and the greeting references prior memory via the agent's memory summary.

**US-3 — Landmark identification.**
> As a user photographing the Rajwada, I want it to speak in first person as itself, not as a building-category generic voice.

Acceptance criteria:
- WHEN Gemini returns a `landmark_slug` that matches a spec in `.kiro/specs/landmarks/` THEN the landmark branch wins over the category branch and the pre-designed landmark voice is used.

**US-4 — Pair unlock.**
> As a user photographing a candle next to a mirror, I want a third emergent voice to appear that neither object has alone.

Acceptance criteria:
- WHEN Gemini returns two distinct primary subjects whose normalized signatures match a pair spec THEN the pair branch wins over both landmark and category branches, and the user is routed to the `/pair/[id]` reveal UI.

**US-5 — Talk back.**
> As a user, I want to tap "Talk back" and have a back-and-forth voice conversation with the character.

Acceptance criteria:
- WHEN I tap the Converse button THEN a signed URL is returned from `/api/converse/start` and the browser opens an ElevenLabs Conversational AI WebSocket using the character's `agent_id`.
- WHEN the conversation ends THEN the transcript is persisted to `conversations` table via the webhook endpoint.

## Non-functional requirements
- **Latency budget**: photo POST → first audio byte ≤ 5 seconds p95. New-object path may take longer on first encounter (voice design is 2-3s).
- **Idempotency**: posting the same photo twice must not create two `objects` rows. The fingerprint is the dedupe key.
- **Failure modes**:
  - Gemini down → return a friendly "I can't see right now" audio fallback.
  - Voice Design slow → fall back to a curated preset voice and log for later upgrade.
  - R2 upload fails → proceed without caching; log and alert.
- **Cost**: cache all generated audio to R2 so re-plays are free.

## Out of scope
- True visual fingerprinting for "same object" recognition across photos — we use category + attribute hashing (honest approximation).
- Rate limiting, abuse prevention — single demo account.
- Offline mode, service workers.
