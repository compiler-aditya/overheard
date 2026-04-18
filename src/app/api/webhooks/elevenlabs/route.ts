import "server-only";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ElevenLabs post-conversation webhook.
 * Configured in the ElevenLabs dashboard under workspace webhooks.
 * Body contains { conversation_id, agent_id, transcript, started_at, ended_at }.
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const sig = req.headers.get("elevenlabs-signature") ?? "";
    if (!verifySignature(raw, sig)) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
    const body = JSON.parse(raw) as {
      conversation_id?: string;
      agent_id?: string;
      transcript?: unknown;
      started_at?: string;
      ended_at?: string;
    };
    if (!body.conversation_id || !body.agent_id) {
      return NextResponse.json({ error: "missing ids" }, { status: 400 });
    }

    // Find which object or landmark owns this agent.
    const rows = await query<{ id: string; kind: "object" | "landmark" }>(
      `
      SELECT id, 'object' AS kind FROM objects WHERE agent_id = $1
      UNION ALL
      SELECT id, 'landmark' AS kind FROM landmarks WHERE agent_id = $1
      LIMIT 1
      `,
      [body.agent_id],
    );
    const owner = rows[0];
    if (!owner) {
      return NextResponse.json({ error: "agent not mapped" }, { status: 404 });
    }

    await query(
      `
      INSERT INTO conversations (
        object_id, landmark_id, elevenlabs_conversation_id, transcript, started_at, ended_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6)
      `,
      [
        owner.kind === "object" ? owner.id : null,
        owner.kind === "landmark" ? owner.id : null,
        body.conversation_id,
        JSON.stringify(body.transcript ?? []),
        body.started_at ?? null,
        body.ended_at ?? null,
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function verifySignature(raw: string, sig: string): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return true; // dev/test mode: skip verification
  if (!sig) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig.replace(/^sha256=/, ""), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
