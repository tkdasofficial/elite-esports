-- =============================================================================
--  ELITE ESPORTS — COMPLETE DATABASE SETUP (ALL-IN-ONE)
--  Paste this entire file into:
--    Supabase Dashboard → SQL Editor → New query → Run All
--
--  ✅ Safe to run on a FRESH or EXISTING database.
--     Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
--     ON CONFLICT DO NOTHING / DROP POLICY IF EXISTS throughout.
--
--  ✅ Covers ALL migrations 001 → 013 plus the full backend_setup.sql.
--     No need to run individual migration files after this.
--
--  TABLES (25 total):
--    users · admin_users · wallets · user_roles
--    games · matches · match_participants · match_results
--    payments · withdrawals · wallet_transactions
--    notifications · user_games · support_tickets · reports
--    teams · team_members
--    app_settings · points_settings
--    ad_units · ad_triggers · ad_settings
--    match_modes · squad_types · broadcasts
--
--  VIEWS:
--    leaderboard
--
--  FUNCTIONS / RPCs:
--    handle_new_user()         — trigger: auto-create user + wallet on signup
--    claim_match_prize(uuid)   — prize claiming with wallet sync
--    leave_match(uuid)         — atomic leave + refund + wallet sync
--    get_user_match_result(uuid) — backend-computed prize for display
--    credit_ad_bonus()         — credit ₹1 rewarded-ad bonus (daily, deduped)
--
--  REALTIME: matches · notifications · wallets · wallet_transactions
--            withdrawals · teams · team_members
--
--  STORAGE: game-banners (public read, admin write)
--
--  SEED DATA: app_settings · points_settings · ad_settings
--             match_modes · squad_types
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1 · CORE USER TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- users: one row per authenticated user (auto-created by trigger in Part 8)
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


