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

  it("loads all 8 landmark specs", async () => {
    const specs = await loadAllSpecs({ force: true });
    expect(specs.landmarks.size).toBe(8);
    for (const slug of [
      "taj-mahal",
      "rajwada-indore",
      "gateway-of-india",
      "red-fort",
      "chai-stall",
      "banyan-tree",
      "arabian-sea",
      "indian-railway-station",
    ]) {
      expect(specs.landmarks.has(slug)).toBe(true);
    }
  });

  it("every landmark has at least 3 first_person_transforms", async () => {
    const specs = await loadAllSpecs({ force: true });
    for (const [slug, spec] of specs.landmarks) {
      expect(spec.first_person_transforms.length, `${slug} transforms`).toBeGreaterThanOrEqual(3);
    }
  });

  it("loads all 8 pairing specs with valid signatures", async () => {
    const specs = await loadAllSpecs({ force: true });
    expect(specs.pairings.size).toBe(8);
    for (const [slug, spec] of specs.pairings) {
      expect(typeof spec.signature_a, `${slug} signature_a`).toBe("string");
      expect(typeof spec.signature_b, `${slug} signature_b`).toBe("string");
    }
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
