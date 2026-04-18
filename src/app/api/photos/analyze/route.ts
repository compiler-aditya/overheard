import "server-only";
import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { identify } from "@/lib/vision";
import { ttsToBuffer } from "@/lib/elevenlabs/tts";
import { keyFor, publicUrl, putObject } from "@/lib/r2";
import { getDemoUserId } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Day 1: hard-coded fallback voice until the resolver + Voice Design come online (Day 2).
// This is "Alexandra" — documented in the ElevenLabs Conversational AI voice list.
const FALLBACK_VOICE_ID = "kdmDKE6EkgrWrrykO9Qt";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "image field required" }, { status: 400 });
    }

    await getDemoUserId(); // ensure demo user exists

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const ext = mime.split("/")[1] ?? "jpg";
    const imageHash = createHash("sha1").update(buffer).digest("hex").slice(0, 16);
    const imageKey = keyFor("originals", `${imageHash}.${ext}`);
    await putObject(imageKey, buffer, mime);

    const vision = await identify(buffer.toString("base64"), mime);

    const greeting = pickFallbackGreeting(vision.primary.category, vision.description);
    const audio = await ttsToBuffer(FALLBACK_VOICE_ID, greeting);
    const greetingKey = keyFor("greetings", `${randomUUID()}.mp3`);
    await putObject(greetingKey, audio, "audio/mpeg");

    const [imageUrl, greetingUrl] = await Promise.all([
      publicUrl(imageKey),
      publicUrl(greetingKey),
    ]);

    return NextResponse.json({
      vision,
      image_url: imageUrl,
      greeting_text: greeting,
      greeting_url: greetingUrl,
      note: "Day 1 hello-world slice: voice is the fallback. Day 2 will swap in per-category designed overheard.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function pickFallbackGreeting(category: string, description: string): string {
  const lines: Record<string, string> = {
    houseplant: "I noticed you haven't been home much. Everything okay?",
    animal: "Crumbs? That guy has a bagel. I'm calculating trajectories.",
    food: "Third one today. Worried about you.",
    furniture: "Sit with me a minute. The afternoon is long.",
    vehicle: "Heading somewhere? Take me with you.",
    building: "I have watched this street for longer than most of it has existed.",
    landscape: "The wind moved. I noticed.",
    artwork: "Look at me a little longer. I wasn't finished.",
  };
  return lines[category] ?? `I see you. ${description}`;
}