-- wallets: one row per user, auto-created by trigger
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
  game            TEXT,
  banner_url      TEXT,
  entry_fee       NUMERIC     NOT NULL DEFAULT 0,
  prize_pool      NUMERIC     NOT NULL DEFAULT 0,
  max_players     INTEGER     NOT NULL DEFAULT 100,
  joined_players  INTEGER     NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'upcoming'
                              CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  scheduled_at    TIMESTAMPTZ,
  starts_at       TIMESTAMPTZ,
  room_id         TEXT,
  room_password   TEXT,
  room_visible    BOOLEAN     NOT NULL DEFAULT false,
  description     TEXT,
  rules           TEXT,
  live_stream_url TEXT,
  stream_url      TEXT,
  youtube_url     TEXT,
  twitch_url      TEXT,
  facebook_url    TEXT,
  tiktok_url      TEXT,
  game_mode       TEXT,
  squad_type      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS game_id         UUID REFERENCES public.games(id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS game            TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS banner_url      TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS joined_players  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS scheduled_at    TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS starts_at       TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS room_visible    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS description     TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS rules           TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS live_stream_url TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS stream_url      TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS youtube_url     TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS twitch_url      TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS facebook_url    TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS tiktok_url      TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS game_mode       TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS squad_type      TEXT;
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


-- match_modes: admin-configurable match mode types (e.g. TDM, Battle Royale)
CREATE TABLE IF NOT EXISTS public.match_modes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.match_modes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mm_select" ON public.match_modes;
DROP POLICY IF EXISTS "mm_admin"  ON public.match_modes;
CREATE POLICY "mm_select" ON public.match_modes FOR SELECT USING (true);
CREATE POLICY "mm_admin"  ON public.match_modes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- squad_types: admin-configurable squad types (e.g. Solo, Duo, Squad)
CREATE TABLE IF NOT EXISTS public.squad_types (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.squad_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "st_select" ON public.squad_types;
DROP POLICY IF EXISTS "st_admin"  ON public.squad_types;
CREATE POLICY "st_select" ON public.squad_types FOR SELECT USING (true);
CREATE POLICY "st_admin"  ON public.squad_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- leaderboard: aggregated view — wins + points + kills + matches played
-- RLS is enforced on the underlying tables (users, match_results).
-- Drop leaderboard regardless of what type it currently is (table, mat view, etc.)
-- so that CREATE OR REPLACE VIEW always succeeds.
DO $$
DECLARE
  v_relkind CHAR;
BEGIN
  SELECT c.relkind INTO v_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'leaderboard';

  IF v_relkind = 'r' THEN
    EXECUTE 'DROP TABLE public.leaderboard CASCADE';
  ELSIF v_relkind = 'm' THEN
    EXECUTE 'DROP MATERIALIZED VIEW public.leaderboard CASCADE';
  ELSIF v_relkind = 'v' THEN
    EXECUTE 'DROP VIEW public.leaderboard CASCADE';
  END IF;
  -- If NOT FOUND (v_relkind IS NULL) nothing needs to happen.
END;
$$;

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.id                                                                       AS user_id,
  u.username,
  u.avatar_url,
  COUNT(DISTINCT CASE WHEN mr.rank = 1 THEN mr.match_id END)::INTEGER       AS wins,
  COALESCE(SUM(mr.points), 0)::INTEGER                                       AS total_points,
  COALESCE(SUM(mr.kills),  0)::INTEGER                                       AS total_kills,
  COUNT(DISTINCT mr.match_id)::INTEGER                                        AS matches_played
FROM public.users u
INNER JOIN public.match_results mr ON mr.user_id = u.id
GROUP BY u.id, u.username, u.avatar_url
HAVING COUNT(DISTINCT CASE WHEN mr.rank = 1 THEN mr.match_id END) > 0;


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
  upi_id     TEXT,
  status     TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS upi_id TEXT;
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


-- wallet_transactions: internal credit/debit ledger (entry fees, prizes, refunds, ad bonuses)
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

-- notifications: in-app alerts
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
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   TEXT        NOT NULL DEFAULT 'general',
  subject    TEXT,
  message    TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','in_progress','resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS subject  TEXT;
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
  status           TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS related_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
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


-- broadcasts: admin broadcast messages
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title   TEXT        NOT NULL,
  message TEXT        NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bc_select" ON public.broadcasts;
DROP POLICY IF EXISTS "bc_admin"  ON public.broadcasts;
CREATE POLICY "bc_select" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "bc_admin"  ON public.broadcasts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- fcm_tokens: Firebase Cloud Messaging device tokens for push notifications
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL,
  platform   TEXT        NOT NULL DEFAULT 'android',
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fcm_select_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_upsert_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_delete_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_admin"      ON public.fcm_tokens;
CREATE POLICY "fcm_select_own" ON public.fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fcm_upsert_own" ON public.fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fcm_update_own" ON public.fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fcm_delete_own" ON public.fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "fcm_admin" ON public.fcm_tokens FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON public.fcm_tokens(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- sponsorship_applications: Stage 1 — user applies to become a sponsor
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sponsorship_applications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        TEXT        NOT NULL,           -- instagram | youtube | facebook | twitter | tiktok | snapchat | linkedin | other
  handle          TEXT        NOT NULL,           -- @username or channel name
  profile_url     TEXT        NOT NULL,           -- direct link to their profile/channel
  followers_count INTEGER     NOT NULL,           -- audience size the user declares
  niche           TEXT        NOT NULL DEFAULT 'gaming', -- gaming | tech | lifestyle | sports | entertainment | other
  note            TEXT,                           -- optional message to admin
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note      TEXT,                           -- admin's feedback / rejection reason
  reward_amount   NUMERIC     NOT NULL DEFAULT 50, -- ₹ reward for one verified post (set by admin on approve)
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sponsorship_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_select_own"  ON public.sponsorship_applications;
DROP POLICY IF EXISTS "sa_insert_own"  ON public.sponsorship_applications;
DROP POLICY IF EXISTS "sa_admin"       ON public.sponsorship_applications;
CREATE POLICY "sa_select_own" ON public.sponsorship_applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sa_insert_own" ON public.sponsorship_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sa_admin" ON public.sponsorship_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_sa_user   ON public.sponsorship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_sa_status ON public.sponsorship_applications(status);


-- ─────────────────────────────────────────────────────────────────────────────
-- sponsored_posts: Stage 2 — approved sponsors submit their post links
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sponsored_posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id  UUID        NOT NULL REFERENCES public.sponsorship_applications(id) ON DELETE CASCADE,
  platform        TEXT        NOT NULL,
  post_url        TEXT        NOT NULL,           -- link to the published post
  note            TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  admin_note      TEXT,
  reward_paid     BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sponsored_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sp_select_own"  ON public.sponsored_posts;
DROP POLICY IF EXISTS "sp_insert_own"  ON public.sponsored_posts;
DROP POLICY IF EXISTS "sp_admin"       ON public.sponsored_posts;
CREATE POLICY "sp_select_own" ON public.sponsored_posts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sp_insert_own" ON public.sponsored_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sp_admin" ON public.sponsored_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_sp_user          ON public.sponsored_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_application   ON public.sponsored_posts(application_id);
CREATE INDEX IF NOT EXISTS idx_sp_status        ON public.sponsored_posts(status);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 5 · TEAMS
-- team_members MUST be created before the teams_update policy (cross-reference)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  tag        TEXT        NOT NULL DEFAULT '' CHECK (char_length(tag) <= 5),
  slogan     TEXT        NOT NULL DEFAULT '',
  avatar     TEXT        NOT NULL DEFAULT '0',
  code       TEXT        UNIQUE,
  game       TEXT        NOT NULL DEFAULT '',
  created_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS slogan TEXT NOT NULL DEFAULT '';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '0';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS code   TEXT UNIQUE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS game   TEXT NOT NULL DEFAULT '';
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

DROP POLICY IF EXISTS "tm_select"         ON public.team_members;
DROP POLICY IF EXISTS "tm_insert_own"     ON public.team_members;
DROP POLICY IF EXISTS "tm_delete_own"     ON public.team_members;
DROP POLICY IF EXISTS "tm_delete_captain" ON public.team_members;
CREATE POLICY "tm_select"     ON public.team_members FOR SELECT USING (true);
CREATE POLICY "tm_insert_own" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Captain can kick any member; member can leave themselves
CREATE POLICY "tm_delete_captain" ON public.team_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'captain'
    )
  );

