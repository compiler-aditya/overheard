# Auris — project brief for the designer

A plain-language description of the app, its users, its emotional register, and the screens it needs. **No visual prescriptions** — colors, fonts, shapes, grids, and iconography are entirely the designer's call.

---

## What Auris is

Auris is a voice-first web app. The user takes or uploads a photograph of anything — a houseplant, a pigeon, a coffee mug, the Taj Mahal — and within a few seconds **that thing speaks back** in a distinctive character voice. Objects the user meets are remembered across sessions. Famous landmarks speak in first person about their own history. And when the user photographs two specific things in the same frame, a rare *third* voice sometimes appears — the voice of the pairing itself.

It is a toy, not a utility. It is allowed to be warm, a little whimsical, and surprising. It is not a chatbot, not a camera app, not a journal. It is a way of listening.

---

## The moment of use

A person opens the app. They point their phone at something. They press one button. They listen. Sometimes they press "Talk back" and have a short spoken conversation. They put the phone down.

Total time per session: 15 seconds to 3 minutes. Session frequency: a few times a week, triggered by curiosity, not obligation.

---

## Core mechanics (shipping)

1. **Photograph → voice.** One tap to capture a photo; within ~3 seconds a character voice greets the user.
2. **Persistent memory.** Re-photographing the same object returns the same voice and remembers prior conversations.
3. **Landmark mode.** When the subject is a famous place, it speaks in first person with era-aware memory ("The river used to come closer. I could hear it at night.").
4. **Pair unlocks.** When two specific objects appear in one frame — a candle and a mirror, a key and a door — a rare third voice appears.
5. **Conversation.** Tap to speak back; the character replies in voice, in character, over WebSocket.
6. **Ambient bed.** Every character has a looped atmospheric sound (room tone, wind, distant traffic) playing quietly underneath.

---

## Tonal identity — the single most important constraint

Every visual and interaction decision should serve this register.

- **Warm, slightly whimsical, never uncanny, never dark.**
- **Joy register, not gravity register.** It is allowed to be funny and surprising.
- **Reverent and alive, not techy.** It should feel like opening a small object of affection — not like launching an app.
- **Noticing outward, not performing inward.** The product is quiet; the characters do the talking.
- **Shorter over longer. Specific over general. Warmth over cleverness.**

Things the app must never feel like:
- A chatbot. A CRM. A productivity tool. A meditation app. A dating app. A surveillance tool. A children's toy in a patronizing way. A Material Design template. An AI demo.

---

## User flow (one complete session)

1. **Open** — user lands on Home. The product's job here is to invite one action: photograph something.
2. **Capture** — user hits one obvious button; the camera opens (or file upload on desktop).
3. **Identifying** — a brief quiet moment (~3s) while the app figures out what it's looking at. This moment has its own character — it should feel like the app is *listening*, not *loading*.
4. **Greeting** — the character's photograph is shown alongside its name, a one-sentence greeting in text, and the greeting spoken aloud in character voice. A soft ambient bed plays underneath.
5. **(Optional) Talk back** — user taps a single affordance to open a voice conversation. Mic access is requested; the conversation runs until the user ends it.
6. **(Rare) Pair unlock** — if the photo contained two paired subjects, the user is routed to a distinct *pair unlock* moment before the normal greeting — a small cinematic beat. A different voice greets them. The ambient is quieter.
7. **Return** — later the user opens the app again; a small "recent voices" surface shows the characters they have met, each with its own presence.

---

## Screens the designer needs to cover

Listed by priority. Only the first three are strictly required; the rest can be refined later.

### 1. Home (primary)
The invitation screen. One obvious way to take a photograph. Space for the app's name and a one-line promise. A small, unobtrusive surface showing recently-met characters (3–5 thumbnails is fine) so returning users feel the memory. Tiny footer crediting Kiro + ElevenLabs and the MIT license.

**Content elements:**
- App name: **Auris**
- Tagline: *"Photograph anything. Hear what it has to say."*
- Hero line: *"Point your camera at anything."*
- Subhead: *"Auris will listen, then speak back."*
- Primary action: take / upload a photo
- Secondary surface: recent voices strip
- Footer: *"Built with Kiro + ElevenLabs · MIT"*

### 2. Greeting (primary)
The moment after capture. Shows the photograph the user took, names the character, plays the spoken greeting, and offers "Talk back" as a single clear affordance. An ambient bed plays in the background.

