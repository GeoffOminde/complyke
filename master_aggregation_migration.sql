-- =================================================================================================
-- COMPLYKE: Master Aggregation Migration
-- Included Modules:
-- 1. Vault/Verification
-- 2. Enterprise Services
-- 3. Notifications/Settings
-- 4. Revenue Controls
-- 5. iTax Ledger
-- 6. Security Hardening
-- =================================================================================================

-- -------------------------------------------------------------------------------------------------
-- MODULE 1: VAULT & VERIFICATION
-- -------------------------------------------------------------------------------------------------

-- 1.1 Add verification fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS kra_pin_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS compliance_score INTEGER DEFAULT 0;

-- 1.2 Document Vault Table
CREATE TABLE IF NOT EXISTS document_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    audit_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Vault Security
ALTER TABLE document_vault ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_vault' AND policyname = 'Users can view own vaulted documents') THEN
        CREATE POLICY "Users can view own vaulted documents" ON document_vault FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_vault' AND policyname = 'Users can insert own vaulted documents') THEN
        CREATE POLICY "Users can insert own vaulted documents" ON document_vault FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_document_vault_user_type ON document_vault(user_id, document_type);

-- -------------------------------------------------------------------------------------------------
-- MODULE 2: ENTERPRISE SERVICES
-- -------------------------------------------------------------------------------------------------

-- 2.1 Profile Extensions
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS vault_subnet_id TEXT,
  ADD COLUMN IF NOT EXISTS compliance_officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS white_label_brand TEXT,
  ADD COLUMN IF NOT EXISTS multi_entity_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enterprise_service_notes TEXT;

-- 2.2 Service Request Tracking
CREATE TABLE IF NOT EXISTS enterprise_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS enterprise_service_requests ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_service_requests' AND policyname = 'Users can manage own enterprise service requests') THEN
        CREATE POLICY "Users can manage own enterprise service requests" ON enterprise_service_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_enterprise_service_requests_user_service ON enterprise_service_requests(user_id, service);

-- -------------------------------------------------------------------------------------------------
-- MODULE 3: NOTIFICATIONS & SETTINGS
-- -------------------------------------------------------------------------------------------------

-- 3.1 Base Notifications Table (Idempotent check)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT,
    message TEXT,
    phone_number TEXT,
    status TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure is_read exists if table already existed
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
        CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    -- Note: Update policy handled in hardening module
END $$;

-- 3.2 Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email_housing_reminders BOOLEAN DEFAULT TRUE NOT NULL,
    email_casual_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    email_tax_updates BOOLEAN DEFAULT TRUE NOT NULL,
    sms_payment_confirmations BOOLEAN DEFAULT FALSE NOT NULL,
    frequency TEXT DEFAULT 'realtime' NOT NULL CHECK (frequency IN ('realtime', 'daily', 'weekly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can view own notification settings') THEN
        CREATE POLICY "Users can view own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can insert own notification settings') THEN
        CREATE POLICY "Users can insert own notification settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can update own notification settings') THEN
        CREATE POLICY "Users can update own notification settings" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3.3 SMS Reminder Rules
CREATE TABLE IF NOT EXISTS sms_reminder_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE NOT NULL,
    phone_override TEXT,
    days_before INTEGER DEFAULT 3 NOT NULL,
    reminder_types JSONB DEFAULT '["housing_levy","shif","nssf"]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sms_reminder_rules ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_reminder_rules' AND policyname = 'Users can view own sms reminder rules') THEN
        CREATE POLICY "Users can view own sms reminder rules" ON sms_reminder_rules FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_reminder_rules' AND policyname = 'Users can insert own sms reminder rules') THEN
        CREATE POLICY "Users can insert own sms reminder rules" ON sms_reminder_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_reminder_rules' AND policyname = 'Users can update own sms reminder rules') THEN
        CREATE POLICY "Users can update own sms reminder rules" ON sms_reminder_rules FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- -------------------------------------------------------------------------------------------------
-- MODULE 4: REVENUE CONTROLS
-- -------------------------------------------------------------------------------------------------

-- 4.1 Payment Extensions
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

-- 4.2 Feature Credits
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feature_credits' AND policyname = 'Users can view own feature credits') THEN
    CREATE POLICY "Users can view own feature credits" ON feature_credits FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- -------------------------------------------------------------------------------------------------
-- MODULE 5: iTAX LEDGER
-- -------------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS itax_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    merchant_name TEXT,
    kra_pin TEXT NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    receipt_date DATE,
    category TEXT DEFAULT 'Other',
    audit_hash TEXT,
    etims_signature TEXT,
    trns_ms_no TEXT,
    invc_no TEXT,
    recept_no TEXT,
    item_list JSONB,
    status TEXT DEFAULT 'queued' NOT NULL CHECK (status IN ('queued', 'submitted', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itax_ledger_user_created_at ON itax_ledger_entries(user_id, created_at DESC);
ALTER TABLE itax_ledger_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itax_ledger_entries' AND policyname = 'Users can view own iTax ledger entries') THEN
        CREATE POLICY "Users can view own iTax ledger entries" ON itax_ledger_entries FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itax_ledger_entries' AND policyname = 'Users can insert own iTax ledger entries') THEN
        CREATE POLICY "Users can insert own iTax ledger entries" ON itax_ledger_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- -------------------------------------------------------------------------------------------------
-- MODULE 6: SECURITY HARDENING
-- -------------------------------------------------------------------------------------------------

-- 6.1 Audit Logs
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
REVOKE ALL ON TABLE audit_logs FROM anon, authenticated; -- Write-only via service role

-- 6.2 Webhook Nonces
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

-- 6.3 Policy Hardening (Idempotent Apply)
DO $$
BEGIN
  -- Notifications Update Policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_update_own') THEN
    CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Contracts Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contracts' AND policyname='contracts_delete_own') THEN
    CREATE POLICY contracts_delete_own ON contracts FOR DELETE USING (auth.uid() = user_id);
  END IF;
  
  -- Privacy Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='privacy_policies' AND policyname='privacy_policies_delete_own') THEN
    CREATE POLICY privacy_policies_delete_own ON privacy_policies FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Payroll
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payroll_calculations' AND policyname='payroll_calculations_delete_own') THEN
    CREATE POLICY payroll_calculations_delete_own ON payroll_calculations FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
