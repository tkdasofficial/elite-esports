-- App-wide config table (single row, id = 'main')
CREATE TABLE IF NOT EXISTS app_config (
  id              TEXT PRIMARY KEY DEFAULT 'main',
  support_email   TEXT,
  queries_email   TEXT,
  legal_email     TEXT,
  youtube_url     TEXT,
  facebook_url    TEXT,
  instagram_url   TEXT,
  twitch_url      TEXT,
  twitter_url     TEXT,
  snapchat_url    TEXT,
  linkedin_url    TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the default row so the admin just UPDATEs, never INSERTs
INSERT INTO app_config (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read, only the service role (admin) can write
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_app_config"  ON app_config FOR SELECT USING (true);
CREATE POLICY "admin_write_app_config"  ON app_config FOR UPDATE USING (true) WITH CHECK (true);
