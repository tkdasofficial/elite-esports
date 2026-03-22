-- ============================================================
-- 12_rls_policies.sql
-- Row Level Security (RLS) policies
-- Restrict data access per user role
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games             ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ────────────────────────────────────────────────
-- Anyone can read all profiles (for leaderboard, etc.)
CREATE POLICY "profiles_select_all"    ON public.profiles FOR SELECT USING (true);
-- Users can only update their own profile
CREATE POLICY "profiles_update_own"    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── MATCHES ─────────────────────────────────────────────────
-- Everyone can see matches
CREATE POLICY "matches_select_all"     ON public.matches FOR SELECT USING (true);
-- Only admins can create/update/delete matches
CREATE POLICY "matches_admin_insert"   ON public.matches FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "matches_admin_update"   ON public.matches FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "matches_admin_delete"   ON public.matches FOR DELETE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- ── MATCH PARTICIPANTS ───────────────────────────────────────
CREATE POLICY "participants_select"    ON public.match_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert"    ON public.match_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participants_delete"    ON public.match_participants FOR DELETE USING (auth.uid() = user_id);

-- ── TRANSACTIONS ─────────────────────────────────────────────
-- Users can only see their own transactions
CREATE POLICY "transactions_own"       ON public.transactions FOR SELECT USING (auth.uid() = user_id);
-- Users can create their own transactions (deposits, entries)
CREATE POLICY "transactions_insert"    ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Only admins can update transaction status
CREATE POLICY "transactions_admin_update" ON public.transactions FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- ── GAME PROFILES ────────────────────────────────────────────
-- Anyone can read game profiles (for public profile pages)
CREATE POLICY "game_profiles_select"   ON public.game_profiles FOR SELECT USING (true);
CREATE POLICY "game_profiles_insert"   ON public.game_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_profiles_update"   ON public.game_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "game_profiles_delete"   ON public.game_profiles FOR DELETE USING (auth.uid() = user_id);

-- ── TEAMS ────────────────────────────────────────────────────
CREATE POLICY "teams_select_all"       ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert"           ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "teams_update_leader"    ON public.teams FOR UPDATE USING (auth.uid() = leader_id);

-- ── TEAM MEMBERS ─────────────────────────────────────────────
CREATE POLICY "team_members_select"    ON public.team_members FOR SELECT USING (true);
CREATE POLICY "team_members_insert"    ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "team_members_delete"    ON public.team_members FOR DELETE USING (auth.uid() = user_id);

-- ── NOTIFICATIONS ────────────────────────────────────────────
-- See own + broadcast (user_id IS NULL) notifications
CREATE POLICY "notifications_own"      ON public.notifications FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "notifications_update"   ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ── PUBLIC READ TABLES ───────────────────────────────────────
CREATE POLICY "campaigns_select"       ON public.campaigns FOR SELECT USING (is_active = true);
CREATE POLICY "banners_select"         ON public.banners   FOR SELECT USING (is_active = true);
CREATE POLICY "games_select"           ON public.games     FOR SELECT USING (true);

-- Admin full-access policies for content management
CREATE POLICY "campaigns_admin"        ON public.campaigns FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "banners_admin"          ON public.banners   FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "games_admin"            ON public.games     FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "notifications_admin"    ON public.notifications FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);
