-- SMS reminder rules for scheduled statutory alerts
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

CREATE POLICY "Users can view own sms reminder rules"
    ON sms_reminder_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sms reminder rules"
    ON sms_reminder_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sms reminder rules"
    ON sms_reminder_rules FOR UPDATE
    USING (auth.uid() = user_id);

-- Ensure notifications table can support unread state used in UI and reminder logs
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
