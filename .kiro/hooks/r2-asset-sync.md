---
name: r2-asset-sync
trigger: manual
action: shell-command
---

# R2 asset sync

## Purpose
A manual "sync" button the developer can invoke to push any locally generated audio previews (from the `voice-preview-on-category-save` hook) into the Cloudflare R2 bucket, so they're available to the running app. Also validates the bucket's contents against the expected set from current specs.

## Shell command
```bash
node ./scripts/sync-r2-assets.mjs
```

## Behavior (implemented in scripts/sync-r2-assets.mjs)
1. Walks `/tmp/overheard-preview-*.mp3`. For each, uploads to `r2://${R2_BUCKET_NAME}/previews/<slug>.mp3`.
2. Lists the bucket and reports any specs in `.kiro/specs/` that have no corresponding ambient audio in R2 (missing).
3. Reports any orphaned R2 objects whose slug no longer exists in any spec (stale).

## Guardrails
- Dry-run by default. Pass `--apply` to actually upload/delete.
- Never delete the `originals/` prefix; that folder is the user's uploaded photos.
