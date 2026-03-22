-- ============================================================
-- 14_admin_access.sql
-- Full Admin Superaccess Policies
-- Grants admins unrestricted read/write power over all tables,
-- plus helper functions for user status management.
-- Run AFTER 12_rls_policies.sql
-- ============================================================

-- ── PROFILES: Admin can update ANY user's profile ────────────
-- (existing profiles_select_all already allows reading all rows)
CREATE POLICY "profiles_admin_update_any"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── PROFILES: Admin can insert profiles (for manual creation) ─
CREATE POLICY "profiles_admin_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── PROFILES: Admin can delete any profile ────────────────────
CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── TRANSACTIONS: Admin can see ALL transactions ──────────────
CREATE POLICY "transactions_admin_select"
  ON public.transactions FOR SELECT
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── TRANSACTIONS: Admin can insert transactions for any user ──
CREATE POLICY "transactions_admin_insert"
  ON public.transactions FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── TRANSACTIONS: Admin can delete any transaction ────────────
CREATE POLICY "transactions_admin_delete"
  ON public.transactions FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── GAME PROFILES: Admin can read all game profiles ──────────
CREATE POLICY "game_profiles_admin_select"
  ON public.game_profiles FOR SELECT
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── GAME PROFILES: Admin can update/delete any game profile ──
CREATE POLICY "game_profiles_admin_update"
  ON public.game_profiles FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "game_profiles_admin_delete"
  ON public.game_profiles FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── MATCH PARTICIPANTS: Admin can update/delete any row ───────
CREATE POLICY "participants_admin_update"
  ON public.match_participants FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "participants_admin_delete"
  ON public.match_participants FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── TEAM MEMBERS: Admin can manage all memberships ───────────
CREATE POLICY "team_members_admin_all"
  ON public.team_members FOR ALL
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── TEAMS: Admin can delete any team ─────────────────────────
CREATE POLICY "teams_admin_delete"
  ON public.teams FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── NOTIFICATIONS: Admin can insert for any user ─────────────
CREATE POLICY "notifications_admin_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── NOTIFICATIONS: Admin can delete any notification ─────────
CREATE POLICY "notifications_admin_delete"
  ON public.notifications FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ── USER STATUS COLUMN ────────────────────────────────────────
-- Add status column to profiles if not already present.
-- Values: 'active' | 'suspended' | 'banned'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'banned'));

-- Index for fast status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_account_status
  ON public.profiles (account_status);

-- ── FUNCTION: Admin set user status ──────────────────────────
-- Call: SELECT admin_set_user_status('<user_uuid>', 'suspended');
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  target_user_id UUID,
  new_status      TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins may call this
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  IF new_status NOT IN ('active', 'suspended', 'banned') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  UPDATE public.profiles
    SET account_status = new_status
  WHERE id = target_user_id;
END;
$$;

-- ── FUNCTION: Admin get user email (via auth.users) ───────────
-- Returns the email of any user. Only callable by admins.
CREATE OR REPLACE FUNCTION public.admin_get_user_email(
  target_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_email TEXT;
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT email INTO user_email
    FROM auth.users
  WHERE id = target_user_id;

  RETURN user_email;
END;
$$;

-- ── VIEW: Admin user overview ─────────────────────────────────
-- Joins profiles with auth.users to expose email to admins.
CREATE OR REPLACE VIEW public.admin_users_view AS
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.rank,
    p.coins,
    p.is_admin,
    p.account_status,
    p.created_at,
    u.email
  FROM public.profiles p
  JOIN auth.users       u ON u.id = p.id;

-- Restrict view to admins only
ALTER VIEW public.admin_users_view OWNER TO postgres;

REVOKE ALL ON public.admin_users_view FROM anon, authenticated;
GRANT  SELECT ON public.admin_users_view
  TO authenticated;   -- RLS on profiles still gates it via is_admin check

-- ── SEED: Hardcoded admin user ────────────────────────────────
-- Grants full admin privileges to avzio@outlook.com (UID: 87a33209-b121-42fc-a735-37fae84acbf4)
INSERT INTO public.profiles (id, email, username, is_admin)
VALUES (
  '87a33209-b121-42fc-a735-37fae84acbf4',
  'avzio@outlook.com',
  'avzio',
  TRUE
)
ON CONFLICT (id) DO UPDATE
  SET is_admin = TRUE,
      email    = EXCLUDED.email;

-- ── FUNCTION: Admin list all users with emails ────────────────
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id             UUID,
  username       TEXT,
  full_name      TEXT,
  email          TEXT,
  rank           TEXT,
  coins          INTEGER,
  is_admin       BOOLEAN,
  account_status TEXT,
  created_at     TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
    SELECT
      p.id,
      p.username,
      p.full_name,
      u.email,
      p.rank,
      p.coins,
      p.is_admin,
      p.account_status,
      p.created_at
    FROM public.profiles p
    JOIN auth.users       u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;
