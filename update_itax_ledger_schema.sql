-- iTax/eTIMS ledger queue backing table
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
    status TEXT DEFAULT 'queued' NOT NULL
        CHECK (status IN ('queued', 'submitted', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itax_ledger_user_created_at
    ON itax_ledger_entries(user_id, created_at DESC);

ALTER TABLE itax_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own iTax ledger entries"
    ON itax_ledger_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own iTax ledger entries"
    ON itax_ledger_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);
