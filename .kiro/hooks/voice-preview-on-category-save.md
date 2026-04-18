---
name: voice-preview-on-category-save
trigger: file-save
file_pattern: ".kiro/specs/categories/*.md"
action: agent-prompt
---

# Voice preview on category save

## Purpose
After the developer saves a new or edited category spec, immediately generate a short voice preview using the spec's `voice_profile.design_prompt` and play it back. This closes the feedback loop so the author can hear whether the voice matches the intended tonal identity before committing.

## Prompt to the Kiro agent

You just observed a save to `${FILE_PATH}` which is a Overheard category spec. Do the following:

1. Parse the YAML frontmatter of the saved file. Extract `slug`, `voice_profile.design_prompt`, and the first entry of `greeting_templates`.
2. Call the ElevenLabs Voice Design endpoint with `voice_description = voice_profile.design_prompt` and `text = greeting_templates[0]` (or the auto-generated text if the greeting is shorter than 100 characters).
3. Save the first returned preview MP3 to `/tmp/overheard-preview-${slug}.mp3` and open it in the default player.
4. Post a one-line summary into the chat: "Previewed `<slug>`: listen at `/tmp/overheard-preview-<slug>.mp3`. Voice ID `<voice_id>` is cached as a candidate."
5. Do NOT persist the voice_id to the database — that happens through the bootstrap script only.

## Guardrails
- If the Voice Design call fails, post the error verbatim and stop — do not retry automatically.
- If the design_prompt is outside the 20–1000 character range, refuse with a clear message referencing `.kiro/specs/character-schema/design.md`.
- The ElevenLabs API key is available via `ELEVENLABS_API_KEY` in the environment. Never log it.

## Why this hook exists
Category specs are written by hand. The best way to know whether a voice prompt is any good is to hear it. Waiting for the bootstrap script or the full pipeline to find out adds minutes of friction. This hook turns a spec save into a 2-second ear test.
