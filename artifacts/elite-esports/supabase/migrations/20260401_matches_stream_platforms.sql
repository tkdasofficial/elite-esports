-- Add per-platform stream URL columns to matches table
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS youtube_url  TEXT,
  ADD COLUMN IF NOT EXISTS twitch_url   TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url   TEXT;
