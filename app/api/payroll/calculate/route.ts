import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { calculatePayroll } from '@/lib/tax-calculator'
import { canAccessFeature } from '@/lib/entitlements'

interface PayrollRequest {
  grossSalary: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as PayrollRequest
    const salary = Number(body.grossSalary)
    if (Number.isNaN(salary) || salary <= 0) {
      return NextResponse.json({ error: 'Invalid salary' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_end_date, role')
      .eq('id', user.id)
      .maybeSingle()

    const isSuperAdmin = profile?.role === 'super-admin'
    const hasPlanAccess = isSuperAdmin || canAccessFeature(profile?.subscription_plan || null, 'payroll', profile?.subscription_end_date)
    if (!hasPlanAccess) {
      const admin = createAdminClient()
      const creditRow = await admin
        .from('feature_credits')
        .select('id,credit_balance')
        .eq('user_id', user.id)
        .eq('feature', 'payroll')
        .maybeSingle()

      const balance = Number(creditRow.data?.credit_balance || 0)
      if (!creditRow.error && balance > 0) {
        await admin
          .from('feature_credits')
          .update({
            credit_balance: balance - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', creditRow.data!.id)
      } else {
        return NextResponse.json(
          { error: 'Tier Restricted: Payroll requires Micro-Entity+ plan or Payroll credit.' },
          { status: 402 }
        )
      }
    }

    const breakdown = calculatePayroll(salary)

    await supabase.from('payroll_calculations').insert([
      {
        user_id: user.id,
        gross_salary: salary,
        housing_levy: breakdown.housingLevyEmployee,
        shif: breakdown.shif,
        nssf: breakdown.nssf,
        paye: breakdown.paye,
        net_pay: breakdown.netPay,
      },
    ])

    return NextResponse.json({ success: true, breakdown })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to calculate payroll'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

