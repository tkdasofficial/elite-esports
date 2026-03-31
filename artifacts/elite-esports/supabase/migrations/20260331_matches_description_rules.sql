-- Add description and rules columns to matches table
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS rules TEXT;
