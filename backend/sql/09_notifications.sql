-- ============================================================
-- 09_notifications.sql
-- In-app notifications table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'match', 'wallet', 'promo', 'warning')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  icon        TEXT DEFAULT '',
  link        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NULL user_id = broadcast notification (shown to all users)
CREATE INDEX idx_notifications_user    ON public.notifications(user_id);
CREATE INDEX idx_notifications_read    ON public.notifications(is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
