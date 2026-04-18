import { describe, it, expect } from "vitest";
import { loadAllSpecs } from "./loader.js";

describe("loadAllSpecs", () => {
  it("loads all 12 category specs without errors", async () => {
    const specs = await loadAllSpecs({ force: true });
    expect(specs.categories.size).toBe(12);
    for (const slug of [
      "houseplant",
      "appliance",
      "furniture",
      "vehicle",
      "food",
      "tool",
      "accessory",
      "building",
      "landscape",
      "street-object",
      "animal",
      "artwork",
    ]) {
      expect(specs.categories.has(slug)).toBe(true);
    }
  });

  it("loads at least one landmark spec", async () => {
    const specs = await loadAllSpecs({ force: true });
    expect(specs.landmarks.size).toBeGreaterThanOrEqual(1);
    expect(specs.landmarks.has("rajwada-indore")).toBe(true);
  });

  it("loads at least one pairing spec with valid signatures", async () => {
    const specs = await loadAllSpecs({ force: true });
    expect(specs.pairings.size).toBeGreaterThanOrEqual(1);
    const candleMirror = specs.pairings.get("candle-mirror");
    expect(candleMirror?.signature_a).toBe("candle");
    expect(candleMirror?.signature_b).toBe("mirror");
  });

  it("every spec has a 20-1000 char voice_profile.design_prompt", async () => {
    const specs = await loadAllSpecs({ force: true });
    for (const kind of ["categories", "landmarks", "pairings"] as const) {
      for (const [slug, spec] of specs[kind]) {
        const len = spec.voice_profile.design_prompt.length;
        expect(len, `${kind}/${slug} design_prompt length`).toBeGreaterThanOrEqual(20);
        expect(len, `${kind}/${slug} design_prompt length`).toBeLessThanOrEqual(1000);
      }
    }
  });
});
