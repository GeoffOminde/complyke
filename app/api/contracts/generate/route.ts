import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { generateEmploymentContract } from '@/lib/contract-generator'
import { canAccessFeature } from '@/lib/entitlements'

interface ContractGenerateRequest {
  companyName: string
  employeeName: string
  idNumber: string
  jobTitle: string
  grossSalary: number
  startDate: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as ContractGenerateRequest
    const salary = Number(body.grossSalary)
    if (!body.companyName || !body.employeeName || !body.idNumber || !body.jobTitle || !body.startDate || Number.isNaN(salary) || salary <= 0) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_end_date, role')
      .eq('id', user.id)
      .maybeSingle()

    const isSuperAdmin = profile?.role === 'super-admin'
    const hasPlanAccess = isSuperAdmin || canAccessFeature(profile?.subscription_plan || null, 'contracts', profile?.subscription_end_date)
    if (!hasPlanAccess) {
      const admin = createAdminClient()
      const creditRow = await admin
        .from('feature_credits')
        .select('id,credit_balance')
        .eq('user_id', user.id)
        .eq('feature', 'contract')
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
          { error: 'Tier Restricted: Contract Generator requires Micro-Entity+ plan or Contract credit.' },
          { status: 402 }
        )
      }
    }

    const contract = generateEmploymentContract({
      employeeName: body.employeeName,
      idNumber: body.idNumber,
      jobTitle: body.jobTitle,
      grossSalary: salary,
      startDate: body.startDate,
      employerName: body.companyName,
    })

    const { data: inserted, error: insertError } = await supabase
      .from('contracts')
      .insert([
        {
          user_id: user.id,
          employee_name: body.employeeName,
          employee_id: body.idNumber,
          job_title: body.jobTitle,
          gross_salary: salary,
          start_date: body.startDate,
          contract_content: contract,
        },
      ])
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contract,
      contractId: inserted?.id || null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate contract'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

