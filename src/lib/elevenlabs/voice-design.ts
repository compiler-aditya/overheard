const API_BASE = "https://api.elevenlabs.io";
const DESIGN_URL = `${API_BASE}/v1/text-to-voice/design`;
const CREATE_URL = `${API_BASE}/v1/text-to-voice`;

export interface VoiceDesignInput {
  description: string;        // 20-1000 chars
  preview_text?: string;      // 100-1000 chars, or omit for auto
  model_id?: "eleven_multilingual_ttv_v2" | "eleven_ttv_v3";
  guidance_scale?: number;    // 0-100, default 5
  loudness?: number;          // -1..1
}

export interface VoiceDesignPreview {
  generated_voice_id: string;
  audio_base_64?: string;
  media_type?: string;
}

export interface VoiceDesignResponse {
  previews: VoiceDesignPreview[];
  text: string;
}

export async function designVoice(input: VoiceDesignInput): Promise<VoiceDesignResponse> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  if (input.description.length < 20 || input.description.length > 1000) {
    throw new Error("voice design prompt must be 20-1000 chars");
  }
  const res = await fetch(DESIGN_URL, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voice_description: input.description,
      model_id: input.model_id ?? "eleven_multilingual_ttv_v2",
      text: input.preview_text,
      auto_generate_text: input.preview_text ? false : true,
      guidance_scale: input.guidance_scale ?? 5,
      loudness: input.loudness ?? 0.5,
      output_format: "mp3_44100_128",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Voice Design ${res.status}: ${t.slice(0, 300)}`);
  }
  return (await res.json()) as VoiceDesignResponse;
}

/**
 * Save a previewed voice into the account's voice library so it becomes
 * usable by Conversational AI agents and downstream TTS calls.
 *
 * Required: the design endpoint returns an ephemeral `generated_voice_id`.
 * Calling this with that id mints a permanent `voice_id`.
 */
export async function createVoiceFromPreview(input: {
  voice_name: string;
  voice_description: string;
  generated_voice_id: string;
}): Promise<{ voice_id: string }> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  const res = await fetch(CREATE_URL, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voice_name: input.voice_name.slice(0, 100),
      voice_description: input.voice_description,
      generated_voice_id: input.generated_voice_id,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Voice create ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = (await res.json()) as { voice_id: string };
  return { voice_id: data.voice_id };
}

/**
 * Designs a voice, picks the first preview, and saves it to the account
 * library so agents and TTS can bind to it.
 *
 * Returns the permanent `voice_id` (not the ephemeral `generated_voice_id`).
 */
export async function designAndPickFirst(input: VoiceDesignInput & {
  voice_name?: string;
}): Promise<{
  voice_id: string;
  preview_audio_b64?: string;
}> {
  const { previews } = await designVoice(input);
  const first = previews[0];
  if (!first) throw new Error("voice design returned no previews");

  const saved = await createVoiceFromPreview({
    voice_name: input.voice_name ?? `auris-${Date.now().toString(36)}`,
    voice_description: input.description,
    generated_voice_id: first.generated_voice_id,
  });

  return {
    voice_id: saved.voice_id,
    preview_audio_b64: first.audio_base_64,
  };
}
