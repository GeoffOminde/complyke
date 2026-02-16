-- Enterprise service support for premium governance tiers
-- Run in Supabase SQL editor.

-- 1) Extend profiles with enterprise service fields
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS vault_subnet_id TEXT,
  ADD COLUMN IF NOT EXISTS compliance_officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS white_label_brand TEXT,
  ADD COLUMN IF NOT EXISTS multi_entity_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enterprise_service_notes TEXT;

-- 2) Track service requests for auditability
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

CREATE POLICY IF NOT EXISTS "Users can manage own enterprise service requests"
  ON enterprise_service_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_service_requests_user_service
  ON enterprise_service_requests(user_id, service);
