-- Run this in your Supabase Dashboard → SQL Editor → New query → paste all & run

-- ─── 1. is_admin column on profiles ───────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0;

-- ─── 2. Games catalog ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Games viewable by everyone" ON games FOR SELECT USING (true);
CREATE POLICY "Admins can manage games" ON games FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ─── 3. Transactions (deposits) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount NUMERIC(12,2) NOT NULL,
  utr TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all transactions" ON transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ─── 4. Withdrawals ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all withdrawals" ON withdrawals FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ─── 5. Support tickets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all tickets" ON support_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ─── 6. Reports ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all reports" ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ─── 7. Broadcasts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read broadcasts" ON broadcasts FOR SELECT USING (true);
CREATE POLICY "Admins can send broadcasts" ON broadcasts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ─── 8. Monetization ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('interstitial','rewarded','app_open')),
  unit_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE ad_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ad units" ON ad_units FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS ad_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('join_match','leave_match','app_open','reward_claim')),
  ad_unit_id UUID REFERENCES ad_units(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
ALTER TABLE ad_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ad triggers" ON ad_triggers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE TABLE IF NOT EXISTS ad_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  ads_enabled BOOLEAN NOT NULL DEFAULT true,
  default_cooldown INTEGER NOT NULL DEFAULT 60
);
ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ad settings" ON ad_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
INSERT INTO ad_settings (id, ads_enabled, default_cooldown) VALUES (1, true, 60) ON CONFLICT (id) DO NOTHING;

-- ─── 9. Storage bucket for game banners ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('game-banners', 'game-banners', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Game banners publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'game-banners');
CREATE POLICY "Admins upload game banners" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'game-banners' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins delete game banners" ON storage.objects FOR DELETE
  USING (bucket_id = 'game-banners' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ─── 10. Grant yourself admin ─────────────────────────────────────────────────
-- Replace 'your-user-id' with your actual user UUID from Supabase → Auth → Users
-- UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
