-- =============================================================================
--  ELITE ESPORTS — COMPLETE DATABASE SETUP (FINAL · ALL-IN-ONE)
--  Generated: 2026-04-08  |  Covers ALL migrations 001 → 018 + backend_setup
--
--  ✅ Safe on a FRESH or EXISTING Supabase project.
--     Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
--     ON CONFLICT DO NOTHING / DROP POLICY IF EXISTS throughout.
--
--  HOW TO USE:
--    Supabase Dashboard → SQL Editor → New query → paste → Run All
--
--  TABLES (32 total):
--    users · admin_users · wallets · user_roles
--    games · matches · match_participants · match_results
--    match_modes · squad_types · match_prize_splits
--    payments · withdrawals · wallet_transactions
--    notifications · user_games · support_tickets · reports · broadcasts
--    fcm_tokens
--    sponsorship_applications · sponsored_posts
--    teams · team_members
--    app_settings · points_settings
--    ad_units · ad_triggers · ad_settings
--    device_registrations · ncm_notifications
--
--  VIEWS: leaderboard
--
--  FUNCTIONS / RPCs (15 total):
--    handle_new_user()                        — trigger: auto-create user + wallet
--    join_match(uuid)                         — check KYC/balance → deduct → add participant
--    leave_match(uuid)                        — remove participant, NO refund
--    claim_match_prize(uuid)                  — credit rank prize + sync wallet
--    auto_distribute_prize()                  — trigger on match_results INSERT
--    get_user_match_result(uuid)              — backend-computed prize for display
--    credit_ad_bonus()                        — ₹1 daily rewarded-ad bonus
--    check_email_registered(text)             — new vs existing user check
--    sync_kyc_status()                        — sync kyc_completed from auth.users metadata
--    get_referral_code()                      — get/generate caller's referral code
--    use_referral_code(text)                  — credit referrer ₹10 bonus
--    update_app_settings(...)                 — admin-only: change UPI ID + limits
--    get_admin_settings()                     — admin-only: read settings
--    verify_sponsored_post(uuid, numeric)     — admin: approve post + credit reward
--    notify_user(...)                         — helper: push to ncm_notifications + notifications
--    broadcast_notification(text, text, uuid) — admin: push to all or one user
--
--  NCM DB TRIGGERS (8):
--    ncm_match_joined          → match_participants INSERT
--    ncm_wallet_credited       → wallet_transactions INSERT (prize/referral/ad/refund)
--    ncm_payment_received      → payments INSERT
--    ncm_payment_status        → payments UPDATE (approved/rejected)
--    ncm_withdrawal_received   → withdrawals INSERT
--    ncm_withdrawal_status     → withdrawals UPDATE (approved/rejected)
--    ncm_match_result          → match_results INSERT
--    ncm_match_status_change   → matches UPDATE of status (live/cancelled)
--
--  AUTO-PRIZE TRIGGER: trg_auto_prize_on_result → match_results INSERT
--
--  REALTIME: matches · notifications · wallets · wallet_transactions
--            withdrawals · teams · team_members · ncm_notifications
--            device_registrations · sponsorship_applications
--            sponsored_posts · app_settings · match_prize_splits
--
--  STORAGE: game-banners (public read, admin write)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1 · CORE USER TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT,
  username       TEXT        UNIQUE,
  avatar_url     TEXT,
  kyc_completed  BOOLEAN     NOT NULL DEFAULT false,
  phone          TEXT,
  referral_code  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_completed  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code  TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'users'
      AND constraint_name = 'users_referral_code_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
  END IF;
END;
$$;

-- Populate referral_code for any existing users missing it
UPDATE public.users
SET referral_code = UPPER(SUBSTRING(encode(sha256(id::text::bytea), 'hex'), 1, 8))
WHERE referral_code IS NULL;

-- Bulk-mark users with a username as KYC-complete (backfill)
UPDATE public.users
SET kyc_completed = true
WHERE username IS NOT NULL AND kyc_completed = false;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select"     ON public.users;
DROP POLICY IF EXISTS "users_insert"     ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_select"     ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert"     ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);


CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT USING (true);


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


