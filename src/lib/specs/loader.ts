import "server-only";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import type { CharacterSpec, Kind } from "./types.js";

const SPECS_ROOT = join(process.cwd(), ".kiro", "specs");

export interface LoadedSpecs {
  categories: Map<string, CharacterSpec>;
  landmarks: Map<string, CharacterSpec>;
  pairings: Map<string, CharacterSpec>;
}

let cache: LoadedSpecs | null = null;

export async function loadAllSpecs(opts: { force?: boolean } = {}): Promise<LoadedSpecs> {
  if (cache && !opts.force) return cache;
  const [categories, landmarks, pairings] = await Promise.all([
    loadKind("category"),
    loadKind("landmark"),
    loadKind("pairing"),
  ]);
  cache = { categories, landmarks, pairings };
  return cache;
}

async function loadKind(kind: Kind): Promise<Map<string, CharacterSpec>> {
  const dir = join(SPECS_ROOT, kindDir(kind));
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return new Map();
  }
  const specs = new Map<string, CharacterSpec>();
  for (const name of files) {
    if (!name.endsWith(".md")) continue;
    if (name.startsWith("_")) continue; // skip helper files like _allowed-generics.md
    const full = join(dir, name);
    const raw = await readFile(full, "utf8");
    const { data } = matter(raw);
    const spec = validate(data, kind, full);
    if (specs.has(spec.slug)) {
      throw new Error(`duplicate slug "${spec.slug}" in ${kind}`);
    }
    specs.set(spec.slug, spec);
  }
  return specs;
}

function kindDir(kind: Kind): string {
  return kind === "category" ? "categories" : kind === "landmark" ? "landmarks" : "pairings";
}

function validate(data: Record<string, unknown>, expectedKind: Kind, path: string): CharacterSpec {
  const err = (msg: string) => new Error(`${path}: ${msg}`);

  if (data.kind !== expectedKind) {
    throw err(`expected kind=${expectedKind}, got ${String(data.kind)}`);
  }
  if (typeof data.slug !== "string" || !/^[a-z0-9-]+$/.test(data.slug)) {
    throw err("slug must be kebab-case");
  }
  if (typeof data.display_name !== "string") throw err("display_name required");
  if (typeof data.archetype !== "string") throw err("archetype required");

  const vp = (data.voice_profile ?? {}) as Record<string, unknown>;
  if (typeof vp.design_prompt !== "string") throw err("voice_profile.design_prompt required");
  if (vp.design_prompt.length < 20 || vp.design_prompt.length > 1000) {
    throw err("voice_profile.design_prompt must be 20-1000 chars");
  }

  const personality = (data.personality ?? {}) as Record<string, unknown>;
  if (!Array.isArray(personality.traits) || personality.traits.length < 3 || personality.traits.length > 5) {
    throw err("personality.traits must have 3-5 entries");
  }

  if (
    !Array.isArray(data.greeting_templates) ||
    data.greeting_templates.length < 3 ||
    data.greeting_templates.length > 5
  ) {
    throw err("greeting_templates must have 3-5 entries");
  }

  if (expectedKind === "pairing") {
    if (typeof data.signature_a !== "string" || typeof data.signature_b !== "string") {
      throw err("pairing requires signature_a + signature_b");
    }
  }

  return data as unknown as CharacterSpec;
}

/** Normalize a raw category/subject string from Gemini into a canonical lookup key. */
export function normalizeSignature(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}
