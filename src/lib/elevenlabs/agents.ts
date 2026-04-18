import "server-only";
import { buildSystemPrompt, type MemorySummary } from "@/lib/specs/system-prompt";
import type { CharacterSpec } from "@/lib/specs/types";

const API_BASE = "https://api.elevenlabs.io";

export interface CreateAgentResult {
  agent_id: string;
}

/** Creates an ElevenLabs Conversational AI agent from a CharacterSpec + voice_id. */
export async function createAgent(
  spec: CharacterSpec,
  voice_id: string,
  memory?: MemorySummary,
): Promise<CreateAgentResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  const prompt = buildSystemPrompt(spec, memory);
  const res = await fetch(`${API_BASE}/v1/convai/agents/create`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
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
          // Conversational AI English agents require turbo_v2 or flash_v2 (not v2_5).
          model_id: "eleven_flash_v2",
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
  return { agent_id: data.agent_id };
}

/** Fetch a signed WebSocket URL for a private agent session. */
export async function getSignedConversationUrl(agent_id: string): Promise<string> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  const res = await fetch(
    `${API_BASE}/v1/convai/conversation/get_signed_url?agent_id=${agent_id}`,
    { headers: { "xi-api-key": key } },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`signed_url ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = (await res.json()) as { signed_url: string };
  return data.signed_url;
}
