-- =============================================================================
--  ELITE ESPORTS — COMPLETE BACKEND SETUP
--  Paste ALL of this into:
--    Supabase Dashboard → SQL Editor → New query → Run All
--
--  ✅ Safe to run on a FRESH or EXISTING database.
--     Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
--     ON CONFLICT DO NOTHING / DROP POLICY IF EXISTS throughout.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1 · CORE USER TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- users: one row per authenticated user (auto-created by trigger in Part 7)
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  username   TEXT        UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select"     ON public.users;
DROP POLICY IF EXISTS "users_insert"     ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_select"     ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert"     ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);


-- admin_users: simple allow-list of admin user IDs
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT USING (true);


-- wallets: one row per user, auto-created by trigger in Part 7
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    NUMERIC     NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_admin"      ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_admin" ON public.wallets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- user_roles: fine-grained roles (future use)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin"  ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_admin"  ON public.user_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2 · GAMES & MATCHES
-- ─────────────────────────────────────────────────────────────────────────────

-- games: BGMI, Free Fire, Valorant, etc.
CREATE TABLE IF NOT EXISTS public.games (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  banner_url TEXT,
  status     TEXT        NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "games_select" ON public.games;
DROP POLICY IF EXISTS "games_admin"  ON public.games;
CREATE POLICY "games_select" ON public.games FOR SELECT USING (true);
CREATE POLICY "games_admin"  ON public.games FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- matches: tournament slots
CREATE TABLE IF NOT EXISTS public.matches (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID        REFERENCES public.games(id) ON DELETE SET NULL,
  title           TEXT        NOT NULL,
  entry_fee       NUMERIC     NOT NULL DEFAULT 0,
  prize_pool      NUMERIC     NOT NULL DEFAULT 0,
  max_players     INTEGER     NOT NULL DEFAULT 100,
  joined_players  INTEGER     NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'upcoming'
                              CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  room_id         TEXT,
  room_password   TEXT,
  live_stream_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select" ON public.matches;
DROP POLICY IF EXISTS "matches_admin"  ON public.matches;
CREATE POLICY "matches_select" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_admin"  ON public.matches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- match_participants: players who have joined a match
CREATE TABLE IF NOT EXISTS public.match_participants (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id  UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mp_select" ON public.match_participants;
DROP POLICY IF EXISTS "mp_insert" ON public.match_participants;
DROP POLICY IF EXISTS "mp_admin"  ON public.match_participants;
CREATE POLICY "mp_select" ON public.match_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "mp_insert" ON public.match_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mp_admin"  ON public.match_participants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- match_results: per-player result after a match ends
CREATE TABLE IF NOT EXISTS public.match_results (
  id       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID    NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id  UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank     INTEGER NOT NULL DEFAULT 0,
  kills    INTEGER NOT NULL DEFAULT 0,
  points   INTEGER NOT NULL DEFAULT 0,
  UNIQUE(match_id, user_id)
);
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mr_select" ON public.match_results;
DROP POLICY IF EXISTS "mr_admin"  ON public.match_results;
CREATE POLICY "mr_select" ON public.match_results FOR SELECT USING (true);
CREATE POLICY "mr_admin"  ON public.match_results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- leaderboard: this is a VIEW in the existing schema, not a base table.
-- Recreating it as an aggregated view over match_results + users.
-- RLS is NOT applicable to views — it is enforced on the underlying tables.
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.id                                          AS user_id,
  u.username,
  u.avatar_url,
  COALESCE(SUM(mr.points), 0)::INTEGER          AS total_points,
  COALESCE(SUM(mr.kills), 0)::INTEGER           AS total_kills,
  COUNT(DISTINCT mr.match_id)::INTEGER           AS matches_played
FROM public.users u
LEFT JOIN public.match_results mr ON mr.user_id = u.id
GROUP BY u.id, u.username, u.avatar_url;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3 · FINANCIAL TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- payments: user deposit proofs (UTR / screenshot)
CREATE TABLE IF NOT EXISTS public.payments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount         NUMERIC     NOT NULL,
  utr            TEXT,
  screenshot_url TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected')),
  ai_status      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pay_select_own" ON public.payments;
DROP POLICY IF EXISTS "pay_insert_own" ON public.payments;
DROP POLICY IF EXISTS "pay_admin"      ON public.payments;
CREATE POLICY "pay_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pay_insert_own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pay_admin" ON public.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- withdrawals: user withdrawal requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     NUMERIC     NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wd_select_own" ON public.withdrawals;
DROP POLICY IF EXISTS "wd_insert_own" ON public.withdrawals;
DROP POLICY IF EXISTS "wd_admin"      ON public.withdrawals;
CREATE POLICY "wd_select_own" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wd_insert_own" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wd_admin" ON public.withdrawals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- wallet_transactions: internal credit/debit ledger (entry fees, prizes)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('credit','debit')),
  amount       NUMERIC     NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'approved'
                           CHECK (status IN ('pending','approved','rejected')),
  reference_id TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_select_own" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wt_admin"      ON public.wallet_transactions;
CREATE POLICY "wt_select_own" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wt_admin" ON public.wallet_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 4 · COMMUNICATION & SOCIAL
-- ─────────────────────────────────────────────────────────────────────────────

-- notifications: in-app alerts (also used by Admin Broadcast screen)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_admin"      ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_admin" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- user_games: user's in-game UIDs per game title
CREATE TABLE IF NOT EXISTS public.user_games (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  uid     TEXT NOT NULL,
  UNIQUE(user_id, game_id)
);
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ug_select"     ON public.user_games;
DROP POLICY IF EXISTS "ug_insert_own" ON public.user_games;
DROP POLICY IF EXISTS "ug_update_own" ON public.user_games;
DROP POLICY IF EXISTS "ug_delete_own" ON public.user_games;
CREATE POLICY "ug_select"     ON public.user_games FOR SELECT USING (true);
CREATE POLICY "ug_insert_own" ON public.user_games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ug_update_own" ON public.user_games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ug_delete_own" ON public.user_games FOR DELETE USING (auth.uid() = user_id);


-- support_tickets: user help requests
-- Category + subject are encoded into message as "[Category] Subject\n\nBody"
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message    TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','in_progress','resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "st_select_own" ON public.support_tickets;
DROP POLICY IF EXISTS "st_insert_own" ON public.support_tickets;
DROP POLICY IF EXISTS "st_admin"      ON public.support_tickets;
CREATE POLICY "st_select_own" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "st_insert_own" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "st_admin" ON public.support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- reports: in-match player reports
CREATE TABLE IF NOT EXISTS public.reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description      TEXT        NOT NULL,
  related_match_id UUID        REFERENCES public.matches(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rep_select_own" ON public.reports;
DROP POLICY IF EXISTS "rep_insert_own" ON public.reports;
DROP POLICY IF EXISTS "rep_admin"      ON public.reports;
CREATE POLICY "rep_select_own" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rep_insert_own" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rep_admin" ON public.reports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 5 · TEAMS
-- team_members MUST be created before the teams_update policy (cross-reference)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  tag        TEXT        NOT NULL CHECK (char_length(tag) <= 5),
  game       TEXT        NOT NULL,
  created_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin"  ON public.teams;
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = created_by);


-- team_members must exist before "teams_update" policy below
CREATE TABLE IF NOT EXISTS public.team_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member'
                        CHECK (role IN ('captain','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tm_select"     ON public.team_members;
DROP POLICY IF EXISTS "tm_insert_own" ON public.team_members;
DROP POLICY IF EXISTS "tm_delete_own" ON public.team_members;
CREATE POLICY "tm_select"     ON public.team_members FOR SELECT USING (true);
CREATE POLICY "tm_insert_own" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tm_delete_own" ON public.team_members
  FOR DELETE USING (auth.uid() = user_id);

-- teams_update references team_members — only safe after team_members exists
CREATE POLICY "teams_update" ON public.teams FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'captain'
  )
);
CREATE POLICY "teams_admin" ON public.teams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 6 · ADMIN CONFIGURATION TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- app_settings: deposit / withdrawal limits
CREATE TABLE IF NOT EXISTS public.app_settings (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  min_deposit  NUMERIC NOT NULL DEFAULT 10,
  max_deposit  NUMERIC NOT NULL DEFAULT 50000,
  min_withdraw NUMERIC NOT NULL DEFAULT 50,
  max_withdraw NUMERIC NOT NULL DEFAULT 50000
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appsett_select" ON public.app_settings;
DROP POLICY IF EXISTS "appsett_admin"  ON public.app_settings;
CREATE POLICY "appsett_select" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "appsett_admin"  ON public.app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- points_settings: kill & rank scoring config
CREATE TABLE IF NOT EXISTS public.points_settings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kill_points         INTEGER     NOT NULL DEFAULT 1,
  rank_1_points       INTEGER     NOT NULL DEFAULT 50,
  rank_2_points       INTEGER     NOT NULL DEFAULT 35,
  rank_3_points       INTEGER     NOT NULL DEFAULT 25,
  rank_4_points       INTEGER     NOT NULL DEFAULT 20,
  rank_5_points       INTEGER     NOT NULL DEFAULT 15,
  rank_6_to_10_points INTEGER     NOT NULL DEFAULT 10,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.points_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ps_select" ON public.points_settings;
DROP POLICY IF EXISTS "ps_admin"  ON public.points_settings;
CREATE POLICY "ps_select" ON public.points_settings FOR SELECT USING (true);
CREATE POLICY "ps_admin"  ON public.points_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ad_units: individual AdMob unit IDs
CREATE TABLE IF NOT EXISTS public.ad_units (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('interstitial','rewarded','app_open')),
  ad_unit_id TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'))
);
ALTER TABLE public.ad_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "au_select" ON public.ad_units;
DROP POLICY IF EXISTS "au_admin"  ON public.ad_units;
CREATE POLICY "au_select" ON public.ad_units FOR SELECT USING (true);
CREATE POLICY "au_admin"  ON public.ad_units FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ad_triggers: when / where ads fire
CREATE TABLE IF NOT EXISTS public.ad_triggers (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger          TEXT    NOT NULL,
  ad_unit_id       UUID    REFERENCES public.ad_units(id) ON DELETE CASCADE,
  enabled          BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60
);
ALTER TABLE public.ad_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "at_select" ON public.ad_triggers;
DROP POLICY IF EXISTS "at_admin"  ON public.ad_triggers;
CREATE POLICY "at_select" ON public.ad_triggers FOR SELECT USING (true);
CREATE POLICY "at_admin"  ON public.ad_triggers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ad_settings: global ads on/off switch
CREATE TABLE IF NOT EXISTS public.ad_settings (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  ads_enabled      BOOLEAN NOT NULL DEFAULT false,
  default_cooldown INTEGER NOT NULL DEFAULT 60
);
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aset_select" ON public.ad_settings;
DROP POLICY IF EXISTS "aset_admin"  ON public.ad_settings;
CREATE POLICY "aset_select" ON public.ad_settings FOR SELECT USING (true);
CREATE POLICY "aset_admin"  ON public.ad_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 7 · TRIGGER — auto-create profile + wallet on new user signup
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, username, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance, updated_at)
    VALUES (NEW.id, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 8 · REALTIME — enable for tables the app subscribes to
-- DO block silently skips tables already in the publication.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'matches', 'notifications', 'wallets', 'wallet_transactions'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END LOOP;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 9 · STORAGE BUCKET — game banner images (public read, admin write)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('game-banners', 'game-banners', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "game_banners_read"   ON storage.objects;
DROP POLICY IF EXISTS "game_banners_insert" ON storage.objects;
DROP POLICY IF EXISTS "game_banners_delete" ON storage.objects;

CREATE POLICY "game_banners_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-banners');

CREATE POLICY "game_banners_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "game_banners_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 10 · DEFAULT SEED DATA (skipped if rows already exist)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.app_settings (id, min_deposit, max_deposit, min_withdraw, max_withdraw)
  SELECT gen_random_uuid(), 10, 50000, 50, 50000
  WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

INSERT INTO public.points_settings (
  id, kill_points,
  rank_1_points, rank_2_points, rank_3_points,
  rank_4_points, rank_5_points, rank_6_to_10_points
)
  SELECT gen_random_uuid(), 1, 50, 35, 25, 20, 15, 10
  WHERE NOT EXISTS (SELECT 1 FROM public.points_settings);

INSERT INTO public.ad_settings (id, ads_enabled, default_cooldown)
  SELECT gen_random_uuid(), false, 60
  WHERE NOT EXISTS (SELECT 1 FROM public.ad_settings);


-- =============================================================================
-- ✅ SETUP COMPLETE
--
-- 23 tables + 1 view created:
--   users · admin_users · wallets · user_roles
--   games · matches · match_participants · match_results
--   leaderboard (VIEW — aggregates match_results + users)
--   payments · withdrawals · wallet_transactions
--   notifications · user_games · support_tickets · reports
--   teams · team_members
--   app_settings · points_settings · ad_units · ad_triggers · ad_settings
--
-- Trigger:  handle_new_user() — auto-creates users + wallets on signup
-- Realtime: matches · notifications · wallets · wallet_transactions
-- Storage:  game-banners bucket (public read, admin write)
-- Seeds:    app_settings · points_settings · ad_settings
--
-- ── TO GRANT ADMIN ACCESS ────────────────────────────────────────────────────
-- Run this in a new query (replace with your actual Supabase Auth user ID):
--   INSERT INTO public.admin_users (user_id) VALUES ('<your-auth-user-id>');
-- =============================================================================