-- teams_update references team_members — safe now that team_members exists
CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'captain'
    )
  );
CREATE POLICY "teams_admin" ON public.teams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Back-fill team codes for any existing teams missing one
UPDATE public.teams
  SET code = UPPER(SUBSTRING(MD5(id::text), 1, 8))
  WHERE code IS NULL;

-- Now make code NOT NULL
ALTER TABLE public.teams ALTER COLUMN code SET NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 6 · ADMIN CONFIGURATION TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- app_settings: deposit / withdrawal limits + UPI ID for deposits
CREATE TABLE IF NOT EXISTS public.app_settings (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  min_deposit  NUMERIC NOT NULL DEFAULT 10,
  max_deposit  NUMERIC NOT NULL DEFAULT 50000,
  min_withdraw NUMERIC NOT NULL DEFAULT 50,
  max_withdraw NUMERIC NOT NULL DEFAULT 50000,
  upi_id       TEXT    NOT NULL DEFAULT 'elite@upi'
);
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS upi_id TEXT NOT NULL DEFAULT 'elite@upi';
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
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK (type IN ('interstitial','rewarded','app_open')),
  ad_unit_id TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ad_units ADD COLUMN IF NOT EXISTS ad_unit_id TEXT;
ALTER TABLE public.ad_units ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.ad_units ADD COLUMN IF NOT EXISTS enabled    BOOLEAN NOT NULL DEFAULT true;
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
  trigger          TEXT,
  trigger_type     TEXT,
  ad_unit_id       UUID    REFERENCES public.ad_units(id) ON DELETE CASCADE,
  enabled          BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ad_triggers ADD COLUMN IF NOT EXISTS trigger      TEXT;
