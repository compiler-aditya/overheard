import "server-only";
import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { identify } from "@/lib/vision";
import { ttsToBuffer } from "@/lib/elevenlabs/tts";
import { keyFor, publicUrl, putObject } from "@/lib/r2";
import { getDemoUserId } from "@/lib/db";
import { resolveCharacter } from "@/lib/characters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "image field required" }, { status: 400 });
    }

    const userId = await getDemoUserId();
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const ext = mime.split("/")[1] ?? "jpg";
    const imageHash = createHash("sha1").update(buffer).digest("hex").slice(0, 16);
    const imageKey = keyFor("originals", `${imageHash}.${ext}`);
    await putObject(imageKey, buffer, mime);

    const vision = await identify(buffer.toString("base64"), mime);

    // Full resolver: pair → landmark → memory → new-object (designs a fresh voice).
    const character = await resolveCharacter(userId, vision, imageKey);

    // Synthesize the greeting once and cache to R2.
    const greetingAudio = await ttsToBuffer(character.voice_id, character.greeting_text);
    const greetingKey = keyFor("greetings", `${randomUUID()}.mp3`);
    await putObject(greetingKey, greetingAudio, "audio/mpeg");

    const [imageUrl, greetingUrl, ambientUrl] = await Promise.all([
      publicUrl(imageKey),
      publicUrl(greetingKey),
      character.ambient_r2_key ? publicUrl(character.ambient_r2_key) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      character: {
        id: character.id,
        kind: character.kind,
        display_name: character.display_name,
        agent_id: character.agent_id,
      },
      vision,
      image_url: imageUrl,
      greeting_text: character.greeting_text,
      greeting_url: greetingUrl,
      ambient_url: ambientUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
