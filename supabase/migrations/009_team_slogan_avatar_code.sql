-- Migration 009: Add slogan, avatar, code fields to teams table
-- Add captain kick (revoke) policy to team_members
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- 1. Add new columns to teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS slogan TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar TEXT    NOT NULL DEFAULT '🎮',
  ADD COLUMN IF NOT EXISTS code   TEXT    UNIQUE;

-- 2. Back-fill code for any existing teams using MD5 of their id
UPDATE public.teams
  SET code = UPPER(SUBSTRING(MD5(id::text), 1, 8))
  WHERE code IS NULL;

-- 3. Now make code NOT NULL
ALTER TABLE public.teams
  ALTER COLUMN code SET NOT NULL;

-- 4. Drop old single-delete policy and recreate to allow captain to kick members
DROP POLICY IF EXISTS "tm_delete_own"     ON public.team_members;
DROP POLICY IF EXISTS "tm_delete_captain" ON public.team_members;

CREATE POLICY "tm_delete_captain" ON public.team_members
  FOR DELETE USING (
    -- own membership (leave) OR captain of the same team (revoke)
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'captain'
    )
  );

-- 5. Allow captain to update team info (name, slogan, avatar)
DROP POLICY IF EXISTS "teams_update" ON public.teams;
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
