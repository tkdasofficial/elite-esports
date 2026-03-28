-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste & run

-- 1. Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games viewable by everyone"
  ON games FOR SELECT USING (true);

CREATE POLICY "Admins can manage games"
  ON games FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- 2. Add is_admin column to profiles (if not already present)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 3. Storage bucket for game banners (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-banners', 'game-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Game banners are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'game-banners');

CREATE POLICY "Admins can upload game banners"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'game-banners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete game banners"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'game-banners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
