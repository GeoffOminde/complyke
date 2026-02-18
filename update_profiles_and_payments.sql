-- Add logo_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add INSERT policy for payments table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payments' AND policyname = 'Users can insert own payments'
    ) THEN
        CREATE POLICY "Users can insert own payments" 
        ON payments FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
