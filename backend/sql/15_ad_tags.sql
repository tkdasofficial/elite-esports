-- ============================================================
-- 15_ad_tags.sql
-- Ad Tag management: HTML, JS, and URL-based ad code snippets
-- Admins manage tags via the panel; the app renders them live.
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS / OR REPLACE
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────
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

-- ── Auto-update updated_at trigger function ───────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ad_tags_updated_at ON public.ad_tags;
CREATE TRIGGER ad_tags_updated_at
  BEFORE UPDATE ON public.ad_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_tags_active   ON public.ad_tags (is_active);
CREATE INDEX IF NOT EXISTS idx_ad_tags_position ON public.ad_tags (position);
CREATE INDEX IF NOT EXISTS idx_ad_tags_priority ON public.ad_tags (priority DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.ad_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_tags_select_active" ON public.ad_tags;
DROP POLICY IF EXISTS "ad_tags_admin_insert"  ON public.ad_tags;
DROP POLICY IF EXISTS "ad_tags_admin_update"  ON public.ad_tags;
DROP POLICY IF EXISTS "ad_tags_admin_delete"  ON public.ad_tags;

-- Public reads active tags; admins read all (including inactive)
CREATE POLICY "ad_tags_select_active"
  ON public.ad_tags FOR SELECT
  USING (
    is_active = true
    OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can create tags
CREATE POLICY "ad_tags_admin_insert"
  ON public.ad_tags FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can edit tags
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
