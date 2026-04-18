# Text description (for the hackathon submission form)

> ~250 words. Paste directly into the "Project description" field.

---

**Auris — photograph anything, hear what it has to say.**

Auris is a voice-first web app where any photograph becomes a character with its own voice, personality, and memory. Point the camera at a houseplant and hear it notice that you've been out of town. Photograph the Taj Mahal and hear it speak as itself — tired, tender, first-person. Capture a candle and a mirror in the same frame and a third, rare voice answers, aware of being summoned.

The mechanic is stupidly simple — one tap to photograph, one tap to talk back. Underneath, every encounter runs the same pipeline: Gemini 2.5 Flash identifies the subject, a character resolver prefers pairings over landmarks over remembered objects over new categories, and ElevenLabs does the rest — Voice Design for a distinct per-character voice, Sound Effects for ambient beds, and Conversational AI for the back-and-forth. Objects you photograph once come back the same voice when photographed again.

Everything that makes a character *itself* — tonal identity, personality traits, first-person historical transforms, greeting templates, forbidden registers — lives as a markdown spec in `.kiro/specs/`. Kiro reads those specs, writes the pipeline code against them, and agent hooks validate every save. The submission ships with **12 category archetypes, 8 hand-authored landmarks, and 8 rare pairings** — 28 characters, each a spec.

Auris is a toy, not a utility. It's allowed to be warm, a little whimsical, and surprising. Point your phone at a pigeon and see what it has to say about the bagel across the street.
