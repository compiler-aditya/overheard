import "server-only";
import type { VisionResult } from "./specs/types.js";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CATEGORY_SLUGS = [
  "houseplant",
  "appliance",
  "furniture",
  "vehicle",
  "food",
  "tool",
  "accessory",
  "building",
  "landscape",
  "street-object",
  "animal",
  "artwork",
] as const;

const ALLOWED_GENERICS = [
  "pigeon",
  "candle",
  "mirror",
  "key",
  "door",
  "plate",
  "fork",
  "book",
  "pen",
  "paper",
  "coffee-cup",
  "laptop",
  "ring",
  "letter",
] as const;

const PROMPT = `You are a careful observer for an app called Auris. Given a photograph, you identify the primary subject (and a secondary subject if there is a second clearly distinct object of comparable prominence). Respond strictly as minified JSON matching this TypeScript type — no markdown, no commentary:

{
  "primary": { "category": string, "attributes": string[], "confidence": number },
  "secondary": { "category": string, "attributes": string[], "confidence": number } | null,
  "landmark_slug": string | null,
  "description": string
}

Rules:
- "category" must be one of: ${CATEGORY_SLUGS.join(", ")}, or one of these normalized subjects if more specific: ${ALLOWED_GENERICS.join(", ")}.
- "attributes" is 3-6 lowercase tags (color, material, condition, era, mood).
- "confidence" is 0..1.
- "secondary" is null unless the frame contains two clearly distinct primary objects of roughly equal importance. Do not invent a secondary to be helpful.
- "landmark_slug" is non-null only if you recognize a famous landmark and can name it in kebab-case (e.g. "taj-mahal", "rajwada-indore", "gateway-of-india"). Otherwise null.
- "description" is one natural sentence.`;

export async function identify(imageBase64: string, mimeType: string): Promise<VisionResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseVisionJson(text);
}

export function parseVisionJson(raw: string): VisionResult {
  const trimmed = raw.trim().replace(/^```json\s*|\s*```$/g, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return fallback("unparseable vision response");
  }
  if (!parsed || typeof parsed !== "object") return fallback("non-object");
  const p = parsed as Record<string, unknown>;
  const primary = asSubject(p.primary);
  if (!primary) return fallback("missing primary");
  const secondary = p.secondary ? asSubject(p.secondary) ?? undefined : undefined;
  const landmark_slug = typeof p.landmark_slug === "string" ? p.landmark_slug : undefined;
  const description = typeof p.description === "string" ? p.description : "";
  return { primary, secondary, landmark_slug, description };
}

function asSubject(v: unknown) {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.category !== "string") return null;
  const attrs = Array.isArray(o.attributes)
    ? o.attributes.filter((x): x is string => typeof x === "string")
    : [];
  const confidence =
    typeof o.confidence === "number" ? Math.min(Math.max(o.confidence, 0), 1) : 0.5;
  return { category: o.category, attributes: attrs, confidence };
}

function fallback(reason: string): VisionResult {
  console.warn(`[vision] fallback: ${reason}`);
  return {
    primary: { category: "artwork", attributes: [], confidence: 0.3 },
    description: "I can't quite see you, but I'm here.",
  };
}