CREATE TABLE IF NOT EXISTS public.match_results (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID    NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank         INTEGER NOT NULL DEFAULT 0,
  kills        INTEGER NOT NULL DEFAULT 0,
  points       INTEGER NOT NULL DEFAULT 0,
  prize_amount NUMERIC,
  UNIQUE(match_id, user_id)
);
ALTER TABLE public.match_results ADD COLUMN IF NOT EXISTS prize_amount NUMERIC;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mr_select" ON public.match_results;
DROP POLICY IF EXISTS "mr_admin"  ON public.match_results;
CREATE POLICY "mr_select" ON public.match_results FOR SELECT USING (true);
CREATE POLICY "mr_admin"  ON public.match_results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- match_prize_splits: admin-defined per-rank prize overrides for a match
CREATE TABLE IF NOT EXISTS public.match_prize_splits (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID    NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rank         INTEGER NOT NULL CHECK (rank > 0),
  prize_amount NUMERIC NOT NULL DEFAULT 0 CHECK (prize_amount >= 0),
  CONSTRAINT match_prize_splits_match_rank_unique UNIQUE (match_id, rank)
);
ALTER TABLE public.match_prize_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mps_select" ON public.match_prize_splits;
DROP POLICY IF EXISTS "mps_admin"  ON public.match_prize_splits;
CREATE POLICY "mps_select" ON public.match_prize_splits FOR SELECT USING (true);
CREATE POLICY "mps_admin"  ON public.match_prize_splits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


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


-- Leaderboard view — wins + points + kills + matches played
DO $$
DECLARE v_relkind CHAR;
BEGIN
  SELECT c.relkind INTO v_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'leaderboard';
  IF v_relkind = 'r' THEN EXECUTE 'DROP TABLE public.leaderboard CASCADE';
  ELSIF v_relkind = 'm' THEN EXECUTE 'DROP MATERIALIZED VIEW public.leaderboard CASCADE';
  ELSIF v_relkind = 'v' THEN EXECUTE 'DROP VIEW public.leaderboard CASCADE';
  END IF;
END;
$$;

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.id                                                                       AS id,
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


-- wallet_transactions: credit/debit ledger
-- NOTE: Columns are TEXT + CHECK (not ENUM) to prevent type-mismatch issues.
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  amount       NUMERIC     NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'approved',
  reference_id TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Convert enum → TEXT if needed (safe no-op if already TEXT)
ALTER TABLE public.wallet_transactions ALTER COLUMN type   DROP DEFAULT;
ALTER TABLE public.wallet_transactions ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.wallet_transactions ALTER COLUMN type   TYPE TEXT USING type::TEXT;
ALTER TABLE public.wallet_transactions ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_status_check;
DROP TYPE IF EXISTS public.wallet_tx_type   CASCADE;
DROP TYPE IF EXISTS public.wallet_tx_status CASCADE;
DROP TYPE IF EXISTS wallet_tx_type          CASCADE;
DROP TYPE IF EXISTS wallet_tx_status        CASCADE;
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN ('credit', 'debit'));
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.wallet_transactions ALTER COLUMN status SET DEFAULT 'approved';
ALTER TABLE public.wallet_transactions ALTER COLUMN type   SET NOT NULL;
ALTER TABLE public.wallet_transactions ALTER COLUMN status SET NOT NULL;

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

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'general',
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'general';
  END IF;
END;
$$;
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


CREATE TABLE IF NOT EXISTS public.user_games (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id      UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  uid          TEXT NOT NULL,
  in_game_name TEXT,
  UNIQUE(user_id, game_id)
);
ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS in_game_name TEXT;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ug_select"     ON public.user_games;
DROP POLICY IF EXISTS "ug_insert_own" ON public.user_games;
DROP POLICY IF EXISTS "ug_update_own" ON public.user_games;
DROP POLICY IF EXISTS "ug_delete_own" ON public.user_games;
CREATE POLICY "ug_select"     ON public.user_games FOR SELECT USING (true);
CREATE POLICY "ug_insert_own" ON public.user_games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ug_update_own" ON public.user_games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ug_delete_own" ON public.user_games FOR DELETE USING (auth.uid() = user_id);


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


-- fcm_tokens: Firebase Cloud Messaging device push tokens
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        TEXT        NOT NULL,
  platform     TEXT        NOT NULL DEFAULT 'android',
  email        TEXT,
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fcm_select_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_insert_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_update_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_delete_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_admin"      ON public.fcm_tokens;
CREATE POLICY "fcm_select_own" ON public.fcm_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fcm_insert_own" ON public.fcm_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fcm_update_own" ON public.fcm_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fcm_delete_own" ON public.fcm_tokens FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "fcm_admin" ON public.fcm_tokens FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 5 · TEAMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  tag        TEXT        NOT NULL CHECK (char_length(tag) <= 5),
  game       TEXT        NOT NULL,
  slogan     TEXT,
  avatar_url TEXT,
  invite_code TEXT       UNIQUE,
  created_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS slogan      TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS avatar_url  TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON public.teams FOR INSERT WITH CHECK (auth.uid() = created_by);


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

