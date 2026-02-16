import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { CreditFeature } from '@/lib/entitlements'
import { auditLog } from '@/lib/audit-log'

const SUPPORTED_FEATURES: CreditFeature[] = ['payroll', 'scan', 'contract', 'privacy']

function emptyCreditMap() {
  return {
    payroll: 0,
    scan: 0,
    contract: 0,
    privacy: 0,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authData.user.id

    const { data, error: fetchError } = await supabase
      .from('feature_credits')
      .select('feature, credit_balance')
      .eq('user_id', userId)

    if (fetchError) {
      // Handle missing table gracefully
      if (fetchError.code === '42P01') {
        return NextResponse.json({
          credits: emptyCreditMap(),
          schemaReady: false,
          warning: 'feature_credits table missing. Run migration.',
        })
      }
      console.error('[Credits API Error]:', fetchError)
      throw fetchError
    }

    const credits = emptyCreditMap()
    if (data) {
      for (const row of data) {
        const feature = (row.feature || '').toLowerCase() as CreditFeature
        if (SUPPORTED_FEATURES.includes(feature)) {
          credits[feature] = Math.max(0, Number(row.credit_balance || 0))
        }
      }
    }

    return NextResponse.json({ credits, schemaReady: true })
  } catch (error: unknown) {
    console.error('[Credits API Fatal Error]:', error)
    const message = error instanceof Error ? error.message : 'Failed to load credits'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as { action?: string; feature?: string; quantity?: number }
    if (body.action !== 'consume') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const feature = String(body.feature || '').toLowerCase() as CreditFeature
    const quantity = Number(body.quantity || 1)
    if (!SUPPORTED_FEATURES.includes(feature) || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid feature or quantity' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: row, error: readError } = await admin
      .from('feature_credits')
      .select('id,credit_balance')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .maybeSingle()

    if (readError) {
      return NextResponse.json(
        { error: 'Credits schema not ready. Run update_revenue_controls_schema.sql.' },
        { status: 500 }
      )
    }

    const balance = Number(row?.credit_balance || 0)
    if (balance < quantity) {
      await auditLog({
        event: 'credit.consume_underflow_attempt',
        level: 'warn',
        actorUserId: user.id,
        metadata: { feature, quantity, balance },
      })
      return NextResponse.json({ error: 'Insufficient credits', creditsRemaining: balance }, { status: 402 })
    }

    const nextBalance = balance - quantity
    const { error: updateError } = await admin
      .from('feature_credits')
      .update({ credit_balance: nextBalance, updated_at: new Date().toISOString() })
      .eq('id', row!.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to consume credits' }, { status: 500 })
    }

    await auditLog({
      event: 'credit.consumed',
      actorUserId: user.id,
      metadata: { feature, quantity, nextBalance },
    })

    return NextResponse.json({ success: true, feature, creditsRemaining: nextBalance })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to consume credits'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
