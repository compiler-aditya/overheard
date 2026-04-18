---
inclusion: always
---

# Overheard — tech stack steering

Kiro should default to these choices unless there is a compelling reason to deviate. Deviations must be flagged in chat.

## Frontend
- **Framework**: Next.js 15 (App Router) with TypeScript (`strict: true`).
- **Rendering**: Server Components by default; Client Components only for interactivity (`Camera`, `CharacterBubble`, `ConverseButton`).
- **Styling**: Tailwind CSS. Avoid CSS-in-JS libraries. Use simple CSS variables for the warm color palette.
- **Package manager**: `npm` (pnpm preferred in plan but not required).
- **Node**: 20+.

## Backend / API
- Next.js route handlers in `src/app/api/**/route.ts`. No separate backend framework.
- Database layer: `pg` (node-postgres). No ORM — handwritten SQL in `src/lib/db.ts` with typed query helpers.
- File storage: Cloudflare R2 via the S3-compatible API (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).

## External services
- **Vision**: Google AI Studio — Gemini 2.5 Flash. REST via `fetch`; no SDK dependency.
- **ElevenLabs**:
  - Voice Design: `POST https://api.elevenlabs.io/v1/text-to-voice/design`
  - TTS (streaming): `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`
  - Conversational AI agent create: `POST https://api.elevenlabs.io/v1/convai/agents/create`
  - Conversational AI WebSocket: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}`
  - Sound Effects: `POST https://api.elevenlabs.io/v1/sound-generation`
  - Auth header: `xi-api-key: <key>` on every request.
- **SDK use**: prefer official `@elevenlabs/client` for the browser Conversational AI connection. Node-side calls use plain `fetch` to keep the dependency footprint small.

## Runtime / deploy
- **Compute**: GCP Cloud Run, `min-instances=1` during the judging window to avoid cold starts.
- **Database**: Cloud SQL Postgres (shared demo account; connection via Cloud SQL Auth Proxy locally, unix socket in Cloud Run).
- **Region**: `asia-south1` (Mumbai) to minimize latency to Indore.

## Secrets and env
All secrets come from environment variables loaded via `process.env`. Never hardcode keys. Required keys are documented in `.env.example`. For deployed environments, store in GCP Secret Manager and inject into Cloud Run.

Required env:
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`
- `DATABASE_URL`
- `DEMO_USER_HANDLE` (defaults to `demo`)

## Code conventions
- Server-only modules live under `src/lib/`. Import `"server-only"` where appropriate.
- API route handlers: always return `NextResponse.json(...)`. Never leak stack traces.
- Error handling at boundaries: catch external-service errors in `src/lib/`, surface typed `Result<T>` or throw named errors.
- No default exports for modules with a single named function — use named exports.
- File names: `kebab-case.ts` for lib modules, `PascalCase.tsx` for components, lowercase `route.ts` / `page.tsx` for Next.js.

## What to avoid
- No Prisma, no Drizzle, no ORMs (keeps hackathon build lean).
- No Redux / Zustand — React state + URL state is enough.
- No auth libraries — single shared demo account keyed by a signed cookie.
- No real-time DB pub/sub — conversation state lives in Postgres + ElevenLabs.
