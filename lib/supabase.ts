import { createBrowserClient } from '@supabase/ssr'

// Fail loudly at startup if Supabase env vars are missing.
// NEVER fall back to a hardcoded URL or JWT — even a "placeholder" one.
// Hardcoded credentials are scraped from repos and mask misconfiguration.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
    id: string
    role: string | null
    full_name: string | null
    business_name: string | null
    kra_pin: string | null
    industry: string | null
    num_employees: number | null
    phone: string | null
    location: string | null
    subscription_plan: string
    subscription_status: string
    subscription_end_date: string | null
    created_at: string
    updated_at: string
}

export interface Contract {
    id: string
    user_id: string
    employee_name: string
    employee_id: string
    job_title: string
    gross_salary: number
    start_date: string
    contract_content: string
    created_at: string
}

export interface PayrollCalculation {
    id: string
    user_id: string
    gross_salary: number
    housing_levy: number
    shif: number
    nssf: number
    paye: number
    net_pay: number
    created_at: string
}

export interface PrivacyPolicy {
    id: string
    user_id: string
    company_name: string
    collects_phone: boolean
    uses_cctv: boolean
    policy_content: string
    created_at: string
}

export interface Payment {
    id: string
    user_id: string
    amount: number
    plan: string
    mpesa_receipt: string | null
    phone_number: string | null
    status: string
    created_at: string
}
