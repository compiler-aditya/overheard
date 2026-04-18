# Day 6 pre-submission checklist

Go through this before hitting submit. Target: everything green by 10:00 Wed 23 Apr, giving 7 hours of buffer before the 17:00 deadline.

## Repository

- [ ] Repo is **public** on GitHub at a URL you can share
- [ ] `LICENSE` file present and visible in the GitHub "About" sidebar (MIT)
- [ ] `.kiro/` directory present at repo root and NOT gitignored — verify:
  ```bash
  git check-ignore .kiro      # should print nothing
  ls .kiro/                    # should list steering/ specs/ hooks/ settings/
  ```
- [ ] `.env*` files NOT tracked (check `git ls-files | grep -i env` returns only `.env.example`)
- [ ] `README.md` includes a live demo URL and a 5-step judge testing walkthrough

## Submission form fields

- [ ] **Category**: identify the Kiro challenge category on the form
- [ ] **Text description**: copy from `submission/DESCRIPTION.md`
- [ ] **Kiro usage write-up**: copy from `submission/KIRO_USAGE.md`
- [ ] **Demo video URL**: YouTube (public or unlisted) — from Day 5
- [ ] **GitHub repo URL**: the public URL
- [ ] **Live demo URL**: Cloud Run URL (the judges use this to test)

## Video

- [ ] Video is uploaded to YouTube/Vimeo/Facebook Video/Youku and publicly accessible
- [ ] No third-party trademarks or copyrighted music
- [ ] Platform cuts produced: TikTok (9:16 60s), Reels (9:16 60s), X (1:1 60s), LinkedIn (16:9 90s)

## Social posts

- [ ] Posted on **X/Twitter** with tags + hashtags (+50)
- [ ] Posted on **LinkedIn** with tags + hashtags (+50)
- [ ] Posted on **Instagram Reels** with tags + hashtags (+50)
- [ ] Posted on **TikTok** with tags + hashtags (+50)

All four posts use `@kirodotdev @elevenlabsio #ElevenHacks #CodeWithKiro`. Drafts in `submission/SOCIAL_POSTS.md`.

## Community-vote prep (+200 possible)

- [ ] Asked for emoji reacts in ElevenHacks / Kiro / related Discord communities where you are already a member
- [ ] Shared in your own professional network across all four platforms — friends reposting helps Most Viral scoring

## Live-testability

- [ ] Cloud Run deploy is up (`min-instances=1` during judging window)
- [ ] The demo user account is auto-logged-in on first visit — no signup
- [ ] At least one category voice, one landmark, and one pair-unlock have been end-to-end tested less than 24 hours before submission

## Final smoke-test walkthrough

Record yourself doing this in your head (or actually — worth the paranoia):

1. Open the public URL in a fresh incognito window
2. Upload a houseplant image → greeting plays within 5 s
3. Tap "Talk back" → mic prompt appears → WS connects → agent replies
4. Refresh. Upload a landmark (or sample image from `public/samples/`) → landmark voice
5. Upload a candle + mirror photo → redirected to `/pair/[id]` → emergent voice greets

If any of these fails, fix first, submit second.

## Known-honest disclosures to include in the write-up

These are in `submission/KIRO_USAGE.md` and `submission/DESCRIPTION.md` but worth calling out separately so judges reading the repo README also see them:

- The "same object" memory uses `hash(category + attributes)` as a fingerprint. Two similar plants will share a voice; we documented the choice.
- "Same person across time" pairing is aspirational — the heuristic is imperfect in Gemini's output.
- Sound Effects looping quality depends on the prompt; some ambients sound better than others.
- Conversational AI latency varies; during peak windows it can hit 1–2 s per turn.
