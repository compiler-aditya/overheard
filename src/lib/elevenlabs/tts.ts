import "server-only";

const API_BASE = "https://api.elevenlabs.io";

export interface TtsOptions {
  model_id?: "eleven_flash_v2_5" | "eleven_multilingual_v2" | "eleven_v3";
  stability?: number;
  similarity_boost?: number;
  output_format?:
    | "mp3_44100_128"
    | "mp3_44100_64"
    | "mp3_22050_32"
    | "pcm_16000";
}

/** Streams audio bytes for a line spoken in the given voice. */
export async function streamTts(
  voiceId: string,
  text: string,
  opts: TtsOptions = {},
): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  const url = new URL(`${API_BASE}/v1/text-to-speech/${voiceId}/stream`);
  if (opts.output_format) url.searchParams.set("output_format", opts.output_format);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: opts.model_id ?? "eleven_flash_v2_5",
      voice_settings: {
        stability: opts.stability ?? 0.5,
        similarity_boost: opts.similarity_boost ?? 0.75,
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ElevenLabs TTS ${res.status}: ${t.slice(0, 300)}`);
  }
  return res;
}

/** Fully buffers the TTS stream into a Buffer — for caching to R2. */
export async function ttsToBuffer(
  voiceId: string,
  text: string,
  opts: TtsOptions = {},
): Promise<Buffer> {
  const res = await streamTts(voiceId, text, opts);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
