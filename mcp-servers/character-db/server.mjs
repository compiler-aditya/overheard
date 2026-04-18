#!/usr/bin/env node
/**
 * Auris character-db MCP server.
 *
 * A minimal stdio MCP server that gives Kiro read-only access to the character
 * database so it can answer questions like "which voices do we already have?"
 * and "is this voice_id unique?" while generating or editing character specs.
 *
 * Protocol: Model Context Protocol over JSON-RPC 2.0 on stdio.
 * Spec: https://modelcontextprotocol.io/specification/2024-11-05
 *
 * Tools:
 *   - list_characters({ kind? }) -> rows
 *   - get_character_by_slug({ kind, slug }) -> row | null
 *   - check_voice_uniqueness({ voice_id }) -> { unique: bool, used_by: rows }
 */

import { createInterface } from "node:readline";
import pg from "pg";

const PROTOCOL_VERSION = "2024-11-05";
const TOOLS = [
  {
    name: "list_characters",
    description:
      "List all characters currently in the Auris database. Optionally filter by kind.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["landmark", "pairing"],
          description: "Filter by kind. If omitted, returns both kinds.",
        },
      },
    },
  },
  {
    name: "get_character_by_slug",
    description: "Fetch a single character by kind + slug.",
    inputSchema: {
      type: "object",
      required: ["kind", "slug"],
      properties: {
        kind: { type: "string", enum: ["landmark", "pairing"] },
        slug: { type: "string" },
      },
    },
  },
  {
    name: "check_voice_uniqueness",
    description:
      "Check whether an ElevenLabs voice_id is already bound to any character in the database.",
    inputSchema: {
      type: "object",
      required: ["voice_id"],
      properties: { voice_id: { type: "string" } },
    },
  },
];

let client = null;
async function getClient() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  client = new pg.Client({ connectionString: url });
  await client.connect();
  return client;
}

// ---- JSON-RPC send/receive helpers ---------------------------------------

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function reply(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function replyErr(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

// ---- request dispatcher --------------------------------------------------

async function handle(req) {
  const { id, method, params } = req;
  try {
    if (method === "initialize") {
      return reply(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "auris-character-db", version: "0.1.0" },
      });
    }
    if (method === "notifications/initialized") return; // notification, no reply
    if (method === "tools/list") {
      return reply(id, { tools: TOOLS });
    }
    if (method === "tools/call") {
      const { name, arguments: args = {} } = params ?? {};
      const content = await callTool(name, args);
      return reply(id, { content: [{ type: "text", text: JSON.stringify(content, null, 2) }] });
    }
    if (method === "ping") return reply(id, {});
    return replyErr(id, -32601, `Method not found: ${method}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return replyErr(id, -32000, message);
  }
}

async function callTool(name, args) {
  const c = await getClient();
  switch (name) {
    case "list_characters": {
      const kind = args.kind;
      if (kind === "landmark") {
        const r = await c.query(
          "SELECT slug, name, voice_id, agent_id FROM landmarks ORDER BY slug",
        );
        return { kind: "landmark", rows: r.rows };
      }
      if (kind === "pairing") {
        const r = await c.query(
          "SELECT slug, signature_a, signature_b, voice_id, agent_id FROM pair_specs ORDER BY slug",
        );
        return { kind: "pairing", rows: r.rows };
      }
      const [lm, pr] = await Promise.all([
        c.query("SELECT slug, name, voice_id, agent_id FROM landmarks ORDER BY slug"),
        c.query("SELECT slug, signature_a, signature_b, voice_id, agent_id FROM pair_specs ORDER BY slug"),
      ]);
      return { landmarks: lm.rows, pairings: pr.rows };
    }
    case "get_character_by_slug": {
      const { kind, slug } = args;
      if (kind === "landmark") {
        const r = await c.query(
          "SELECT * FROM landmarks WHERE slug = $1",
          [slug],
        );
        return r.rows[0] ?? null;
      }
      if (kind === "pairing") {
        const r = await c.query(
          "SELECT * FROM pair_specs WHERE slug = $1",
          [slug],
        );
        return r.rows[0] ?? null;
      }
      throw new Error("kind must be landmark or pairing");
    }
    case "check_voice_uniqueness": {
      const { voice_id } = args;
      const r = await c.query(
        `
        SELECT 'landmark' AS kind, slug, voice_id FROM landmarks WHERE voice_id = $1
        UNION ALL
        SELECT 'pairing'  AS kind, slug, voice_id FROM pair_specs WHERE voice_id = $1
        UNION ALL
        SELECT 'object'   AS kind, id::text AS slug, voice_id FROM objects WHERE voice_id = $1
        `,
        [voice_id],
      );
      return { unique: r.rows.length === 0, used_by: r.rows };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---- main loop -----------------------------------------------------------

const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }
  void handle(msg);
});

process.on("SIGINT", async () => {
  try { await client?.end(); } catch { /* ignore */ }
  process.exit(0);
});
