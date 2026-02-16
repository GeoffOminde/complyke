import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan,subscription_status,subscription_end_date')
      .eq('id', user.id)
      .maybeSingle()

    const { data: creditsRows } = await supabase
      .from('feature_credits')
      .select('feature,credit_balance')
      .eq('user_id', user.id)

    const credits = {
      payroll: 0,
      scan: 0,
      contract: 0,
      privacy: 0,
    }
    for (const row of creditsRows || []) {
      const feature = String((row as { feature?: string }).feature || '').toLowerCase()
      const balance = Number((row as { credit_balance?: number }).credit_balance || 0)
      if (feature === 'payroll' || feature === 'scan' || feature === 'contract' || feature === 'privacy') {
        credits[feature] = Math.max(0, balance)
      }
    }

    const { data: payments } = await supabase
      .from('payments')
      .select('id,amount,plan,status,mpesa_receipt,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      profile: {
        subscription_plan: profile?.subscription_plan || null,
        subscription_status: profile?.subscription_status || null,
        subscription_end_date: profile?.subscription_end_date || null,
      },
      credits,
      payments: payments || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load billing summary'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
