# Character schema — tasks

- [ ] **T1.** Create `src/lib/specs/types.ts` with the `CharacterSpec`, `Kind`, and helper types from `design.md`.
- [ ] **T2.** Create `src/lib/specs/loader.ts`:
  - [ ] T2.1 Install `gray-matter` dependency.
  - [ ] T2.2 Implement `loadAllSpecs()` returning `{ categories, landmarks, pairings }`.
  - [ ] T2.3 Enforce the six validation rules from `design.md`; throw with a clear path+field error.
  - [ ] T2.4 Unit test: given 3 fixture specs (one valid category, one missing field, one pairing), loader returns the valid one and throws on the invalid.
- [ ] **T3.** Create `src/lib/specs/system-prompt.ts`:
  - [ ] T3.1 Implement `buildSystemPrompt(spec: CharacterSpec, memory?: MemorySummary)` per the template in `design.md`.
  - [ ] T3.2 Unit test: snapshot test for a category, a landmark with transforms, and a pairing.
- [ ] **T4.** Create `.kiro/hooks/spec-schema-conformance.md` describing the file-save hook that runs the loader validation against the edited spec.
- [ ] **T5.** Provide three reference specs so authors have a copy-and-edit starting point:
  - [ ] T5.1 `.kiro/specs/categories/houseplant.md`
  - [ ] T5.2 `.kiro/specs/landmarks/rajwada-indore.md`
  - [ ] T5.3 `.kiro/specs/pairings/candle-mirror.md`
- [ ] **T6.** Document the schema in `README.md` under "How to add a character" (one section, <30 lines).

## Dependencies
- T2 blocks the pipeline spec's implementation (pipeline needs a populated spec map).
- T3 blocks the agents module (`src/lib/elevenlabs/agents.ts` calls `buildSystemPrompt`).
- T5 blocks Day 2 category authorship (reference provides the template).
