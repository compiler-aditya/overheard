# overheard-character-db MCP server

A minimal stdio [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the Overheard character database to Kiro. It gives the Kiro agent read-only answers to:

- "Which characters already exist?"
- "Show me the full spec record for `rajwada-indore`."
- "Is this ElevenLabs voice_id already bound to a character?"

This is what prevents Kiro from accidentally generating a duplicate voice when authoring a new category spec.

## Running

```bash
npm install
DATABASE_URL=postgres://… node server.mjs
```

Kiro registers this server via `.kiro/settings/mcp.json`.

## Tools

| Tool | Args | Returns |
|---|---|---|
| `list_characters` | `{ kind?: "landmark" \| "pairing" }` | rows from the matching table(s) |
| `get_character_by_slug` | `{ kind, slug }` | one row or null |
| `check_voice_uniqueness` | `{ voice_id }` | `{ unique: bool, used_by: rows[] }` |

All responses are returned as a single `text` content block whose body is pretty-printed JSON.

## Protocol

Speaks JSON-RPC 2.0 on stdio per MCP spec 2024-11-05.

Handlers: `initialize`, `tools/list`, `tools/call`, `ping`.
