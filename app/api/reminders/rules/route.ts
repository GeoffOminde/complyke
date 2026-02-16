import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const allowedTypes = ['housing_levy', 'shif', 'nssf'] as const
type ReminderType = typeof allowedTypes[number]

interface ReminderRuleRow {
  user_id: string
  enabled: boolean
  phone_override: string | null
  days_before: number
  reminder_types: ReminderType[]
}

function normalizeTypes(types: unknown): ReminderType[] {
  if (!Array.isArray(types)) return ['housing_levy', 'shif', 'nssf']
  const filtered = types.filter((t): t is ReminderType => typeof t === 'string' && allowedTypes.includes(t as ReminderType))
  return filtered.length > 0 ? filtered : ['housing_levy', 'shif', 'nssf']
}

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

    const { data, error } = await supabase
      .from('sms_reminder_rules')
      .select('user_id,enabled,phone_override,days_before,reminder_types')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return NextResponse.json({
        enabled: false,
        phoneOverride: null,
        daysBefore: 3,
        reminderTypes: ['housing_levy', 'shif', 'nssf'],
      })
    }

    const row = data as ReminderRuleRow
    return NextResponse.json({
      enabled: row.enabled,
      phoneOverride: row.phone_override,
      daysBefore: row.days_before,
      reminderTypes: normalizeTypes(row.reminder_types),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load reminder rules'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      enabled?: boolean
      phoneOverride?: string | null
      daysBefore?: number
      reminderTypes?: unknown
    }

    const enabled = !!body.enabled
    const phoneOverride = body.phoneOverride?.trim() || null
    const daysBefore = typeof body.daysBefore === 'number' ? body.daysBefore : 3
    const reminderTypes = normalizeTypes(body.reminderTypes)

    if (daysBefore < 0 || daysBefore > 14) {
      return NextResponse.json({ error: 'daysBefore must be between 0 and 14' }, { status: 400 })
    }

    const payload = {
      user_id: user.id,
      enabled,
      phone_override: phoneOverride,
      days_before: daysBefore,
      reminder_types: reminderTypes,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('sms_reminder_rules')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({
      success: true,
      enabled,
      phoneOverride,
      daysBefore,
      reminderTypes,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save reminder rules'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
