import { createClient } from '@supabase/supabase-js'

// Use fallback values during build if env vars aren't set
// At runtime, the actual values from Vercel will be used
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co')
    .trim()
    .replace(/[\n\r]/g, '')
    .replace(/['"]/g, '')

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.M-JL8-RyRZpXZFZJxn1vW8RGNuJvjCHq1V1RlJxqZ0A')
    .trim()
    .replace(/[\n\r]/g, '')
    .replace(/['"]/g, '')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