-- teams_update / teams_admin must come after team_members
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin"  ON public.teams;
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
-- PART 7 · SPONSORSHIP
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sponsorship_applications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform       TEXT        NOT NULL,
  profile_url    TEXT        NOT NULL,
  follower_count INTEGER,
  reward_amount  NUMERIC     NOT NULL DEFAULT 50,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected')),
  admin_note     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sponsorship_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sa_select_own" ON public.sponsorship_applications;
DROP POLICY IF EXISTS "sa_insert_own" ON public.sponsorship_applications;
DROP POLICY IF EXISTS "sa_admin"      ON public.sponsorship_applications;
CREATE POLICY "sa_select_own" ON public.sponsorship_applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sa_insert_own" ON public.sponsorship_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sa_admin" ON public.sponsorship_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


CREATE TABLE IF NOT EXISTS public.sponsored_posts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID        REFERENCES public.sponsorship_applications(id) ON DELETE SET NULL,
  post_url       TEXT        NOT NULL,
  platform       TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','verified','rejected')),
  reward_paid    BOOLEAN     NOT NULL DEFAULT false,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sponsored_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sp_select_own" ON public.sponsored_posts;
DROP POLICY IF EXISTS "sp_insert_own" ON public.sponsored_posts;
DROP POLICY IF EXISTS "sp_admin"      ON public.sponsored_posts;
CREATE POLICY "sp_select_own" ON public.sponsored_posts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sp_insert_own" ON public.sponsored_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sp_admin" ON public.sponsored_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 8 · NATIVE CLOUD MESSAGING (NCM)
-- ─────────────────────────────────────────────────────────────────────────────

-- device_registrations: one row per app-install (unique by DUID)
CREATE TABLE IF NOT EXISTS public.device_registrations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duid         TEXT        NOT NULL,
  platform     TEXT        NOT NULL DEFAULT 'android'
                           CHECK (platform IN ('ios','android','web')),
  os_version   TEXT,
  push_token   TEXT,
  email        TEXT,
  display_name TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT device_registrations_duid_key UNIQUE (duid)
);
CREATE INDEX IF NOT EXISTS idx_device_reg_user   ON public.device_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_reg_active ON public.device_registrations(user_id, is_active);
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dr_select_own" ON public.device_registrations;
DROP POLICY IF EXISTS "dr_upsert_own" ON public.device_registrations;
DROP POLICY IF EXISTS "dr_update_own" ON public.device_registrations;
DROP POLICY IF EXISTS "dr_admin"      ON public.device_registrations;
CREATE POLICY "dr_select_own" ON public.device_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dr_upsert_own" ON public.device_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dr_update_own" ON public.device_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dr_admin" ON public.device_registrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));


