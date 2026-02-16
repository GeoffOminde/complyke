import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [contractsRes, policiesRes, payrollRes, paymentsRes] = await Promise.all([
      supabase
        .from('contracts')
        .select('id,employee_name,job_title,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('privacy_policies')
        .select('id,company_name,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('payroll_calculations')
        .select('id,gross_salary,net_pay,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('payments')
        .select('id,amount,plan,status,mpesa_receipt,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ])

    const errors = [contractsRes.error, policiesRes.error, payrollRes.error, paymentsRes.error].filter(Boolean)
    if (errors.length > 0) {
      throw new Error(errors[0]?.message || 'Failed to fetch archive')
    }

    return NextResponse.json({
      success: true,
      contracts: contractsRes.data || [],
      policies: policiesRes.data || [],
      payroll: payrollRes.data || [],
      payments: paymentsRes.data || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load archive'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
