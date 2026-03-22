-- ============================================================
-- 10_campaigns.sql
-- Ad campaigns and promotional banners
-- ============================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'banner' CHECK (type IN ('banner', 'interstitial', 'welcome', 'timer')),
  image         TEXT DEFAULT '',
  title         TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  button_text   TEXT DEFAULT 'Learn More',
  link          TEXT DEFAULT '',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  priority      INTEGER NOT NULL DEFAULT 0,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_active ON public.campaigns(is_active);
CREATE INDEX idx_campaigns_type   ON public.campaigns(type);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Home page banner carousel
CREATE TABLE IF NOT EXISTS public.banners (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image         TEXT NOT NULL,
  title         TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  button_text   TEXT DEFAULT '',
  link          TEXT DEFAULT '',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON public.banners(is_active);
