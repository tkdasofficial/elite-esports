-- ─────────────────────────────────────────────────────────────────────────────
-- Elite eSports — Full Database Setup
-- Supabase Dashboard → SQL Editor → New query → paste all → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  username     TEXT UNIQUE,
  avatar_index INTEGER DEFAULT 0,
  games        JSONB   DEFAULT '[]'::jsonb,
  balance      NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_admin     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 2. GAMES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.games (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "games_select" ON public.games;
DROP POLICY IF EXISTS "games_admin"  ON public.games;

CREATE POLICY "games_select" ON public.games FOR SELECT USING (true);
CREATE POLICY "games_admin"  ON public.games FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 3. MATCHES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  game           TEXT NOT NULL,
  banner_url     TEXT,
  entry_fee      NUMERIC(12,2) DEFAULT 0,
  prize_pool     NUMERIC(12,2) DEFAULT 0,
  players_joined INTEGER DEFAULT 0,
  max_players    INTEGER DEFAULT 100,
  status         TEXT NOT NULL DEFAULT 'upcoming'
                   CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  starts_at      TIMESTAMPTZ,
  room_id        TEXT,
  room_password  TEXT,
  description    TEXT,
  stream_url     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select" ON public.matches;
DROP POLICY IF EXISTS "matches_admin"  ON public.matches;

CREATE POLICY "matches_select" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_admin"  ON public.matches FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 4. TRANSACTIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount     NUMERIC(12,2) NOT NULL,
  utr        TEXT,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin"  ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_admin"  ON public.transactions FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 5. WITHDRAWALS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawals_select" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_insert" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals_admin"  ON public.withdrawals;

CREATE POLICY "withdrawals_select" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "withdrawals_insert" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "withdrawals_admin"  ON public.withdrawals FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 6. SUPPORT TICKETS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category   TEXT NOT NULL DEFAULT 'general',
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in_progress','resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_admin"  ON public.support_tickets;

CREATE POLICY "tickets_select" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_insert" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_admin"  ON public.support_tickets FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 7. REPORTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  match_id    UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_admin"  ON public.reports;

CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_admin"  ON public.reports FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 8. BROADCASTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title   TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broadcasts_select" ON public.broadcasts;
DROP POLICY IF EXISTS "broadcasts_admin"  ON public.broadcasts;

CREATE POLICY "broadcasts_select" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "broadcasts_admin"  ON public.broadcasts FOR INSERT
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 9. AD UNITS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_units (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('interstitial','rewarded','app_open')),
  unit_id    TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ad_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_units_admin" ON public.ad_units;
CREATE POLICY "ad_units_admin" ON public.ad_units FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 10. AD TRIGGERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_triggers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type     TEXT NOT NULL CHECK (trigger_type IN ('join_match','leave_match','app_open','reward_claim')),
  ad_unit_id       UUID REFERENCES public.ad_units(id) ON DELETE CASCADE,
  enabled          BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ad_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_triggers_admin" ON public.ad_triggers;
CREATE POLICY "ad_triggers_admin" ON public.ad_triggers FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ─── 11. AD SETTINGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_settings (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  ads_enabled     BOOLEAN NOT NULL DEFAULT true,
  default_cooldown INTEGER NOT NULL DEFAULT 60
);

ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_settings_admin" ON public.ad_settings;
CREATE POLICY "ad_settings_admin" ON public.ad_settings FOR ALL
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

INSERT INTO public.ad_settings (id, ads_enabled, default_cooldown)
  VALUES (1, true, 60)
  ON CONFLICT (id) DO NOTHING;

-- ─── 12. STORAGE BUCKET ──────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('game-banners', 'game-banners', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "banners_read"   ON storage.objects;
DROP POLICY IF EXISTS "banners_insert" ON storage.objects;
DROP POLICY IF EXISTS "banners_delete" ON storage.objects;

CREATE POLICY "banners_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-banners');
CREATE POLICY "banners_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'game-banners'
    AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "banners_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'game-banners'
    AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ─── 13. SEED YOUR ADMIN ACCOUNT ─────────────────────────────────────────────
INSERT INTO public.profiles (id, full_name, username, is_admin)
  VALUES ('6771dad2-8719-48c0-8907-3bb6da336835', 'Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;
