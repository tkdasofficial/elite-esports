-- =============================================================================
--  Elite eSports — Enable Realtime on Ad Tables
--  Run once in: Supabase Dashboard → SQL Editor → New query → Run
--
--  This allows the mobile app to receive live updates when the admin
--  changes ad units, triggers, or settings — without restarting the app.
-- =============================================================================

DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['ad_units', 'ad_triggers', 'ad_settings'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl
      );
      RAISE NOTICE 'Added % to supabase_realtime', tbl;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '% already in supabase_realtime — skipped', tbl;
    END;
  END LOOP;
END;
$$;

-- Ensure ad_settings has at least one row (required for the app to read it)
INSERT INTO public.ad_settings (id, ads_enabled, default_cooldown)
  SELECT 1, false, 15
  WHERE NOT EXISTS (SELECT 1 FROM public.ad_settings)
  ON CONFLICT DO NOTHING;

-- =============================================================================
-- DONE. Realtime enabled for: ad_units, ad_triggers, ad_settings
-- =============================================================================
