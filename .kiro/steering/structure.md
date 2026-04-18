---
inclusion: always
---

# Overheard — file & directory conventions

## Top-level layout
```
.kiro/              Source of truth for product (specs, hooks, steering, MCP)
mcp-servers/        Custom MCP servers (one folder per server)
src/
  app/              Next.js App Router pages + API routes
  components/       React client components (PascalCase)
  lib/              Server and shared utilities (kebab-case files)
    elevenlabs/     All ElevenLabs API clients (one file per capability)
    specs/          Spec loader + fingerprinting
scripts/            One-shot scripts: migrations, bootstrap, seed
public/
  samples/          Reference photos for judges to download + use
```

## .kiro/ internal layout
```
.kiro/
├── steering/       Always-loaded guidance (product, tech, structure, identity)
├── specs/
│   ├── pipeline/            Three-file spec (requirements, design, tasks) for the end-to-end flow
│   ├── character-schema/    Master spec every character inherits
│   ├── categories/          12 category archetype specs (one file each)
│   ├── landmarks/           8 hand-authored famous-landmark specs
│   └── pairings/            8 rare pair-unlock specs
├── hooks/          Agent hooks (one markdown file per hook)
└── settings/
    └── mcp.json    MCP server registration (character-db + ElevenLabs Power)
```

## Naming conventions
- Spec files: kebab-case, one concept per file (`houseplant.md`, `taj-mahal.md`, `candle-mirror.md`).
- Hook files: kebab-case describing the trigger-and-action (`voice-preview-on-category-save.md`).
- TypeScript modules: kebab-case (`voice-design.ts`), one primary export or cohesive small group.
- React components: PascalCase matching the exported component (`CharacterBubble.tsx`).
- API route handlers: always `route.ts` inside a folder matching the endpoint path.

## Import ordering
1. Node / external packages
2. `@/lib/**` (server utilities)
3. `@/components/**`
4. Relative imports

## Where new things go
- **A new category voice** → add a spec at `.kiro/specs/categories/<slug>.md`. The bootstrap script picks it up. No code change required.
- **A new landmark** → add a spec at `.kiro/specs/landmarks/<slug>.md`.
- **A new pair rule** → add a spec at `.kiro/specs/pairings/<slug>.md`. The hook validates both signatures exist.
- **A new ElevenLabs capability** → add a module at `src/lib/elevenlabs/<capability>.ts` and register it in `src/lib/elevenlabs/index.ts`.
- **A new Kiro hook** → add a spec at `.kiro/hooks/<name>.md`.

## What lives in the database vs. in specs
- Specs describe **intent** (personality, voice design prompt, ambient description). Committed to git.
- Database stores **realization** (voice_id returned by ElevenLabs, agent_id, R2 keys for cached audio, per-user object instances). Populated by the bootstrap script and runtime.

## Never commit
- `node_modules/`, build artifacts, `.env*`, secrets.
- Generated audio from local testing (keep R2 as the source of truth).

## Must commit
- **Every file under `.kiro/`** — rule #54 of `kiro_rules.md` requires this directory to be visible in the public repo. Do not add it to `.gitignore`. Do not rename it.
