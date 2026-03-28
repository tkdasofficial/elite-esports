-- ─────────────────────────────────────────────────────────────────────────────
-- Elite eSports — Full Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run all
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. PROFILES TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_index INTEGER DEFAULT 0,
  games JSONB DEFAULT '[]'::jsonb,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Public profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 2. GAMES CATALOG ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Games viewable by everyone" ON public.games;
  DROP POLICY IF EXISTS "Admins can manage games" ON public.games;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Games viewable by everyone" ON public.games FOR SELECT USING (true);
CREATE POLICY "Admins can manage games" ON public.games FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 3. MATCHES TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  banner_url TEXT,
  entry_fee NUMERIC(12,2) DEFAULT 0,
  prize_pool NUMERIC(12,2) DEFAULT 0,
  players_joined INTEGER DEFAULT 0,
  max_players INTEGER DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  starts_at TIMESTAMP WITH TIME ZONE,
  room_id TEXT,
  room_password TEXT,
  description TEXT,
  stream_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Matches viewable by everyone" ON public.matches;
  DROP POLICY IF EXISTS "Admins manage matches" ON public.matches;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Matches viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admins manage matches" ON public.matches FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 4. TRANSACTIONS (DEPOSITS) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount NUMERIC(12,2) NOT NULL,
  utr TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users see own transactions" ON public.transactions;
  DROP POLICY IF EXISTS "Users create transactions" ON public.transactions;
  DROP POLICY IF EXISTS "Admins manage transactions" ON public.transactions;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Users see own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage transactions" ON public.transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 5. WITHDRAWALS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users see own withdrawals" ON public.withdrawals;
  DROP POLICY IF EXISTS "Users create withdrawals" ON public.withdrawals;
  DROP POLICY IF EXISTS "Admins manage withdrawals" ON public.withdrawals;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Users see own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage withdrawals" ON public.withdrawals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 6. SUPPORT TICKETS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users see own tickets" ON public.support_tickets;
  DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
  DROP POLICY IF EXISTS "Admins manage tickets" ON public.support_tickets;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Users see own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 7. REPORTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users see own reports" ON public.reports;
  DROP POLICY IF EXISTS "Users create reports" ON public.reports;
  DROP POLICY IF EXISTS "Admins manage reports" ON public.reports;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Users see own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reports" ON public.reports FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 8. BROADCASTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Everyone reads broadcasts" ON public.broadcasts;
  DROP POLICY IF EXISTS "Admins send broadcasts" ON public.broadcasts;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Everyone reads broadcasts" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "Admins send broadcasts" ON public.broadcasts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 9. MONETIZATION ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('interstitial','rewarded','app_open')),
  unit_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.ad_units ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage ad units" ON public.ad_units;
EXCEPTION WHEN others THEN NULL; END $$;
CREATE POLICY "Admins manage ad units" ON public.ad_units FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TABLE IF NOT EXISTS public.ad_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('join_match','leave_match','app_open','reward_claim')),
  ad_unit_id UUID REFERENCES public.ad_units(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE public.ad_triggers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage ad triggers" ON public.ad_triggers;
EXCEPTION WHEN others THEN NULL; END $$;
CREATE POLICY "Admins manage ad triggers" ON public.ad_triggers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TABLE IF NOT EXISTS public.ad_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  ads_enabled BOOLEAN NOT NULL DEFAULT true,
  default_cooldown INTEGER NOT NULL DEFAULT 60
);
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage ad settings" ON public.ad_settings;
EXCEPTION WHEN others THEN NULL; END $$;
CREATE POLICY "Admins manage ad settings" ON public.ad_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

INSERT INTO public.ad_settings (id, ads_enabled, default_cooldown)
  VALUES (1, true, 60) ON CONFLICT (id) DO NOTHING;

-- ─── 10. STORAGE BUCKET FOR GAME BANNERS ─────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('game-banners', 'game-banners', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Game banners public read" ON storage.objects;
  DROP POLICY IF EXISTS "Admins upload banners" ON storage.objects;
  DROP POLICY IF EXISTS "Admins delete banners" ON storage.objects;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Game banners public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-banners');
CREATE POLICY "Admins upload banners" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins delete banners" ON storage.objects
  FOR DELETE USING (bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── 11. SEED ADMIN ACCOUNT ──────────────────────────────────────────────────
-- This upserts the admin profile for avzio@outlook.com
INSERT INTO public.profiles (id, full_name, username, is_admin)
  VALUES (
    '6771dad2-8719-48c0-8907-3bb6da336835',
    'Admin',
    'admin',
    true
  )
  ON CONFLICT (id) DO UPDATE SET is_admin = true;
