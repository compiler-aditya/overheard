/**
 * Reads every spec under .kiro/specs/, provisions ElevenLabs voices + agents
 * for landmarks and pairings (one-shot, cached in Postgres), and ensures the
 * shared demo user exists.
 *
 * Categories are NOT bootstrapped — their voices are designed per-object at
 * runtime inside src/lib/characters.ts (so two photographed plants each get
 * a slightly different voice, instead of one shared plant voice).
 *
 * Run:
 *   npm run db:migrate && npm run bootstrap
 */

import "dotenv/config";
import pg from "pg";
import { loadAllSpecs } from "../src/lib/specs/loader.ts";
import { buildSystemPrompt } from "../src/lib/specs/system-prompt.ts";
import { designAndPickFirst } from "../src/lib/elevenlabs/voice-design.ts";
import { generateSoundEffect } from "../src/lib/elevenlabs/sound-effects.ts";
import type { CharacterSpec } from "../src/lib/specs/types.ts";

const ELEVENLABS_API = "https://api.elevenlabs.io";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!dbUrl || !apiKey) {
    console.error("DATABASE_URL and ELEVENLABS_API_KEY are required");
    process.exit(1);
  }

  const db = new pg.Client({ connectionString: dbUrl });
  await db.connect();
  try {
    await ensureDemoUser(db);
    const specs = await loadAllSpecs({ force: true });

    console.log(`loaded ${specs.categories.size} categories, ${specs.landmarks.size} landmarks, ${specs.pairings.size} pairings`);

    for (const spec of specs.landmarks.values()) {
      await upsertLandmark(db, spec, apiKey);
    }
    for (const spec of specs.pairings.values()) {
      await upsertPairSpec(db, spec, apiKey);
    }
    console.log("bootstrap complete");
  } finally {
    await db.end();
  }
}

async function ensureDemoUser(db: pg.Client) {
  const handle = process.env.DEMO_USER_HANDLE ?? "demo";
  await db.query(
    `INSERT INTO users (handle) VALUES ($1) ON CONFLICT (handle) DO NOTHING`,
    [handle],
  );
}

async function upsertLandmark(db: pg.Client, spec: CharacterSpec, apiKey: string) {
  const existing = await db.query<{ voice_id: string; agent_id: string }>(
    "SELECT voice_id, agent_id FROM landmarks WHERE slug = $1",
    [spec.slug],
  );
  if (existing.rows.length) {
    console.log(`[skip] landmark ${spec.slug} already bootstrapped`);
    return;
  }
  const voice_id = await ensureVoice(spec, apiKey);
  const agent_id = await createAgent(spec, voice_id, apiKey);
  const ambient_r2_key: string | null = null; // Ambient upload deferred to per-request for MVP.
  await db.query(
    `INSERT INTO landmarks (slug, name, spec_path, voice_id, agent_id, ambient_r2_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (slug) DO UPDATE SET
       voice_id = EXCLUDED.voice_id,
       agent_id = EXCLUDED.agent_id,
       updated_at = NOW()`,
    [spec.slug, spec.display_name, `.kiro/specs/landmarks/${spec.slug}.md`, voice_id, agent_id, ambient_r2_key],
  );
  console.log(`[landmark] ${spec.slug} voice=${voice_id} agent=${agent_id}`);
}

async function upsertPairSpec(db: pg.Client, spec: CharacterSpec, apiKey: string) {
  if (!spec.signature_a || !spec.signature_b) {
    console.warn(`[skip] pairing ${spec.slug} missing signatures`);
    return;
  }
  const existing = await db.query<{ voice_id: string }>(
    "SELECT voice_id FROM pair_specs WHERE slug = $1",
    [spec.slug],
  );
  if (existing.rows.length) {
    console.log(`[skip] pairing ${spec.slug} already bootstrapped`);
    return;
  }
  const voice_id = await ensureVoice(spec, apiKey);
  const agent_id = await createAgent(spec, voice_id, apiKey);
  await db.query(
    `INSERT INTO pair_specs (slug, signature_a, signature_b, spec_path, voice_id, agent_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (slug) DO UPDATE SET
       signature_a = EXCLUDED.signature_a,
       signature_b = EXCLUDED.signature_b,
       voice_id = EXCLUDED.voice_id,
       agent_id = EXCLUDED.agent_id,
       updated_at = NOW()`,
    [
      spec.slug,
      spec.signature_a,
      spec.signature_b,
      `.kiro/specs/pairings/${spec.slug}.md`,
      voice_id,
      agent_id,
    ],
  );
  console.log(`[pairing] ${spec.slug} voice=${voice_id} agent=${agent_id}`);
}

async function ensureVoice(spec: CharacterSpec, _apiKey: string): Promise<string> {
  if (spec.voice_profile.voice_id_override) return spec.voice_profile.voice_id_override;
  const { voice_id } = await designAndPickFirst({
    description: spec.voice_profile.design_prompt,
    preview_text: spec.greeting_templates[0],
    model_id: spec.voice_profile.model_id,
  });
  return voice_id;
}

async function createAgent(
  spec: CharacterSpec,
  voice_id: string,
  apiKey: string,
): Promise<string> {
  const prompt = buildSystemPrompt(spec);
  const res = await fetch(`${ELEVENLABS_API}/v1/convai/agents/create`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `auris-${spec.kind}-${spec.slug}`.slice(0, 60),
      conversation_config: {
        agent: {
          prompt: { prompt },
          first_message: spec.greeting_templates[0],
          language: "en",
        },
        tts: {
          voice_id,
          model_id: "eleven_flash_v2_5",
          stability: 0.5,
          similarity_boost: 0.75,
        },
        asr: { quality: "high", provider: "elevenlabs" },
      },
      tags: ["auris", spec.kind, spec.slug],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Agent create ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = (await res.json()) as { agent_id: string };
  return data.agent_id;
}

// Silence unused-symbol lint for generateSoundEffect (reserved for future ambient upload step).
void generateSoundEffect;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
