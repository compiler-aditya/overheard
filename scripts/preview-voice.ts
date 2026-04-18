/**
 * CLI to preview any category/landmark/pairing voice without running the app.
 *
 * Usage:
 *   npm exec node -- --experimental-strip-types scripts/preview-voice.ts houseplant
 *   node --experimental-strip-types scripts/preview-voice.ts categories/houseplant
 *
 * Writes the preview audio to /tmp/auris-preview-<slug>.mp3
 */

import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { loadAllSpecs } from "../src/lib/specs/loader.ts";
import { designVoice } from "../src/lib/elevenlabs/voice-design.ts";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: preview-voice.ts <slug|kind/slug>");
    process.exit(1);
  }

  const specs = await loadAllSpecs({ force: true });
  const spec =
    specs.categories.get(arg) ??
    specs.landmarks.get(arg) ??
    specs.pairings.get(arg) ??
    findByKindSlug(arg, specs);
  if (!spec) {
    console.error(`no spec for "${arg}"`);
    process.exit(1);
  }

  console.log(`previewing ${spec.kind}/${spec.slug} — "${spec.voice_profile.design_prompt.slice(0, 80).replace(/\s+/g, " ")}..."`);
  const res = await designVoice({
    description: spec.voice_profile.design_prompt,
    preview_text: spec.greeting_templates[0],
    model_id: spec.voice_profile.model_id,
  });
  const first = res.previews[0];
  if (!first?.audio_base_64) throw new Error("no audio returned");

  const outPath = `/tmp/auris-preview-${spec.slug}.mp3`;
  await writeFile(outPath, Buffer.from(first.audio_base_64, "base64"));
  console.log(`ok — voice_id=${first.generated_voice_id}`);
  console.log(`saved ${outPath}`);
}

function findByKindSlug(arg: string, specs: Awaited<ReturnType<typeof loadAllSpecs>>) {
  const m = arg.match(/^(categories|landmarks|pairings)\/(.+)$/);
  if (!m) return undefined;
  const kindKey = m[1] as keyof typeof specs;
  const slug = m[2]!;
  return specs[kindKey].get(slug);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