ALTER TABLE public.ad_triggers ADD COLUMN IF NOT EXISTS trigger_type TEXT;
ALTER TABLE public.ad_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "at_select" ON public.ad_triggers;
DROP POLICY IF EXISTS "at_admin"  ON public.ad_triggers;
CREATE POLICY "at_select" ON public.ad_triggers FOR SELECT USING (true);
CREATE POLICY "at_admin"  ON public.ad_triggers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ad_settings: global ads on/off switch + default cooldown
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
-- PART 7 · INDEXES (performance)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_match_participants_match ON public.match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user  ON public.match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_match_results_match      ON public.match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_user       ON public.match_results(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user            ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user         ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user       ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team        ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user        ON public.team_members(user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 8 · TRIGGER — auto-create user row + wallet on new auth signup
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
-- PART 9 · RPCs (SECURITY DEFINER functions)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 9a. join_match — atomic match join: checks balance, deducts fee, adds participant
CREATE OR REPLACE FUNCTION public.join_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID    := auth.uid();
  v_status       TEXT;
  v_max_players  INTEGER;
  v_joined       INTEGER;
  v_fee          NUMERIC;
  v_balance      NUMERIC;
  v_ref          TEXT    := 'entry:' || _match_id;
  v_already      BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 1. Load match details
  SELECT status, max_players, joined_players, entry_fee
  INTO v_status, v_max_players, v_joined, v_fee
  FROM public.matches
  WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status <> 'upcoming' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is not open for registration');
  END IF;

  IF v_joined >= v_max_players THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is full');
  END IF;

  -- 2. Idempotency: already joined?
  SELECT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already joined this match');
  END IF;

  -- 3. Balance check (only if entry_fee > 0)
  IF v_fee > 0 THEN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM public.wallets
    WHERE user_id = v_user_id;

    IF v_balance IS NULL OR v_balance < v_fee THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    -- 4a. Deduct from wallet
    UPDATE public.wallets
    SET balance    = balance - v_fee,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- 4b. Record the debit transaction
    INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
    VALUES (v_user_id, 'debit', v_fee, 'approved', v_ref);
  END IF;

  -- 5. Add participant
  INSERT INTO public.match_participants (match_id, user_id)
  VALUES (_match_id, v_user_id)
  ON CONFLICT (match_id, user_id) DO NOTHING;

  -- 6. Increment joined_players
  UPDATE public.matches
  SET joined_players = joined_players + 1
  WHERE id = _match_id;

  RETURN jsonb_build_object(
    'success',    true,
    'fee_paid',   v_fee,
    'match_id',   _match_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.join_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_match(UUID) TO authenticated;


-- ── 9b. claim_match_prize — credit prize to wallet (idempotent) ──────────────
CREATE OR REPLACE FUNCTION public.claim_match_prize(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID    := auth.uid();
  v_status     TEXT;
  v_prize_pool NUMERIC;
  v_rank       INTEGER;
  v_points     INTEGER;
  v_prize      NUMERIC;
  v_ref        TEXT    := 'result:' || _match_id;
  v_already    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, prize_pool
  INTO v_status, v_prize_pool
  FROM public.matches WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status <> 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is not completed yet');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You did not participate in this match');
  END IF;

  SELECT rank, points
  INTO v_rank, v_points
  FROM public.match_results
  WHERE match_id = _match_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No result recorded for you in this match');
  END IF;

  v_prize := CASE v_rank
    WHEN 1 THEN v_prize_pool * 0.50
    WHEN 2 THEN v_prize_pool * 0.30
    WHEN 3 THEN v_prize_pool * 0.10
    ELSE 0
  END;

  IF v_prize <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No prize for your rank');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prize already claimed');
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', v_prize, 'approved', v_ref);

  -- Sync wallets.balance so realtime fires immediately
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, v_prize, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_prize,
        updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'prize',   v_prize,
    'rank',    v_rank,
    'points',  v_points
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_match_prize(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_match_prize(UUID) TO authenticated;


-- ── 9b. leave_match — atomic leave + refund + wallet sync ────────────────────
CREATE OR REPLACE FUNCTION public.leave_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  UUID    := auth.uid();
  v_status   TEXT;
  v_fee      NUMERIC;
  v_refunded BOOLEAN := false;
  v_ref      TEXT    := 'refund:' || _match_id;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, entry_fee
  INTO v_status, v_fee
  FROM public.matches WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot leave a completed match');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have not joined this match');
  END IF;

  -- Remove participant
  DELETE FROM public.match_participants
  WHERE match_id = _match_id AND user_id = v_user_id;

  -- Decrement player count (floor at 0)
  UPDATE public.matches
  SET joined_players = GREATEST(0, joined_players - 1)
  WHERE id = _match_id;

  -- Refund entry fee for upcoming matches only (idempotent)
  IF v_fee > 0 AND v_status = 'upcoming' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE user_id = v_user_id AND reference_id = v_ref
    ) THEN
      INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
      VALUES (v_user_id, 'credit', v_fee, 'approved', v_ref);

      INSERT INTO public.wallets (user_id, balance, updated_at)
      VALUES (v_user_id, v_fee, NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET balance    = public.wallets.balance + v_fee,
            updated_at = NOW();

      v_refunded := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success',       true,
    'refunded',      v_refunded,
    'refund_amount', CASE WHEN v_refunded THEN v_fee ELSE 0 END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.leave_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_match(UUID) TO authenticated;


-- ── 9c. get_user_match_result — backend-computed prize for display ────────────
CREATE OR REPLACE FUNCTION public.get_user_match_result(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID    := auth.uid();
  v_prize_pool NUMERIC;
  v_rank       INTEGER;
  v_kills      INTEGER;
  v_points     INTEGER;
  v_prize      NUMERIC;
  v_claimed    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT rank, kills, points
  INTO v_rank, v_kills, v_points
  FROM public.match_results
  WHERE match_id = _match_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT prize_pool INTO v_prize_pool
  FROM public.matches WHERE id = _match_id;

  v_prize := CASE v_rank
    WHEN 1 THEN v_prize_pool * 0.50
    WHEN 2 THEN v_prize_pool * 0.30
    WHEN 3 THEN v_prize_pool * 0.10
    ELSE 0
  END;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id
      AND reference_id = 'result:' || _match_id::text
      AND type = 'credit'
  ) INTO v_claimed;

  RETURN jsonb_build_object(
    'found',           true,
    'rank',            v_rank,
    'kills',           v_kills,
    'points',          v_points,
    'prize',           v_prize,
    'already_claimed', v_claimed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_match_result(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_match_result(UUID) TO authenticated;


-- ── 9d. credit_ad_bonus — ₹1 daily rewarded-ad bonus (deduped per day) ───────
CREATE OR REPLACE FUNCTION public.credit_ad_bonus()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ref     TEXT;
  v_already BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- One bonus per calendar day per user (IST timezone)
  v_ref := 'ad_bonus:' || v_user_id::text || ':' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bonus already claimed today');
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', 1, 'approved', v_ref);

  -- Sync wallets.balance so realtime fires immediately
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + 1,
        updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'amount', 1);
END;
$$;

REVOKE ALL ON FUNCTION public.credit_ad_bonus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_ad_bonus() TO authenticated;


-- ── 9e. verify_sponsored_post — admin credits reward after verifying a post ──
CREATE OR REPLACE FUNCTION public.verify_sponsored_post(
  _post_id        UUID,
  _reward_amount  NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin         UUID := auth.uid();
  v_user_id       UUID;
  v_app_id        UUID;
  v_reward        NUMERIC;
  v_already_paid  BOOLEAN;
  v_ref           TEXT;
BEGIN
  -- Must be admin
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Load the post
  SELECT sp.user_id, sp.application_id, sp.reward_paid
  INTO v_user_id, v_app_id, v_already_paid
  FROM public.sponsored_posts sp
  WHERE sp.id = _post_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found');
  END IF;

  IF v_already_paid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward already paid for this post');
  END IF;

  -- Reward amount: explicit param → application's reward_amount → default 50
  IF _reward_amount IS NOT NULL AND _reward_amount > 0 THEN
    v_reward := _reward_amount;
  ELSE
    SELECT reward_amount INTO v_reward FROM public.sponsorship_applications WHERE id = v_app_id;
    v_reward := COALESCE(v_reward, 50);
  END IF;

  v_ref := 'sponsored:' || _post_id;

  -- Mark post verified
  UPDATE public.sponsored_posts
  SET status = 'verified', reward_paid = true, admin_note = NULL
  WHERE id = _post_id;

  -- Credit wallet
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, v_reward, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_reward,
        updated_at = NOW();

  -- Wallet transaction record
  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', v_reward, 'approved', v_ref);

  -- Push notification to user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_user_id,
    'Sponsorship Reward Credited! 🎉',
    '₹' || v_reward || ' has been added to your wallet for your sponsored post. Thank you!',
    'info'
  );

  RETURN jsonb_build_object(
    'success',        true,
    'reward_amount',  v_reward,
    'user_id',        v_user_id,
    'post_id',        _post_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_sponsored_post(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_sponsored_post(UUID, NUMERIC) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 10 · REALTIME — enable for all live-subscribed tables
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'matches',
    'notifications',
    'wallets',
    'wallet_transactions',
    'withdrawals',
    'teams',
    'team_members',
    'sponsorship_applications',
    'sponsored_posts'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION WHEN others THEN
      NULL; -- Already in publication, skip silently
    END;
  END LOOP;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 11 · STORAGE BUCKET — game banner images (public read, admin write)
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
-- PART 12 · SEED DATA (all idempotent — skipped if rows already exist)
-- ─────────────────────────────────────────────────────────────────────────────

-- Default app_settings
INSERT INTO public.app_settings (id, min_deposit, max_deposit, min_withdraw, max_withdraw, upi_id)
  SELECT gen_random_uuid(), 10, 50000, 50, 50000, 'elite@upi'
  WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

-- Default points_settings
INSERT INTO public.points_settings (
  id, kill_points,
  rank_1_points, rank_2_points, rank_3_points,
  rank_4_points, rank_5_points, rank_6_to_10_points
)
  SELECT gen_random_uuid(), 1, 50, 35, 25, 20, 15, 10
  WHERE NOT EXISTS (SELECT 1 FROM public.points_settings);

-- Default ad_settings
INSERT INTO public.ad_settings (id, ads_enabled, default_cooldown)
  SELECT gen_random_uuid(), false, 60
  WHERE NOT EXISTS (SELECT 1 FROM public.ad_settings);

-- Default match modes
INSERT INTO public.match_modes (name, sort_order) VALUES
  ('Full Map',      1),
  ('TDM',           2),
  ('PVP',           3),
  ('Battle Royale', 4),
  ('Clash Squad',   5),
  ('Ranked',        6)
ON CONFLICT (name) DO NOTHING;

-- Default squad types
INSERT INTO public.squad_types (name, sort_order) VALUES
  ('Solo',  1),
  ('Duo',   2),
  ('3v3',   3),
  ('4v4',   4),
  ('Squad', 5)
ON CONFLICT (name) DO NOTHING;


-- =============================================================================
-- ✅ SETUP COMPLETE
--
-- TABLES (29 total):
--   users · admin_users · wallets · user_roles
--   games · matches · match_participants · match_results
--   payments · withdrawals · wallet_transactions
--   notifications · user_games · support_tickets · reports · broadcasts
--   fcm_tokens (push notification tokens)
--   sponsorship_applications (Stage 1: user applies with platform + follower count)
--   sponsored_posts          (Stage 2: approved users submit post links for wallet rewards)
--   teams · team_members
--   app_settings · points_settings
--   ad_units · ad_triggers · ad_settings
--   match_modes · squad_types
--
-- VIEWS:  leaderboard (wins + points + kills + matches_played)
--
-- RPCs (6 total):
--   join_match(uuid)                     — check balance → deduct fee → add participant
--   claim_match_prize(uuid)              — credit rank prize, sync wallet
--   leave_match(uuid)                    — remove participant, refund fee if upcoming
--   get_user_match_result(uuid)          — backend-computed prize info for display
--   credit_ad_bonus()                    — ₹1 daily rewarded-ad bonus
--   verify_sponsored_post(uuid, numeric) — admin: credit reward, push notification
--
-- TRIGGER: handle_new_user() — auto-creates users row + wallet on signup
-- REALTIME: matches · notifications · wallets · wallet_transactions
--           withdrawals · teams · team_members
--           sponsorship_applications · sponsored_posts
-- STORAGE:  game-banners (public read, admin write)
--
-- TO GRANT ADMIN ACCESS to a user:
--   INSERT INTO public.admin_users (user_id) VALUES ('<auth-user-id-here>');
-- =============================================================================
