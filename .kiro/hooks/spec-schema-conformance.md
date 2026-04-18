---
name: spec-schema-conformance
trigger: file-save
file_pattern: ".kiro/specs/(categories|landmarks|pairings)/*.md"
action: agent-prompt
---

# Spec schema conformance check

## Purpose
Every character spec must conform to the master schema in `.kiro/specs/character-schema/design.md`. Loader-level validation runs at server startup, but that's too late when authoring a batch of specs on Day 2 or Day 3. This hook validates each spec at save time against the six rules from `character-schema/design.md`.

## Prompt to the Kiro agent

You just observed a save to `${FILE_PATH}`, which is a character spec. Do the following:

1. Read the master schema at `.kiro/specs/character-schema/design.md`.
2. Parse the YAML frontmatter of the saved file.
3. Check each rule in order, stopping at the first failure:
   - **R1.** `slug` is present, unique within its kind (scan sibling files).
   - **R2.** `voice_profile.design_prompt` is a string of 20–1000 characters.
   - **R3.** `greeting_templates` is an array with 3–5 entries.
   - **R4.** `personality.traits` is an array with 3–5 entries.
   - **R5.** For `kind: pairing`, both `signature_a` and `signature_b` are non-empty kebab-case strings.
   - **R6.** For `kind: landmark`, `first_person_transforms` has at least 3 entries (warning only).
4. On success, respond with a single line: "`<kind>/<slug>` conforms to schema v1."
5. On failure, respond with:
   > "`<kind>/<slug>` violates R<n>: <explanation>. See `.kiro/specs/character-schema/design.md` for the canonical rule."

## Guardrails
- Read-only. Never edit the spec being saved.
- Do not attempt to auto-fix. The author must correct it themselves.
