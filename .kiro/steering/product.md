---
inclusion: always
---

# Auris — product steering

## One-line pitch
Photograph anything. Hear what it has to say — and sometimes, when two things are in the frame together, a third voice neither object has alone appears.

## What Auris is
A voice-first web app where any photograph becomes a character with its own voice, personality, and memory. A user snaps a photo of an object; Auris identifies what it is and speaks as that object. Everything remembered is remembered across sessions.

## Core mechanics (shipping in the hackathon build)
1. **Photograph to voice** — one tap captures a photo; within ~3 seconds a character voice greets the user.
2. **Persistent memory** — the same object (re-photographed) returns with the same voice and a conversation history.
3. **Famous landmark mode** — hand-authored landmark characters speak in first person with era-aware memory.
4. **Pairing unlocks** — when two objects appear in the same frame, rare hand-designed pair specs may trigger a third, emergent voice.
5. **Conversation** — tap-to-speak and have a back-and-forth via ElevenLabs Conversational AI.
6. **Ambient audio** — every character has a looped ambient bed generated via ElevenLabs Sound Effects.

## Target feel
Warm, slightly whimsical, never uncanny, never dark. The app should feel reverent and alive, not techy. Joy register, not gravity register.

## Target user
Anyone curious enough to point a phone at a pigeon and listen. No technical literacy required. Grandmother-simple: one tap to photograph, one tap to speak back.

## Non-goals (explicitly out of scope for the hackathon)
- Cross-user relay between strangers at shared landmarks
- Objects talking to each other without the user present
- Notifications from objects when the user is away
- Gift-an-object heirloom mechanic
- Public feed or any social features
- Monetization, subscriptions, paywalls
- Mobile native apps (web-first)
- Multi-user accounts (single shared demo account for the hackathon)

## Success criteria for the hackathon build
- A judge can open the live URL, photograph three distinct objects, talk to each, and trigger a pair unlock within 2 minutes.
- Character voices are distinctive per category and on-brand with the tonal identity.
- The `.kiro/` directory is visible in the public GitHub repo and demonstrates genuine spec-driven authorship.
