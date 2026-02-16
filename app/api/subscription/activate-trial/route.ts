import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_plan: 'free_trial',
        subscription_status: 'active',
        subscription_end_date: trialEnd,
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, trialEndsAt: trialEnd })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to activate trial'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
