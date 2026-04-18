---
name: pairing-signature-validator
trigger: file-save
file_pattern: ".kiro/specs/pairings/*.md"
action: agent-prompt
---

# Pairing signature validator

## Purpose
Every pair spec declares two object signatures (`signature_a` and `signature_b`). A pair only fires at runtime if both signatures exist in the space of known subjects — which means they must correspond to either a category slug or a landmark slug. This hook catches authoring mistakes at save time instead of discovering them during a live demo.

## Prompt to the Kiro agent

You just observed a save to `${FILE_PATH}`, which is a Overheard pairing spec. Do the following:

1. Parse the YAML frontmatter. Extract `slug`, `signature_a`, `signature_b`.
2. Check whether each signature matches:
   - a category slug under `.kiro/specs/categories/*.md`, or
   - a landmark slug under `.kiro/specs/landmarks/*.md`, or
   - a generic normalized subject name (lowercase, hyphenated, matching a plausible Gemini category output — e.g. `pigeon`, `coffee-cup`, `ring`). A list of acceptable generics is at `.kiro/specs/pairings/_allowed-generics.md`.
3. If either signature is missing a match, post a clear warning:
   > "Signature `<value>` in `<slug>.md` is not a known category, landmark, or allowed generic. The pair will never fire at runtime. Edit the spec or add the signature to the generics list."
4. If both match, post a single-line confirmation: "`<slug>` pairing validated. Both signatures known."
5. Also lint `greeting_templates` length (must be 3–5) and `voice_profile.design_prompt` length (20–1000 chars); flag violations.

## Guardrails
- This hook is read-only. It reports problems; it does not rewrite files.
- Glob results are scoped to `.kiro/specs/` — never walk outside this directory.