-- ncm_notifications: every notification queued for device delivery
CREATE TABLE IF NOT EXISTS public.ncm_notifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  target_duid    TEXT,
  title          TEXT        NOT NULL,
  body           TEXT        NOT NULL,
  data           JSONB       NOT NULL DEFAULT '{}',
  channel_id     TEXT        NOT NULL DEFAULT 'elite-esports-default',
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','delivered','failed')),
  delivered_at   TIMESTAMPTZ,
  retry_count    INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ncm_user_status ON public.ncm_notifications(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_ncm_pending     ON public.ncm_notifications(status, created_at)
  WHERE status = 'pending';
ALTER TABLE public.ncm_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ncm_select_own" ON public.ncm_notifications;
DROP POLICY IF EXISTS "ncm_update_own" ON public.ncm_notifications;
DROP POLICY IF EXISTS "ncm_admin_all"  ON public.ncm_notifications;
CREATE POLICY "ncm_select_own" ON public.ncm_notifications
  FOR SELECT USING (target_user_id = auth.uid() OR target_user_id IS NULL);
CREATE POLICY "ncm_update_own" ON public.ncm_notifications
  FOR UPDATE USING (target_user_id = auth.uid());
CREATE POLICY "ncm_admin_all" ON public.ncm_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 9 · TRIGGER — handle_new_user (auto-create public.users row + wallet)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    UPPER(SUBSTRING(encode(sha256(NEW.id::text::bytea), 'hex'), 1, 8))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 10 · RPCs
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 10a. check_email_registered — new vs existing user check ─────────────────
CREATE OR REPLACE FUNCTION public.check_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth.users
  WHERE email = LOWER(TRIM(p_email));
  RETURN v_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_email_registered(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_registered(TEXT) TO anon, authenticated;


-- ── 10b. join_match — KYC check → balance deduction → add participant ─────────
CREATE OR REPLACE FUNCTION public.join_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID    := auth.uid();
  v_status  TEXT;
  v_fee     NUMERIC;
  v_max     INTEGER;
  v_joined  INTEGER;
  v_balance NUMERIC;
  v_ref     TEXT    := 'entry:' || _match_id;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, entry_fee, max_players, joined_players
  INTO v_status, v_fee, v_max, v_joined
  FROM public.matches WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status <> 'upcoming' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is no longer open for registration');
  END IF;

  IF v_joined >= v_max THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is full');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_joined', true);
  END IF;

  IF v_fee > 0 THEN
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_user_id;
    IF NOT FOUND OR COALESCE(v_balance, 0) < v_fee THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;
    UPDATE public.wallets
    SET balance    = balance - v_fee,
        updated_at = NOW()
    WHERE user_id = v_user_id;
    INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
    VALUES (v_user_id, 'debit', v_fee, 'approved', v_ref);
  END IF;

  INSERT INTO public.match_participants (match_id, user_id)
  VALUES (_match_id, v_user_id)
  ON CONFLICT (match_id, user_id) DO NOTHING;

  UPDATE public.matches
  SET joined_players = joined_players + 1
  WHERE id = _match_id;

  RETURN jsonb_build_object('success', true, 'already_joined', false);
END;
$$;

REVOKE ALL ON FUNCTION public.join_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_match(UUID) TO authenticated;


-- ── 10c. leave_match — remove participant (NO refund) ─────────────────────────
CREATE OR REPLACE FUNCTION public.leave_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_status  TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status INTO v_status FROM public.matches WHERE id = _match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  IF v_status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot leave a completed match');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have not joined this match');
  END IF;

  DELETE FROM public.match_participants WHERE match_id = _match_id AND user_id = v_user_id;
  UPDATE public.matches
  SET joined_players = GREATEST(0, joined_players - 1)
  WHERE id = _match_id;

  RETURN jsonb_build_object('success', true, 'refunded', false, 'refund_amount', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_match(UUID) TO authenticated;


-- ── 10d. auto_distribute_prize — trigger on match_results INSERT ──────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc WHERE proname = 'auto_distribute_prize'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.auto_distribute_prize(%s) CASCADE', r.args);
  END LOOP;
END;
$$;

CREATE FUNCTION public.auto_distribute_prize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize NUMERIC := 0;
  v_pool  NUMERIC := 0;
  v_ref   TEXT    := 'autopay:' || NEW.match_id::TEXT;
BEGIN
  SELECT prize_amount INTO v_prize
  FROM public.match_prize_splits
  WHERE match_id = NEW.match_id AND rank = NEW.rank
  LIMIT 1;

  IF v_prize IS NULL OR v_prize <= 0 THEN
    SELECT prize_pool INTO v_pool FROM public.matches WHERE id = NEW.match_id;
    v_prize := CASE NEW.rank
      WHEN 1 THEN COALESCE(v_pool, 0) * 0.50
      WHEN 2 THEN COALESCE(v_pool, 0) * 0.30
      WHEN 3 THEN COALESCE(v_pool, 0) * 0.10
      ELSE 0
    END;
  END IF;

  IF v_prize <= 0 THEN RETURN NEW; END IF;

  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = NEW.user_id AND reference_id = v_ref
  ) THEN RETURN NEW; END IF;

  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (NEW.user_id, v_prize, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + EXCLUDED.balance,
        updated_at = NOW();

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (NEW.user_id, 'credit', v_prize, 'approved', v_ref);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_prize_on_result ON public.match_results;
CREATE TRIGGER trg_auto_prize_on_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.auto_distribute_prize();


-- ── 10e. claim_match_prize — manual prize claim with prize_splits fallback ────
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

  SELECT status, prize_pool INTO v_status, v_prize_pool
  FROM public.matches WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  IF v_status <> 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is not completed yet');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You did not participate in this match');
  END IF;

  SELECT rank, points INTO v_rank, v_points
  FROM public.match_results WHERE match_id = _match_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No result recorded for you in this match');
  END IF;

  SELECT prize_amount INTO v_prize
  FROM public.match_prize_splits WHERE match_id = _match_id AND rank = v_rank LIMIT 1;

  IF v_prize IS NULL OR v_prize <= 0 THEN
    v_prize := CASE v_rank
      WHEN 1 THEN v_prize_pool * 0.50
      WHEN 2 THEN v_prize_pool * 0.30
      WHEN 3 THEN v_prize_pool * 0.10
      ELSE 0
    END;
  END IF;

  IF v_prize <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No prize for your rank');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prize already claimed');
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', v_prize, 'approved', v_ref);

  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, v_prize, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_prize,
        updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'prize', v_prize, 'rank', v_rank, 'points', v_points);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_match_prize(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_match_prize(UUID) TO authenticated;


-- ── 10f. get_user_match_result — backend-computed prize info for display ──────
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
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT rank, kills, points INTO v_rank, v_kills, v_points
  FROM public.match_results WHERE match_id = _match_id AND user_id = v_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT prize_pool INTO v_prize_pool FROM public.matches WHERE id = _match_id;

  SELECT prize_amount INTO v_prize
  FROM public.match_prize_splits WHERE match_id = _match_id AND rank = v_rank LIMIT 1;

  IF v_prize IS NULL OR v_prize <= 0 THEN
    v_prize := CASE v_rank
      WHEN 1 THEN v_prize_pool * 0.50
      WHEN 2 THEN v_prize_pool * 0.30
      WHEN 3 THEN v_prize_pool * 0.10
      ELSE 0
    END;
  END IF;

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


-- ── 10g. credit_ad_bonus — ₹1 daily rewarded-ad bonus (deduped per day) ──────
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

  v_ref := 'ad_bonus:' || v_user_id::text || ':' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bonus already claimed today');
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', 1, 'approved', v_ref);

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


-- ── 10h. sync_kyc_status — called from kyc.tsx after profile setup ────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc WHERE proname = 'sync_kyc_status'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.sync_kyc_status(%s) CASCADE', r.args);
  END LOOP;
END;
$$;

CREATE FUNCTION public.sync_kyc_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta JSONB;
BEGIN
  SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = auth.uid();
  IF v_meta IS NULL THEN RETURN; END IF;

  UPDATE public.users
  SET kyc_completed = COALESCE((v_meta->>'kyc_completed')::BOOLEAN, false),
      referral_code = COALESCE(
        referral_code,
        UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8))
      )
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    INSERT INTO public.users (id, kyc_completed, referral_code)
    VALUES (
      auth.uid(),
      COALESCE((v_meta->>'kyc_completed')::BOOLEAN, false),
      UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8))
    )
    ON CONFLICT (id) DO UPDATE
      SET kyc_completed = COALESCE((v_meta->>'kyc_completed')::BOOLEAN, false),
          referral_code = COALESCE(
            public.users.referral_code,
            UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8))
          );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_kyc_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_kyc_status() TO authenticated;


