import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./system-prompt.js";
import type { CharacterSpec } from "./types.js";

const plant: CharacterSpec = {
  schema_version: 1,
  kind: "category",
  slug: "houseplant",
  display_name: "Houseplant",
  archetype: "an observant houseplant",
  era_or_age: "middle-aged, in plant years",
  voice_profile: {
    design_prompt: "a quiet patient voice".repeat(3),
    model_id: "eleven_multilingual_ttv_v2",
  },
  personality: {
    traits: ["observant", "gentle", "patient"],
    speaking_quirks: ["notices small changes"],
    emotional_baseline: "patient curiosity",
  },
  greeting_templates: ["g1", "g2", "g3"],
  memory_style: "notices patterns across days",
  first_person_transforms: [],
  ambient_signature: { prompt: "room tone", duration_seconds: 10 },
  forbidden_registers: ["cheeky", "moralizing"],
};

const landmark: CharacterSpec = {
  ...plant,
  kind: "landmark",
  slug: "rajwada",
  display_name: "Rajwada",
  first_person_transforms: [
    { fact: "Built in 1747.", voiced: "I was raised in 1747, when the lamps were first lit." },
    { fact: "Rebuilt after fires.", voiced: "I have burned three times." },
    { fact: "Blend of styles.", voiced: "I am a conversation between Maratha and Mughal." },
  ],
};

describe("buildSystemPrompt", () => {
  it("includes character basics for a category", () => {
    const out = buildSystemPrompt(plant);
    expect(out).toContain("You are Houseplant");
    expect(out).toContain("observant, gentle, patient");
    expect(out).toContain("patient curiosity");
    expect(out).toContain("Do not: cheeky, moralizing");
  });

  it("adds first-person transforms for landmarks", () => {
    const out = buildSystemPrompt(landmark);
    expect(out).toContain("apply these transforms");
    expect(out).toContain("I was raised in 1747");
  });

  it("is deterministic — same input, same output", () => {
    expect(buildSystemPrompt(plant)).toBe(buildSystemPrompt(plant));
  });

  it("embeds memory when provided", () => {
    const out = buildSystemPrompt(plant, {
      known_for: "forgetting to water me on weekends",
      last_interactions: ["you apologized for the trip"],
    });
    expect(out).toContain("forgetting to water me");
    expect(out).toContain("you apologized for the trip");
  });
});
