import { describe, it, expect } from "vitest";
import { makeFingerprint } from "./fingerprint.js";

describe("makeFingerprint", () => {
  it("is order-independent", () => {
    const a = makeFingerprint({
      category: "houseplant",
      attributes: ["green", "ceramic-pot", "small"],
      confidence: 0.9,
    });
    const b = makeFingerprint({
      category: "houseplant",
      attributes: ["small", "green", "ceramic-pot"],
      confidence: 0.7,
    });
    expect(a).toBe(b);
  });

  it("is case-insensitive", () => {
    const a = makeFingerprint({
      category: "Houseplant",
      attributes: ["Green", "Small"],
      confidence: 1,
    });
    const b = makeFingerprint({
      category: "houseplant",
      attributes: ["green", "small"],
      confidence: 1,
    });
    expect(a).toBe(b);
  });

  it("differs for different categories", () => {
    const a = makeFingerprint({ category: "houseplant", attributes: ["green"], confidence: 1 });
    const b = makeFingerprint({ category: "furniture", attributes: ["green"], confidence: 1 });
    expect(a).not.toBe(b);
  });

  it("returns a 16-char hex string", () => {
    const f = makeFingerprint({ category: "x", attributes: [], confidence: 0 });
    expect(f).toMatch(/^[0-9a-f]{16}$/);
  });
});