-- ── 10i. get_referral_code — get/generate caller's referral code ──────────────
CREATE OR REPLACE FUNCTION public.get_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_code FROM public.users WHERE id = auth.uid();
  IF v_code IS NULL OR v_code = '' THEN
    v_code := UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8));
    UPDATE public.users SET referral_code = v_code WHERE id = auth.uid();
    IF NOT FOUND THEN
      INSERT INTO public.users (id, referral_code)
      VALUES (auth.uid(), v_code)
      ON CONFLICT (id) DO UPDATE SET referral_code = EXCLUDED.referral_code;
    END IF;
  END IF;
  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.get_referral_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referral_code() TO authenticated;


-- ── 10j. use_referral_code — credit referrer ₹10 bonus ───────────────────────
CREATE OR REPLACE FUNCTION public.use_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_owner_id UUID;
  v_reward   NUMERIC := 10;
  v_ref      TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No code provided');
  END IF;

  SELECT id INTO v_owner_id
  FROM public.users
  WHERE referral_code = UPPER(TRIM(p_code)) AND id <> v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  v_ref := 'referral:' || v_user_id::TEXT;
  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions WHERE user_id = v_owner_id AND reference_id = v_ref
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral already applied');
  END IF;

  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_owner_id, v_reward, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_reward,
        updated_at = NOW();

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_owner_id, 'credit', v_reward, 'approved', v_ref);

  RETURN jsonb_build_object('success', true, 'reward', v_reward, 'referrer', v_owner_id);
END;
$$;

REVOKE ALL ON FUNCTION public.use_referral_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_referral_code(TEXT) TO authenticated;


