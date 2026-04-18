# Character schema — requirements

## Problem
Overheard will have dozens of distinct characters across three types: category archetypes (12), famous landmarks (8), and pair-unlock overheard (8). Each must be hand-authored for personality, yet they all flow through a single pipeline: vision result → spec match → voice generation → greeting → conversation. Without a shared schema, every new character becomes a special case, pipeline code forks, and we lose the benefit of spec-driven development.

## Goal
Define one canonical schema every character inherits from. Make it small enough to author a new character in under 10 minutes, rich enough to drive Voice Design, Conversational AI, and Sound Effects without custom per-character code.

## User stories

**US-1 — Authoring a new category.**
> As the developer authoring a new category archetype, I want to write a single markdown file following a known shape so that the pipeline picks it up without any code changes.

Acceptance criteria:
- WHEN I save a new file at `.kiro/specs/categories/<slug>.md` with the required YAML frontmatter fields THEN the bootstrap script creates an ElevenLabs voice + agent from the spec and seeds the database with a record keyed by `<slug>`.
- WHEN a field is missing from the spec THEN the schema-conformance hook flags the spec as invalid before it reaches the pipeline.

**US-2 — First-person landmark authoring.**
> As the author of a landmark spec, I want a standard place to describe how to transform historical facts into first-person lived experience, so that every landmark speaks as itself rather than reciting a Wikipedia entry.

Acceptance criteria:
- WHEN a landmark spec includes at least three `first_person_transforms` entries THEN the agent system prompt generator embeds them verbatim.
- WHEN a landmark spec omits `first_person_transforms` entirely THEN the generator falls back to the identity steering doc's rules — but the hook emits a warning.

**US-3 — Pair unlock authoring.**
> As the author of a pair-unlock spec, I want to describe the two object signatures that summon the emergent voice plus the voice itself, so that the pair detector can match it without any custom pairing code per file.

Acceptance criteria:
- WHEN a pair spec includes `signature_a` and `signature_b` that refer to existing category slugs or normalized subject strings THEN the pair detection branch can match a photo containing both subjects.
- WHEN both signatures match a photo THEN the emergent voice (pre-designed at bootstrap) is used, not re-generated on the fly.

**US-4 — Schema extension without breaking specs.**
> As the developer, I want to be able to add optional fields to the schema later without invalidating existing specs.

Acceptance criteria:
- All non-core fields are optional. Adding new optional fields in the loader does not require existing specs to be re-authored.

## Non-functional requirements
- Spec authoring must be possible in any editor — no custom DSL.
- The loader must be pure: given a markdown file with frontmatter + body, it returns a `CharacterSpec` object with no side effects.
- The schema is versioned via `schema_version` in frontmatter (default `1`).

## Out of scope
- UI for editing specs.
- Migration tooling between schema versions (manual for the hackathon).
- Cross-spec inheritance beyond the schema master (e.g., "this landmark inherits from another landmark"). Not needed for 16 characters.
