-- ============================================================
-- 06_transactions.sql
-- Wallet transactions table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'win', 'entry')),
  amount      INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'rejected')),
  method      TEXT CHECK (method IN ('upi', 'giftcard', NULL)),
  title       TEXT DEFAULT '',
  details     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user   ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type   ON public.transactions(type);

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update user coin balance when a transaction is marked success
CREATE OR REPLACE FUNCTION sync_coin_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    UPDATE public.profiles
    SET coins = GREATEST(0,
      coins + CASE
        WHEN NEW.type IN ('deposit', 'win') THEN NEW.amount
        WHEN NEW.type IN ('withdrawal', 'entry') THEN -NEW.amount
        ELSE 0
      END
    )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_success
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION sync_coin_balance();
