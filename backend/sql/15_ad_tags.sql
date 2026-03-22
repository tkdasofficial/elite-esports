-- ============================================================
-- 15_ad_tags.sql
-- Ad Tag management: HTML, JS, and URL-based ad code snippets
-- Admins manage tags via the panel; the app renders them live.
-- Run AFTER 14_admin_access.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ad_tags (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'banner'
                CHECK (type IN ('banner', 'interstitial', 'native', 'custom')),
  code_type   TEXT        NOT NULL DEFAULT 'html'
                CHECK (code_type IN ('html', 'javascript', 'url')),
  code        TEXT        NOT NULL DEFAULT '',
  position    TEXT        NOT NULL DEFAULT 'global'
                CHECK (position IN ('home', 'matches', 'leaderboard', 'wallet', 'global')),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  priority    INTEGER     NOT NULL DEFAULT 0,
  notes       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER ad_tags_updated_at
  BEFORE UPDATE ON public.ad_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_ad_tags_active   ON public.ad_tags (is_active);
CREATE INDEX IF NOT EXISTS idx_ad_tags_position ON public.ad_tags (position);
CREATE INDEX IF NOT EXISTS idx_ad_tags_priority ON public.ad_tags (priority DESC);

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE public.ad_tags ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read active tags for rendering
CREATE POLICY "ad_tags_select_active"
  ON public.ad_tags FOR SELECT
  USING (
    is_active = true
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can insert new tags
CREATE POLICY "ad_tags_admin_insert"
  ON public.ad_tags FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can update tags
CREATE POLICY "ad_tags_admin_update"
  ON public.ad_tags FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can delete tags
CREATE POLICY "ad_tags_admin_delete"
  ON public.ad_tags FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );
