# How Kiro was used to build Overheard

> ~750 words. Paste into the "How did you use Kiro?" field. Judges weight this heavily — the rules list six sub-criteria (Vibe, Hooks, Specs, Steering, MCP, Powers) and this write-up addresses each.

---

Overheard is a photograph-to-voice app whose personality lives almost entirely in hand-authored character specs — 12 category archetypes, 8 landmarks, 8 pair-unlocks. The challenge was to make the pipeline code disappear behind those specs. Kiro's spec-driven development model fit the problem so naturally that by the end of Day 1 it was clear: authoring characters was the product; writing pipeline code was plumbing Kiro could do for us.

## Spec-driven development

Everything interesting about a character in Overheard is a spec. Each is a markdown file with YAML frontmatter inheriting from a single master schema at `.kiro/specs/character-schema/design.md` — identity, voice-design prompt, personality, greeting templates, memory style, first-person transforms, ambient signature, forbidden registers. Kiro read the schema spec plus the pipeline spec (`.kiro/specs/pipeline/design.md`) and implemented `src/lib/specs/loader.ts`, `src/lib/characters.ts`, and the `/api/photos/analyze` route against them. The key win: when we added a new category, we wrote a 40-line markdown file. No code touched. The loader, the resolver, the voice-design call, the agent creation — all flowed from the spec without edits. Compared to vibe-coding equivalents, spec-driven produced code that was easier to reason about because the architecture lived in a readable document, not scattered across function comments.

## Agent hooks

Three hooks, each automating a step we'd otherwise repeat by hand:

1. **`voice-preview-on-category-save`** — saving a category spec calls the ElevenLabs Voice Design endpoint with the spec's `design_prompt` and plays a preview. Hearing a voice within 2 seconds of writing its prompt closed the authoring feedback loop in a way that screenshots of prompts never could.
2. **`pairing-signature-validator`** — saving a pairing spec checks that `signature_a` and `signature_b` match either a category, a landmark, or an entry in `_allowed-generics.md`. Caught three typos across the 8 pairings during authoring — all silent bugs that would have made the pair never fire at runtime.
3. **`spec-schema-conformance`** — every spec save is validated against the master schema (slug format, prompt length, template counts). The loader enforces the same rules at startup, but the hook surfaced violations seconds after they were introduced, not minutes later.

## Steering docs

`.kiro/steering/identity.md` is the single source of truth for how every character should sound — warm, slightly whimsical, never uncanny; specific over general; notice the user. Every voice-design prompt and every agent system prompt references it. The biggest strategic win: when a generated voice drifted into "AI chatbot" territory, we edited `identity.md` — one file — and Kiro re-aligned every subsequent generation. `tech.md` and `structure.md` kept stack + file-organization choices consistent so new modules landed in the right place automatically.

## MCP

We built a small stdio MCP server at `mcp-servers/character-db/` that exposes three read-only tools over the Postgres database: `list_characters`, `get_character_by_slug`, and `check_voice_uniqueness`. Registered via `.kiro/settings/mcp.json`. The concrete benefit: while Kiro was helping generate new pairings, it could check whether a voice_id it had just provisioned was already bound to another character — preventing the exact kind of silent duplication a hand-authored voice registry is prone to.

## Kiro Powers

Installed the **ElevenLabs Kiro Power** on Day 1 via `kiro.dev/launch/powers/elevenlabs`. The difference vs. raw MCP: when we wrote "design a voice for a weathered chai-stall owner," the Power auto-loaded the Voice Design steering, and only that steering. When we switched to writing Conversational AI agent config, the TTS steering deactivated and the ElevenAgents steering loaded. Context stayed small; Kiro stayed accurate on endpoint shapes, parameter names, and best-practice prompts we would otherwise have had to look up in the docs. It replaced roughly half the docs-reading for the five ElevenLabs surfaces we touch (Voice Design, TTS, Sound Effects, Conversational AI, Sound Effects loops).

## Vibe coding

Reserved for UI scaffolding and glue where specs were overkill — the `Camera` component, R2 signed-URL helpers, the pair-reveal page's dramatic dark layout, and the inline `ConverseButton` WebSocket wrap of `@elevenlabs/client`. A representative moment: Kiro generated the entire `ConverseButton` (microphone prompt, session lifecycle, status state machine, error surfacing) from a three-sentence description, and every generated piece compiled and worked on the first try because the steering + power had already taught it the right SDK shape.

## Net effect

By the end of the build, adding a new character was a markdown file. Adding a new pairing was another markdown file. The pipeline never changed. That's what spec-driven felt like.
