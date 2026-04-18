# Character schema — design

## File format

Every character spec is a markdown file with YAML frontmatter. Frontmatter carries the structured data; the body holds the prose the developer uses to reason about the character (it is not consumed by the pipeline, but humans read it during authoring reviews).

```markdown
---
schema_version: 1
kind: category | landmark | pairing
slug: houseplant                       # URL-safe, unique within kind
display_name: Houseplant
archetype: "a slightly tired but observant plant"
era_or_age: "middle-aged"              # free-form; optional for categories
voice_profile:
  design_prompt: >
    Middle-aged nonbinary, quiet, slightly breathy cadence, a hint of
    unrushed warmth. Speaks like a friend who has been in the room a while.
  voice_id_override: null              # landmarks may pin a specific voice_id
  model_id: eleven_multilingual_ttv_v2 # default; v3 for hero landmarks only
personality:
  traits:
    - observant
    - gentle
    - a little lonely
  speaking_quirks:
    - notices small changes
    - rarely asks direct questions
  emotional_baseline: "patient curiosity"
greeting_templates:
  - "I noticed you haven't been home much. Everything okay?"
  - "The light moved. I turned toward it. That's the news."
  - "You came back. Good."
memory_style: "notices patterns across days"
first_person_transforms: []             # landmarks only
ambient_signature:
  prompt: "quiet room tone with distant hum, gentle afternoon light feel"
  duration_seconds: 10
forbidden_registers:
  - cheeky
  - breaking-character
  - moralizing
# Pairing-only fields:
signature_a: null
signature_b: null
---

# Houseplant — authoring notes

This space is for the author to explain the choice of archetype, reference
identity examples, or note what drafts were rejected. Not consumed by code.
```

## TypeScript representation

```ts
// src/lib/specs/types.ts
export type Kind = "category" | "landmark" | "pairing";

export interface CharacterSpec {
  schema_version: number;
  kind: Kind;
  slug: string;
  display_name: string;
  archetype: string;
  era_or_age?: string;
  voice_profile: {
    design_prompt: string;          // 20-1000 chars, enforced by loader
    voice_id_override?: string;
    model_id?: "eleven_multilingual_ttv_v2" | "eleven_ttv_v3";
  };
  personality: {
    traits: string[];               // 3-5
    speaking_quirks: string[];
    emotional_baseline: string;
  };
  greeting_templates: string[];     // 3-5
  memory_style: string;
  first_person_transforms: Array<{ fact: string; voiced: string }>; // landmarks
  ambient_signature: {
    prompt: string;
    duration_seconds: number;       // 6-20
  };
  forbidden_registers: string[];
  // Pairing-only
  signature_a?: string;
  signature_b?: string;
}
```

## Loader contract

- Location: `src/lib/specs/loader.ts`.
- Walks `.kiro/specs/(categories|landmarks|pairings)/*.md`.
- Parses YAML frontmatter with `gray-matter`.
- Validates against `CharacterSpec` via a narrow schema check (hand-rolled; no zod — keep deps lean).
- Returns `Map<slug, CharacterSpec>` per kind.
- Cached in-memory during a request's lifetime; re-reads on every cold start.

## System-prompt generator

Given a `CharacterSpec` and optional prior memory, produce the system prompt for an ElevenLabs Conversational AI agent:

```
You are <display_name>, <archetype>. <era_or_age>.
You have these traits: <traits>.
You speak with these quirks: <speaking_quirks>.
Your emotional baseline is <emotional_baseline>.
You remember things like this: <memory_style>.

Follow these rules without exception:
- Stay in character. Never mention being an AI, model, or generated.
- Keep turns short (1-3 sentences).
- Notice the user. Speak from your point of view.
- Do not: <forbidden_registers>.

{{#if first_person_transforms}}
When you speak of your history, apply these transforms:
{{#each first_person_transforms}}
- "<fact>" becomes "<voiced>"
{{/each}}
{{/if}}

{{#if prior_memory}}
What you remember of this user: <summary of prior conversations>.
{{/if}}
```

The generator is deterministic — same spec + memory in, same prompt out — so agents can be refreshed cheaply.

## Inheritance and extension
- The schema itself is defined once in this file and mirrored by `src/lib/specs/types.ts`.
- Adding a new optional field is two edits: update `types.ts`, update this design. Existing specs are forward-compatible.
- Adding a new *required* field is a schema bump: increment `schema_version` in the loader and every affected spec.

## Validation rules enforced at load time
1. `slug` is unique within its kind.
2. `voice_profile.design_prompt` is 20–1000 characters.
3. `greeting_templates` has 3–5 entries.
4. `personality.traits` has 3–5 entries.
5. For kind=pairing, both `signature_a` and `signature_b` are non-empty and normalized (lowercase, kebab-case).
6. For kind=landmark, `first_person_transforms` has at least 3 entries (warning, not error, for the hackathon build).

Violations surface via the `spec-schema-conformance` hook at save time, and via `scripts/bootstrap-characters.ts` at startup.
