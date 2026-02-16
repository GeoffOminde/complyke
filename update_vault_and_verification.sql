-- ==========================================
-- COMPLYKE INSTITUTIONAL SCHEMA UPDATE
-- DATE: 2026-02-15
-- ==========================================

-- 1. Add institutional verification fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS kra_pin_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS compliance_score INTEGER DEFAULT 0;

-- 2. Document Vault Table
-- This table tracks the actual files stored in Supabase Storage
CREATE TABLE IF NOT EXISTS document_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL, -- 'contract', 'policy', 'payroll', 'receipt'
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    audit_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS for document_vault
ALTER TABLE document_vault ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_vault' AND policyname = 'Users can view own vaulted documents'
    ) THEN
        CREATE POLICY "Users can view own vaulted documents" 
        ON document_vault FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_vault' AND policyname = 'Users can insert own vaulted documents'
    ) THEN
        CREATE POLICY "Users can insert own vaulted documents" 
        ON document_vault FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_document_vault_user_type ON document_vault(user_id, document_type);

-- 6. RPC function for Super Admin assignment (Optional helper)
-- You can run: SELECT assign_super_admin('USER_UUID_HERE');
CREATE OR REPLACE FUNCTION assign_super_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles SET role = 'super-admin' WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
