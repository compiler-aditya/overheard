import { createHash } from "node:crypto";
import type { Subject } from "./types.js";

export function makeFingerprint(subject: Subject): string {
  const parts = [subject.category, ...subject.attributes]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort();
  const normalized = parts.join("|");
  return createHash("sha1").update(normalized).digest("hex").slice(0, 16);
}
