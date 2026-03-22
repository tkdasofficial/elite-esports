-- ============================================================
-- 11_categories_tags.sql
-- Match categories and tags for filtering/search
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  icon        TEXT DEFAULT '',
  color       TEXT DEFAULT '#FF4500',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.categories (name, icon, color) VALUES
  ('Battle Royale', '🔫', '#FF4500'),
  ('FPS',           '🎯', '#3B82F6'),
  ('Strategy',      '♟️', '#8B5CF6'),
  ('Sports',        '⚽', '#22C55E'),
  ('MOBA',          '⚔️', '#F59E0B')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  color       TEXT DEFAULT '#8E8E93',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.tags (name, color) VALUES
  ('Hot',       '#FF4500'),
  ('New',       '#22C55E'),
  ('Featured',  '#FFD60A'),
  ('Limited',   '#8B5CF6'),
  ('Free',      '#3B82F6')
ON CONFLICT DO NOTHING;

-- Many-to-many: matches ↔ tags
CREATE TABLE IF NOT EXISTS public.match_tags (
  match_id  UUID NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (match_id, tag_id)
);
