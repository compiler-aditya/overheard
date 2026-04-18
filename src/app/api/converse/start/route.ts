import "server-only";
import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSignedConversationUrl } from "@/lib/elevenlabs/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { character_id } = (await req.json()) as { character_id?: string };
    if (!character_id) {
      return NextResponse.json({ error: "character_id required" }, { status: 400 });
    }

    // Characters can live in either `objects` (per-user) or `landmarks` (shared).
    const agent = await resolveAgentId(character_id);
    if (!agent) {
      return NextResponse.json({ error: "character not found" }, { status: 404 });
    }
    const signed_url = await getSignedConversationUrl(agent);
    return NextResponse.json({ agent_id: agent, signed_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[converse/start]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function resolveAgentId(characterId: string): Promise<string | null> {
  const obj = await queryOne<{ agent_id: string }>(
    "SELECT agent_id FROM objects WHERE id = $1",
    [characterId],
  );
  if (obj?.agent_id) return obj.agent_id;
  const lm = await queryOne<{ agent_id: string }>(
    "SELECT agent_id FROM landmarks WHERE id = $1",
    [characterId],
  );
  return lm?.agent_id ?? null;
}
