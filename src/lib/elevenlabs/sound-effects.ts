const API = "https://api.elevenlabs.io/v1/sound-generation";

export interface SoundEffectsInput {
  prompt: string;
  duration_seconds?: number; // 0.5 - 22 (API limit; we default to spec value or 10)
  prompt_influence?: number; // 0-1, default 0.3
}

/** Generates a sound effect and returns the raw audio bytes (mp3). */
export async function generateSoundEffect(input: SoundEffectsInput): Promise<Buffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  const body: Record<string, unknown> = {
    text: input.prompt,
    prompt_influence: input.prompt_influence ?? 0.3,
  };
  if (typeof input.duration_seconds === "number") {
    body.duration_seconds = Math.min(Math.max(input.duration_seconds, 0.5), 22);
  }
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Sound Effects ${res.status}: ${t.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