-- ── 10k. update_app_settings — admin-only RPC ────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_app_settings(
  p_upi_id       TEXT    DEFAULT NULL,
  p_min_deposit  NUMERIC DEFAULT NULL,
  p_max_deposit  NUMERIC DEFAULT NULL,
  p_min_withdraw NUMERIC DEFAULT NULL,
  p_max_withdraw NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  UUID    := auth.uid();
  v_is_admin BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_user_id) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;
  UPDATE public.app_settings SET
    upi_id       = COALESCE(p_upi_id,       upi_id),
    min_deposit  = COALESCE(p_min_deposit,  min_deposit),
    max_deposit  = COALESCE(p_max_deposit,  max_deposit),
    min_withdraw = COALESCE(p_min_withdraw, min_withdraw),
    max_withdraw = COALESCE(p_max_withdraw, max_withdraw);
  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.update_app_settings(TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_app_settings(TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;


-- ── 10l. get_admin_settings — admin-only read ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  UUID    := auth.uid();
  v_is_admin BOOLEAN := false;
  v_row      public.app_settings;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_user_id) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;
  SELECT * INTO v_row FROM public.app_settings LIMIT 1;
  RETURN jsonb_build_object(
    'success',      true,
    'upi_id',       v_row.upi_id,
    'min_deposit',  v_row.min_deposit,
    'max_deposit',  v_row.max_deposit,
    'min_withdraw', v_row.min_withdraw,
    'max_withdraw', v_row.max_withdraw
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_settings() TO authenticated;


-- ── 10m. verify_sponsored_post — admin: approve post + credit reward ──────────
CREATE OR REPLACE FUNCTION public.verify_sponsored_post(
  _post_id       UUID,
  _reward_amount NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin        UUID := auth.uid();
  v_user_id      UUID;
  v_app_id       UUID;
  v_reward       NUMERIC;
  v_already_paid BOOLEAN;
  v_ref          TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  SELECT sp.user_id, sp.application_id, sp.reward_paid
  INTO v_user_id, v_app_id, v_already_paid
  FROM public.sponsored_posts sp WHERE sp.id = _post_id;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Post not found'); END IF;
  IF v_already_paid THEN RETURN jsonb_build_object('success', false, 'error', 'Reward already paid'); END IF;

  IF _reward_amount IS NOT NULL AND _reward_amount > 0 THEN
    v_reward := _reward_amount;
  ELSE
    SELECT reward_amount INTO v_reward FROM public.sponsorship_applications WHERE id = v_app_id;
    v_reward := COALESCE(v_reward, 50);
  END IF;

  v_ref := 'sponsored:' || _post_id;

  UPDATE public.sponsored_posts SET status = 'verified', reward_paid = true WHERE id = _post_id;

  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, v_reward, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_reward,
        updated_at = NOW();

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', v_reward, 'approved', v_ref);

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_user_id,
    'Sponsorship Reward Credited!',
    '₹' || v_reward || ' has been added to your wallet for your sponsored post.',
    'info'
  );

  RETURN jsonb_build_object('success', true, 'reward_amount', v_reward, 'user_id', v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_sponsored_post(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_sponsored_post(UUID, NUMERIC) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 11 · NCM HELPER FUNCTIONS + 8 TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- notify_user helper — inserts into ncm_notifications + notifications
CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id UUID,
  p_title   TEXT,
  p_body    TEXT,
  p_channel TEXT  DEFAULT 'elite-esports-default',
  p_data    JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ncm_notifications
    (target_user_id, title, body, channel_id, data, status)
  VALUES
    (p_user_id, p_title, p_body, p_channel, p_data, 'pending');

  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (p_user_id, p_title, p_body, COALESCE(p_data->>'type', 'general'), false);
END;
$$;

REVOKE ALL ON FUNCTION public.notify_user(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_user(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;


-- broadcast_notification helper (admin)
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_title   TEXT,
  p_body    TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_row   RECORD;
  v_count INT  := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  IF p_user_id IS NOT NULL THEN
    PERFORM public.notify_user(p_user_id, p_title, p_body, 'elite-esports-default',
      jsonb_build_object('type','broadcast'));
    v_count := 1;
  ELSE
    FOR v_row IN
      SELECT DISTINCT user_id FROM public.device_registrations WHERE is_active = true
    LOOP
      PERFORM public.notify_user(v_row.user_id, p_title, p_body, 'elite-esports-default',
        jsonb_build_object('type','broadcast'));
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'sent_to', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.broadcast_notification(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(TEXT, TEXT, UUID) TO authenticated;


-- Trigger 1: match joined
CREATE OR REPLACE FUNCTION public.trg_ncm_match_joined()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title TEXT;
BEGIN
  SELECT COALESCE(title, 'a match') INTO v_title FROM public.matches WHERE id = NEW.match_id;
  PERFORM public.notify_user(NEW.user_id, '✅ You''re In!',
    'Successfully joined ' || v_title || '. Get ready to compete!',
    'elite-esports-match',
    jsonb_build_object('type','match_joined','match_id', NEW.match_id));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_match_joined ON public.match_participants;
CREATE TRIGGER ncm_match_joined
  AFTER INSERT ON public.match_participants
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_match_joined();


-- Trigger 2: wallet credited (prize / referral / ad / refund)
CREATE OR REPLACE FUNCTION public.trg_ncm_wallet_credited()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.type = 'credit' THEN
    IF NEW.reference_id LIKE 'result:%' THEN
      PERFORM public.notify_user(NEW.user_id, '🏆 Prize Credited!',
        '₹' || NEW.amount || ' has been added to your wallet. Well played!',
        'elite-esports-reward',
        jsonb_build_object('type','prize_credited','amount', NEW.amount));
    ELSIF NEW.reference_id LIKE 'autopay:%' THEN
      PERFORM public.notify_user(NEW.user_id, '🏆 Prize Distributed!',
        '₹' || NEW.amount || ' auto-prize added to your wallet!',
        'elite-esports-reward',
        jsonb_build_object('type','prize_credited','amount', NEW.amount));
    ELSIF NEW.reference_id LIKE 'referral:%' THEN
      PERFORM public.notify_user(NEW.user_id, '🎁 Referral Bonus!',
        '₹' || NEW.amount || ' referral reward added to your wallet.',
        'elite-esports-reward',
        jsonb_build_object('type','referral_bonus','amount', NEW.amount));
    ELSIF NEW.reference_id LIKE 'ad_bonus:%' THEN
      PERFORM public.notify_user(NEW.user_id, '📺 Ad Bonus Earned!',
        '₹' || NEW.amount || ' bonus added for watching an ad.',
        'elite-esports-reward',
        jsonb_build_object('type','ad_bonus','amount', NEW.amount));
    ELSIF NEW.reference_id LIKE 'refund:%' THEN
      PERFORM public.notify_user(NEW.user_id, '↩️ Entry Fee Refunded',
        '₹' || NEW.amount || ' has been refunded to your wallet.',
        'elite-esports-account',
        jsonb_build_object('type','refund','amount', NEW.amount));
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_wallet_credited ON public.wallet_transactions;
CREATE TRIGGER ncm_wallet_credited
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_wallet_credited();


-- Trigger 3: deposit received (pending)
CREATE OR REPLACE FUNCTION public.trg_ncm_payment_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_user(NEW.user_id, '⏳ Deposit Received',
    'Your deposit of ₹' || NEW.amount || ' is under review. We''ll notify you once approved.',
    'elite-esports-account',
    jsonb_build_object('type','deposit_pending','amount', NEW.amount));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_payment_received ON public.payments;
CREATE TRIGGER ncm_payment_received
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_payment_received();


-- Trigger 4: deposit approved/rejected
CREATE OR REPLACE FUNCTION public.trg_ncm_payment_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.notify_user(NEW.user_id, '✅ Deposit Approved!',
      '₹' || NEW.amount || ' has been credited to your wallet.',
      'elite-esports-account',
      jsonb_build_object('type','deposit_approved','amount', NEW.amount));
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.notify_user(NEW.user_id, '❌ Deposit Rejected',
      'Your deposit of ₹' || NEW.amount || ' could not be processed. Contact support.',
      'elite-esports-account',
      jsonb_build_object('type','deposit_rejected','amount', NEW.amount));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_payment_status ON public.payments;
CREATE TRIGGER ncm_payment_status
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_payment_status();


-- Trigger 5: withdrawal requested
CREATE OR REPLACE FUNCTION public.trg_ncm_withdrawal_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_user(NEW.user_id, '⏳ Withdrawal Requested',
    'Your withdrawal of ₹' || NEW.amount || ' is being processed. Allow 1-3 business days.',
    'elite-esports-account',
    jsonb_build_object('type','withdrawal_pending','amount', NEW.amount));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_withdrawal_received ON public.withdrawals;
CREATE TRIGGER ncm_withdrawal_received
  AFTER INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_withdrawal_received();


-- Trigger 6: withdrawal approved/rejected
CREATE OR REPLACE FUNCTION public.trg_ncm_withdrawal_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.notify_user(NEW.user_id, '💸 Withdrawal Processed!',
      '₹' || NEW.amount || ' is on its way to your account. Allow 1-3 business days.',
      'elite-esports-account',
      jsonb_build_object('type','withdrawal_approved','amount', NEW.amount));
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.notify_user(NEW.user_id, '❌ Withdrawal Rejected',
      '₹' || NEW.amount || ' could not be withdrawn. Amount refunded to your wallet.',
      'elite-esports-account',
      jsonb_build_object('type','withdrawal_rejected','amount', NEW.amount));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_withdrawal_status ON public.withdrawals;
CREATE TRIGGER ncm_withdrawal_status
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_withdrawal_status();


-- Trigger 7: match result published
CREATE OR REPLACE FUNCTION public.trg_ncm_match_result()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title TEXT;
  v_prize NUMERIC;
BEGIN
  SELECT COALESCE(title, 'your match') INTO v_title FROM public.matches WHERE id = NEW.match_id;
  v_prize := COALESCE(NEW.prize_amount, 0);
  IF v_prize > 0 THEN
    PERFORM public.notify_user(NEW.user_id, '🏆 You Won! Rank #' || NEW.rank,
      v_title || ' ended. You finished #' || NEW.rank || ' and won ₹' || v_prize || '!',
      'elite-esports-reward',
      jsonb_build_object('type','match_result','match_id', NEW.match_id,'rank', NEW.rank,'prize', v_prize));
  ELSE
    PERFORM public.notify_user(NEW.user_id, '📊 Match Result: #' || NEW.rank,
      v_title || ' has ended. You finished in position #' || NEW.rank || '. Better luck next time!',
      'elite-esports-match',
      jsonb_build_object('type','match_result','match_id', NEW.match_id,'rank', NEW.rank,'prize', 0));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_match_result ON public.match_results;
CREATE TRIGGER ncm_match_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_match_result();


-- Trigger 8: match goes live / cancelled → notify all participants
CREATE OR REPLACE FUNCTION public.trg_ncm_match_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_participant RECORD;
BEGIN
  IF NEW.status = 'ongoing' AND OLD.status <> 'ongoing' THEN
    FOR v_participant IN SELECT user_id FROM public.match_participants WHERE match_id = NEW.id LOOP
      PERFORM public.notify_user(v_participant.user_id, '🎮 Match is LIVE!',
        NEW.title || ' has started! Open the app and join the room now.',
        'elite-esports-match',
        jsonb_build_object('type','match_live','match_id', NEW.id));
    END LOOP;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    FOR v_participant IN SELECT user_id FROM public.match_participants WHERE match_id = NEW.id LOOP
      PERFORM public.notify_user(v_participant.user_id, '⚠️ Match Cancelled',
        NEW.title || ' has been cancelled. Your entry fee has been refunded.',
        'elite-esports-account',
        jsonb_build_object('type','match_cancelled','match_id', NEW.id));
    END LOOP;
  END IF;

  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS ncm_match_status_change ON public.matches;
CREATE TRIGGER ncm_match_status_change
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_match_status_change();


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 12 · REALTIME — enable all live-subscribed tables
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
    'ncm_notifications',
    'device_registrations',
    'sponsorship_applications',
    'sponsored_posts',
    'app_settings',
    'match_prize_splits'
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
-- PART 13 · STORAGE BUCKET — game banner images
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
-- PART 14 · SEED DATA (all idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.app_settings (id, min_deposit, max_deposit, min_withdraw, max_withdraw, upi_id)
  SELECT gen_random_uuid(), 10, 50000, 50, 50000, 'elite@upi'
  WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

INSERT INTO public.points_settings (
  id, kill_points, rank_1_points, rank_2_points, rank_3_points,
  rank_4_points, rank_5_points, rank_6_to_10_points
)
  SELECT gen_random_uuid(), 1, 50, 35, 25, 20, 15, 10
  WHERE NOT EXISTS (SELECT 1 FROM public.points_settings);

INSERT INTO public.ad_settings (id, ads_enabled, default_cooldown)
  SELECT gen_random_uuid(), false, 60
  WHERE NOT EXISTS (SELECT 1 FROM public.ad_settings);

INSERT INTO public.match_modes (name, sort_order) VALUES
  ('Full Map',      1), ('TDM',           2), ('PVP',           3),
  ('Battle Royale', 4), ('Clash Squad',   5), ('Ranked',        6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.squad_types (name, sort_order) VALUES
  ('Solo', 1), ('Duo', 2), ('3v3', 3), ('4v4', 4), ('Squad', 5)
ON CONFLICT (name) DO NOTHING;


-- =============================================================================
-- SETUP COMPLETE
--
-- TO GRANT ADMIN ACCESS to a user:
--   INSERT INTO public.admin_users (user_id) VALUES ('<auth-user-uuid-here>');
--
-- TO SET YOUR UPI ID:
--   UPDATE public.app_settings SET upi_id = 'yourname@bank';
--   -- OR via RPC: SELECT update_app_settings(p_upi_id => 'yourname@bank');
-- =============================================================================