**Content elements:**
- The uploaded photo
- Character display name (e.g. "Houseplant", "Rajwada", "Indian Railway Station")
- A small label indicating kind — *Category*, *Landmark*, or *Pair unlock*
- The greeting text in italics (e.g. *"I noticed you haven't been home much. Everything okay?"*)
- Audio playback of the greeting (with visible progress or waveform)
- Ambient audio (always playing — no visible control is fine; it's just *there*)
- A single **Talk back** affordance
- A quiet way to return Home

### 3. Pair unlock (primary)
The cinematic beat that appears only when a rare pairing fires. It should feel **different** from the normal greeting — hushed, set apart. This is the moment the demo video ends on, so it has to land.

**Content elements:**
- Small uppercase label: *"Pair unlock"*
- The pair's name (e.g. "The Threshold", "Candle and Mirror")
- The photo that triggered it
- The emergent voice's greeting in quoted italics (e.g. *"You found me. What do you want to know?"*)
- A single **Talk back** affordance
- A quiet way back Home

### 4. Recent voices / Character gallery (secondary)
A list or grid of characters the user has met, ordered by recency. Tapping any returns to that character's greeting screen.

### 5. Character profile (secondary)
Per-character view showing the photo, the character name, past conversation snippets, and a persistent **Talk back** button.

### 6. Empty state / first run (secondary)
The very first time a user opens the app, there are no recent voices and they don't know the pairing mechanic exists. The home screen handles this gracefully — no empty-state illustration needed unless the designer wants one.

---

## Moments that deserve special care

- **The press of the photo button.** This is the one action the whole product turns on. It should feel *good* to press.
- **The 3-second pause between capture and voice.** This is where the app can feel alive or dead. It should feel like the app is *listening* to the photo, not *processing* it.
- **The first moment a voice speaks.** Audio clarity is everything. The visual around it should step out of the way.
- **The pair unlock reveal.** Save the drama for here. Everything else stays quiet.

---

## Content examples (to get the voices right in copy)

**Houseplant:** "I noticed you haven't been home much. Everything okay?"
**Pigeon:** "Crumbs, huh? That guy over there has a bagel. I'm calculating trajectories."
**Rajwada (Indore):** "Another one with a phone. Come closer — the light is better by the carved pillars."
**Taj Mahal:** "Quieter, once. The river came closer then. I could hear it at night."
**Coffee + laptop (pair):** "Third one today. Laptop's warm. You're fine. We're fine."
**Candle + mirror (pair):** "You found me. What do you want to know?"

Do not write character voices unless you're iterating on copy — the app ships with 28 pre-authored characters. These are shown so the designer understands the register the design has to hold.

---

## Hard constraints

- **Mobile-first.** The golden path is a phone in a hand. Desktop layout is allowed but secondary.
- **One primary action per screen.** Home has one; Greeting has one; Pair has one. Never two primary actions on the same screen.
- **Text is spoken aloud.** Every line in the UI should work on its own but also when read by a screen reader, because that's how some users will meet the app.
- **Dark or light, either is fine** — but whichever is chosen should feel warm (not clinical) and should hold up in bright sunlight (users will photograph things outdoors).
- **No chrome during the ~3-second identify moment.** The app should get out of the way while it's listening.
- **Ambient audio is diegetic.** It is not a UI element. Do not treat it as a control.
- **No cluttered nav.** No tab bar. No hamburger menu. The only navigation is *Home → Greeting → Talk back → back to Home*.

---

## Out of scope (do not design these)

- Account / signup / profile settings screens — the hackathon build uses a single shared demo account.
- Sharing / export / social feed features — intentionally absent.
- Paywall / pricing / upgrade screens.
- A notifications center, inbox, activity log, or settings dashboard.
- A visible onboarding walkthrough or tour.

---

## Technical context (just so you're not surprised)

This is a Next.js web app. The primary rendering path is:

- `Home` is a server-rendered page with one client component for the camera/upload.
- `Greeting` is server-rendered with two client components: one audio player, one conversation button (which opens a live WebSocket to an ElevenLabs voice agent).
- `Pair unlock` is a server-rendered route at `/pair/[id]`.
- There is no complex state management — everything lives in URL params and server-loaded props.

None of this should shape the visual design. It's here only so the designer knows that an over-clever multi-panel dashboard would require backend work that's out of scope.

---

## Evaluation criteria for the design

When looking at a proposed design, the bar is:

1. Can a grandmother open it and take a photograph without instructions?
2. Does it feel warm, alive, and reverent — or does it feel like a productivity tool?
3. Does the greeting moment put the voice first and the chrome second?
4. Does the pair unlock feel *different enough* from the regular greeting to function as a cinematic beat?
5. Would a judge, reviewing this alongside 1,000 other hackathon submissions, remember it in 10 seconds?

If the answer to any of those is "not quite", iterate.
