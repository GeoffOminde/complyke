-- 1. PROFILES TABLE: Stores business-specific information
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    kra_pin TEXT,
    industry TEXT,
    num_employees INTEGER,
    phone TEXT,
    location TEXT,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    preferred_language TEXT DEFAULT 'English (Business)',
    preferred_currency TEXT DEFAULT 'KES (Kenyan Shillings)',
    subscription_plan TEXT DEFAULT 'free_trial',
    subscription_status TEXT DEFAULT 'active',
    subscription_end_date TIMESTAMPTZ,
    role TEXT DEFAULT 'user',
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONTRACTS TABLE: Stores generated employment contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    employee_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    gross_salary DECIMAL NOT NULL,
    start_date DATE NOT NULL,
    contract_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PAYROLL_CALCULATIONS TABLE: History of payroll runs
CREATE TABLE payroll_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gross_salary DECIMAL NOT NULL,
    housing_levy DECIMAL NOT NULL,
    shif DECIMAL NOT NULL,
    nssf DECIMAL NOT NULL,
    paye DECIMAL NOT NULL,
    net_pay DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRIVACY_POLICIES TABLE: Stores generated policies
CREATE TABLE privacy_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    collects_phone BOOLEAN DEFAULT TRUE,
    uses_cctv BOOLEAN DEFAULT FALSE,
    policy_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENTS TABLE: M-Pesa transaction history
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL NOT NULL,
    plan TEXT NOT NULL,
    mpesa_receipt TEXT,
    phone_number TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES: Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own contracts" ON contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON contracts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payroll" ON payroll_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payroll" ON payroll_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own policies" ON privacy_policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own policies" ON privacy_policies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
