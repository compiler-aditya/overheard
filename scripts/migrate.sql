-- Voices — database schema v1
-- Apply with: psql "$DATABASE_URL" -f scripts/migrate.sql
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared demo user (single account for the hackathon).
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hand-authored landmark specs, populated by scripts/bootstrap-characters.ts.
CREATE TABLE IF NOT EXISTS landmarks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  spec_path       TEXT NOT NULL,
  voice_id        TEXT NOT NULL,
  agent_id        TEXT NOT NULL,
  ambient_r2_key  TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hand-authored pairing specs.
CREATE TABLE IF NOT EXISTS pair_specs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  signature_a  TEXT NOT NULL,
  signature_b  TEXT NOT NULL,
  spec_path    TEXT NOT NULL,
  voice_id     TEXT NOT NULL,
  agent_id     TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pair_specs_signatures
  ON pair_specs (signature_a, signature_b);

-- Per-user objects (persistent memory).
CREATE TABLE IF NOT EXISTS objects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint      TEXT NOT NULL,
  category         TEXT NOT NULL,
  landmark_id      UUID REFERENCES landmarks(id),
  image_r2_key     TEXT NOT NULL,
  voice_id         TEXT NOT NULL,
  agent_id         TEXT NOT NULL,
  ambient_r2_key   TEXT,
  display_name     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_objects_fingerprint
  ON objects (user_id, fingerprint);

-- Pair instances (one per unlock event).
CREATE TABLE IF NOT EXISTS pair_instances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair_spec_id   UUID NOT NULL REFERENCES pair_specs(id),
  object_a_id    UUID REFERENCES objects(id),
  object_b_id    UUID REFERENCES objects(id),
  photo_r2_key   TEXT NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations (one row per ElevenLabs session).
CREATE TABLE IF NOT EXISTS conversations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id                   UUID REFERENCES objects(id) ON DELETE CASCADE,
  landmark_id                 UUID REFERENCES landmarks(id),
  pair_instance_id            UUID REFERENCES pair_instances(id),
  elevenlabs_conversation_id  TEXT,
  transcript                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at                    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_conversations_object
  ON conversations (object_id);

-- Seed the shared demo user if not present.
INSERT INTO users (handle)
VALUES (COALESCE(current_setting('app.demo_user_handle', true), 'demo'))
ON CONFLICT (handle) DO NOTHING;
