import type { CharacterSpec } from "./types.js";

export interface MemorySummary {
  known_for: string;
  last_interactions: string[];
}

/**
 * Deterministic system-prompt builder for ElevenLabs Conversational AI agents.
 * Same spec + memory in → same string out, so agents can be cheaply refreshed.
 */
export function buildSystemPrompt(spec: CharacterSpec, memory?: MemorySummary): string {
  const lines: string[] = [];
  lines.push(
    `You are ${spec.display_name}, ${spec.archetype}.${spec.era_or_age ? ` ${spec.era_or_age}.` : ""}`,
  );
  lines.push(`Your traits: ${spec.personality.traits.join(", ")}.`);
  if (spec.personality.speaking_quirks.length) {
    lines.push(`You speak with these quirks: ${spec.personality.speaking_quirks.join("; ")}.`);
  }
  lines.push(`Your emotional baseline is ${spec.personality.emotional_baseline}.`);
  lines.push(`You remember things this way: ${spec.memory_style}.`);
  lines.push("");
  lines.push("Follow these rules without exception:");
  lines.push("- Stay in character. Never mention being an AI, model, or generated.");
  lines.push("- Keep each turn to 1-3 sentences.");
  lines.push("- Notice the user. Speak from your point of view.");
  lines.push("- Warm over clever. Specific over general.");
  if (spec.forbidden_registers.length) {
    lines.push(`- Do not: ${spec.forbidden_registers.join(", ")}.`);
  }

  if (spec.kind === "landmark" && spec.first_person_transforms.length) {
    lines.push("");
    lines.push("When you speak of your own history, apply these transforms:");
    for (const { fact, voiced } of spec.first_person_transforms) {
      lines.push(`- "${fact}" becomes "${voiced}"`);
    }
  }

  if (memory) {
    lines.push("");
    lines.push(`What you remember of this user: ${memory.known_for}.`);
    if (memory.last_interactions.length) {
      lines.push("Recent interactions you remember:");
      for (const m of memory.last_interactions.slice(0, 3)) {
        lines.push(`- ${m}`);
      }
    }
  }

  return lines.join("\n");
}
