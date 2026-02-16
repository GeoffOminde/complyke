-- Notification settings used by /api/notifications/settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email_housing_reminders BOOLEAN DEFAULT TRUE NOT NULL,
    email_casual_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    email_tax_updates BOOLEAN DEFAULT TRUE NOT NULL,
    sms_payment_confirmations BOOLEAN DEFAULT FALSE NOT NULL,
    frequency TEXT DEFAULT 'realtime' NOT NULL
        CHECK (frequency IN ('realtime', 'daily', 'weekly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
    ON notification_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
    ON notification_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
    ON notification_settings FOR UPDATE
    USING (auth.uid() = user_id);

