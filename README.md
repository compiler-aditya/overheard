# Auris

> Photograph anything. Hear what it has to say.

Auris is a voice-first web app where any photograph becomes a character with its own voice, personality, and memory. Your couch speaks in a tired voice. The Taj Mahal speaks in first person about what it has seen. A pigeon on the sidewalk speaks like a New York wise-guy. Some objects remember you across days. And when you photograph two things together, sometimes a third, rare voice emerges that neither object has alone.

Built for the [ElevenLabs × Kiro Hackathon](https://kiro.devpost.com) with Kiro's spec-driven development and ElevenLabs' audio APIs.

## Core mechanics

1. **Photograph to voice** — snap any object, hear a distinctive character voice
2. **Persistent memory** — re-photographing an object brings back the same voice and remembers prior conversations
3. **Famous landmark mode** — hand-authored landmark specs speak in first person with era-aware memory
4. **Pairing unlocks** — photograph two things together; rare combinations summon a third emergent voice
5. **Conversation** — tap-to-speak with any character via ElevenLabs Conversational AI
6. **Ambient audio** — each character has a generated ambient bed (traffic, wind, room hum)

## Tech stack

- **Frontend**: Next.js 15 (App Router, TypeScript)
- **Compute**: GCP Cloud Run
- **Database**: Postgres on Cloud SQL
- **File storage**: Cloudflare R2
- **Vision**: Gemini 2.5 Flash (Google AI Studio)
- **Audio**: ElevenLabs — Voice Design, TTS, Conversational AI, Sound Effects
- **Authored with**: [Kiro](https://kiro.dev) + the [ElevenLabs Kiro Power](https://kiro.dev/launch/powers/elevenlabs)

## How to test (for judges)

Live demo: _TBD — deployed URL added before submission_

The demo account is already logged in — no signup flow. To exercise the product:

1. Open the live URL on a phone (camera access) or desktop (upload fallback).
2. **Photograph any object** — a plant, a mug, a chair. Expect a distinctive voice + soft ambient bed.
3. **Tap "Talk back"** to have a spoken conversation with the character.
4. **Photograph a landmark** — see `public/samples/` for reference images if you're not near one.
5. **Photograph a paired combination** — a candle + mirror, or a pen + blank paper — to trigger the rare pair unlock.

## Repository structure

```
.kiro/              # specs, hooks, steering, MCP config (Kiro's source of truth)
mcp-servers/        # custom MCP server (character database)
src/app/            # Next.js routes + API handlers
src/lib/            # vision, elevenlabs, spec loader, db, r2
scripts/            # migrations, bootstrap, seed
```

The full `/.kiro` directory is the source of truth — read `steering/product.md` for the concept and `specs/pipeline/design.md` for the end-to-end flow.

## How to add a character

Authoring a new character means writing a single markdown file — no code change. The bootstrap script picks it up automatically on next run.

1. Pick the kind: `category` (archetype for unknown objects), `landmark` (a famous named place), or `pairing` (a rare two-object combo that triggers an emergent voice).
2. Create `.kiro/specs/<kind>s/<slug>.md`, following the frontmatter shape defined in [`.kiro/specs/character-schema/design.md`](./.kiro/specs/character-schema/design.md). Copy the reference spec for that kind as a starting point:
   - Category: [`houseplant.md`](./.kiro/specs/categories/houseplant.md)
   - Landmark: [`rajwada-indore.md`](./.kiro/specs/landmarks/rajwada-indore.md)
   - Pairing: [`candle-mirror.md`](./.kiro/specs/pairings/candle-mirror.md)
3. Save. Kiro hooks will:
   - Validate the file against the master schema (`.kiro/hooks/spec-schema-conformance.md`).
   - For categories, preview the voice so you can hear it (`.kiro/hooks/voice-preview-on-category-save.md`).
   - For pairings, validate both signatures exist (`.kiro/hooks/pairing-signature-validator.md`).
4. Run `npm run bootstrap` to create the ElevenLabs voice + agent for any new specs and seed the database.

Every field is documented in `.kiro/specs/character-schema/design.md`. The tonal identity every voice must match is in `.kiro/steering/identity.md`.

## Local setup

```bash
npm install
cp .env.example .env.local  # then fill in keys
npm run db:migrate
npm run bootstrap           # creates ElevenLabs voices + agents for all specs
npm run dev                 # http://localhost:3000
```

Required environment variables are documented in `.env.example`.

## License

[MIT](./LICENSE)
