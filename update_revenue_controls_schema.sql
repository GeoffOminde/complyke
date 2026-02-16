-- Revenue controls hardening for ComplyKe
-- Run in Supabase SQL Editor.

-- 1) Extend payments table for callback-driven reconciliation.
ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS checkout_request_id TEXT,
  ADD COLUMN IF NOT EXISTS merchant_request_id TEXT,
  ADD COLUMN IF NOT EXISTS result_code INTEGER,
  ADD COLUMN IF NOT EXISTS result_desc TEXT,
  ADD COLUMN IF NOT EXISTS transaction_date TEXT,
  ADD COLUMN IF NOT EXISTS raw_callback JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_payments_checkout_request_id ON payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_request_id ON payments(merchant_request_id);

-- 2) Persist pay-per-use balances.
CREATE TABLE IF NOT EXISTS feature_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, feature),
  CHECK (credit_balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_feature_credits_user_feature ON feature_credits(user_id, feature);

ALTER TABLE IF EXISTS feature_credits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'feature_credits' AND policyname = 'Users can view own feature credits'
  ) THEN
    CREATE POLICY "Users can view own feature credits"
      ON feature_credits FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

