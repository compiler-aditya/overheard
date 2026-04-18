import "server-only";
import { randomUUID } from "node:crypto";
import { query, queryOne } from "@/lib/db";
import { loadAllSpecs, normalizeSignature } from "@/lib/specs/loader";
import { makeFingerprint } from "@/lib/specs/fingerprint";
import { designAndPickFirst } from "@/lib/elevenlabs/voice-design";
import { createAgent } from "@/lib/elevenlabs/agents";
import { generateSoundEffect } from "@/lib/elevenlabs/sound-effects";
import { ttsToBuffer } from "@/lib/elevenlabs/tts";
import { keyFor, putObject } from "@/lib/r2";
import type { CharacterRecord, Subject, VisionResult } from "@/lib/specs/types";

/** Main entry point: turn a vision result into a playable character record. */
export async function resolveCharacter(
  userId: string,
  vision: VisionResult,
  imageR2Key: string,
): Promise<CharacterRecord> {
  const specs = await loadAllSpecs();

  // 1. PAIR branch
  if (vision.secondary) {
    const pair = await findPairSpec(
      normalizeSignature(vision.primary.category),
      normalizeSignature(vision.secondary.category),
    );
    if (pair) {
      const id = await insertPairInstance(userId, pair.id, imageR2Key);
      return {
        id,
        kind: "pairing",
        display_name: pair.slug,
        voice_id: pair.voice_id,
        agent_id: pair.agent_id,
        ambient_r2_key: null,
        greeting_text: pickGreeting(specs.pairings.get(pair.slug)?.greeting_templates ?? []),
        image_r2_key: imageR2Key,
      };
    }
  }

  // 2. LANDMARK branch
  if (vision.landmark_slug) {
    const lm = await queryOne<{
      id: string; slug: string; name: string; voice_id: string; agent_id: string; ambient_r2_key: string | null;
    }>(
      "SELECT id, slug, name, voice_id, agent_id, ambient_r2_key FROM landmarks WHERE slug = $1",
      [vision.landmark_slug],
    );
    if (lm) {
      return {
        id: lm.id,
        kind: "landmark",
        display_name: lm.name,
        voice_id: lm.voice_id,
        agent_id: lm.agent_id,
        ambient_r2_key: lm.ambient_r2_key,
        greeting_text: pickGreeting(specs.landmarks.get(lm.slug)?.greeting_templates ?? []),
        image_r2_key: imageR2Key,
      };
    }
  }

  // 3. MEMORY branch
  const fp = makeFingerprint(vision.primary);
  const existing = await queryOne<{
    id: string; voice_id: string; agent_id: string; ambient_r2_key: string | null; category: string;
  }>(
    "SELECT id, voice_id, agent_id, ambient_r2_key, category FROM objects WHERE user_id = $1 AND fingerprint = $2",
    [userId, fp],
  );
  if (existing) {
    await query("UPDATE objects SET last_seen_at = NOW() WHERE id = $1", [existing.id]);
    const spec = specs.categories.get(existing.category);
    return {
      id: existing.id,
      kind: "category",
      display_name: spec?.display_name ?? existing.category,
      voice_id: existing.voice_id,
      agent_id: existing.agent_id,
      ambient_r2_key: existing.ambient_r2_key,
      greeting_text: pickGreeting(spec?.greeting_templates ?? []),
      image_r2_key: imageR2Key,
    };
  }

  // 4. NEW OBJECT branch
  const categorySlug = normalizeSignature(vision.primary.category);
  const spec = specs.categories.get(categorySlug);
  if (!spec) {
    throw new Error(`no category spec for "${categorySlug}"`);
  }
  // Voice Design requires preview_text to be 100-1000 chars; our hand-authored
  // greetings are typically ~50. Fall back to auto-generated preview text when
  // the greeting is too short.
  const firstGreeting = spec.greeting_templates[0];
  const useAuthoredPreview = firstGreeting && firstGreeting.length >= 100;
  const { voice_id } = await designAndPickFirst({
    description: spec.voice_profile.design_prompt,
    preview_text: useAuthoredPreview ? firstGreeting : undefined,
    model_id: spec.voice_profile.model_id,
    voice_name: `auris-${spec.slug}-${fp.slice(0, 8)}`,
  });
  const { agent_id } = await createAgent(spec, voice_id);
  const ambient = await generateSoundEffect({
    prompt: spec.ambient_signature.prompt,
    duration_seconds: spec.ambient_signature.duration_seconds,
  });
  const ambientKey = keyFor("ambients", `${categorySlug}-${randomUUID()}.mp3`);
  await putObject(ambientKey, ambient, "audio/mpeg");
  const greeting = pickGreeting(spec.greeting_templates);
  const greetingBuf = await ttsToBuffer(voice_id, greeting);
  const greetingKey = keyFor("greetings", `${randomUUID()}.mp3`);
  await putObject(greetingKey, greetingBuf, "audio/mpeg");

  const row = await queryOne<{ id: string }>(
    `
    INSERT INTO objects (user_id, fingerprint, category, image_r2_key, voice_id, agent_id, ambient_r2_key, display_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [userId, fp, categorySlug, imageR2Key, voice_id, agent_id, ambientKey, spec.display_name],
  );
  return {
    id: row!.id,
    kind: "category",
    display_name: spec.display_name,
    voice_id,
    agent_id,
    ambient_r2_key: ambientKey,
    greeting_text: greeting,
    image_r2_key: greetingKey, // placeholder; handler uses greetingKey for audio
  };
}

async function findPairSpec(a: string, b: string): Promise<
  | { id: string; slug: string; voice_id: string; agent_id: string }
  | null
> {
  return (
    (await queryOne(
      "SELECT id, slug, voice_id, agent_id FROM pair_specs WHERE (signature_a = $1 AND signature_b = $2) OR (signature_a = $2 AND signature_b = $1)",
      [a, b],
    )) ?? null
  );
}

async function insertPairInstance(
  userId: string,
  pairSpecId: string,
  photoKey: string,
): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO pair_instances (user_id, pair_spec_id, photo_r2_key) VALUES ($1, $2, $3) RETURNING id`,
    [userId, pairSpecId, photoKey],
  );
  if (!row) throw new Error("pair instance insert failed");
  return row.id;
}

function pickGreeting(templates: string[]): string {
  if (!templates.length) return "Hello.";
  // Deterministic-per-day: same object + same day → same greeting, different day → likely different.
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return templates[day % templates.length]!;
}

/** Convenience wrapper for categories that also need Subject context. */
export function _debug_newSubjectKey(s: Subject): string {
  return makeFingerprint(s);
}
