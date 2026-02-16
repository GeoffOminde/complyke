-- Security hardening: RLS + webhook replay guard + audit log sink
-- Run in Supabase SQL Editor.

-- ============================================================================
-- 1) Strict per-user RLS for core tables
-- ============================================================================

ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feature_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS privacy_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_calculations ENABLE ROW LEVEL SECURITY;

-- Remove broad table grants; service role bypasses RLS for admin writes.
REVOKE ALL ON TABLE payments FROM anon, authenticated;
REVOKE ALL ON TABLE feature_credits FROM anon, authenticated;
REVOKE ALL ON TABLE notifications FROM anon, authenticated;
REVOKE ALL ON TABLE contracts FROM anon, authenticated;
REVOKE ALL ON TABLE privacy_policies FROM anon, authenticated;
REVOKE ALL ON TABLE payroll_calculations FROM anon, authenticated;

-- Re-grant least privileges needed by client paths.
GRANT SELECT ON TABLE payments TO authenticated;
GRANT SELECT ON TABLE feature_credits TO authenticated;
GRANT SELECT, UPDATE ON TABLE notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE privacy_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE payroll_calculations TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments' AND policyname='payments_select_own'
  ) THEN
    CREATE POLICY payments_select_own ON payments FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feature_credits' AND policyname='feature_credits_select_own'
  ) THEN
    CREATE POLICY feature_credits_select_own ON feature_credits FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='notifications_select_own'
  ) THEN
    CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='notifications_update_own'
  ) THEN
    CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contracts' AND policyname='contracts_select_own'
  ) THEN
    CREATE POLICY contracts_select_own ON contracts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contracts' AND policyname='contracts_insert_own'
  ) THEN
    CREATE POLICY contracts_insert_own ON contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contracts' AND policyname='contracts_update_own'
  ) THEN
    CREATE POLICY contracts_update_own ON contracts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contracts' AND policyname='contracts_delete_own'
  ) THEN
    CREATE POLICY contracts_delete_own ON contracts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='privacy_policies' AND policyname='privacy_policies_select_own'
  ) THEN
    CREATE POLICY privacy_policies_select_own ON privacy_policies FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='privacy_policies' AND policyname='privacy_policies_insert_own'
  ) THEN
    CREATE POLICY privacy_policies_insert_own ON privacy_policies FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='privacy_policies' AND policyname='privacy_policies_update_own'
  ) THEN
    CREATE POLICY privacy_policies_update_own ON privacy_policies FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='privacy_policies' AND policyname='privacy_policies_delete_own'
  ) THEN
    CREATE POLICY privacy_policies_delete_own ON privacy_policies FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_calculations' AND policyname='payroll_calculations_select_own'
  ) THEN
    CREATE POLICY payroll_calculations_select_own ON payroll_calculations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_calculations' AND policyname='payroll_calculations_insert_own'
  ) THEN
    CREATE POLICY payroll_calculations_insert_own ON payroll_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_calculations' AND policyname='payroll_calculations_update_own'
  ) THEN
    CREATE POLICY payroll_calculations_update_own ON payroll_calculations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_calculations' AND policyname='payroll_calculations_delete_own'
  ) THEN
    CREATE POLICY payroll_calculations_delete_own ON payroll_calculations FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- 2) Webhook replay guard table (for nonce tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source, nonce)
);

CREATE INDEX IF NOT EXISTS idx_webhook_nonces_created_at ON webhook_nonces(created_at);

ALTER TABLE IF EXISTS webhook_nonces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE webhook_nonces FROM anon, authenticated;

-- ============================================================================
-- 3) Audit log table for structured observability
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  actor_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_created_at ON audit_logs(event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created_at ON audit_logs(actor_user_id, created_at DESC);

ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE audit_logs FROM anon, authenticated;

