import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

interface NotificationSettingsPayload {
  email_housing_reminders?: boolean
  email_casual_alerts?: boolean
  email_tax_updates?: boolean
  sms_payment_confirmations?: boolean
  frequency?: 'realtime' | 'daily' | 'weekly'
}

const defaultSettings = {
  email_housing_reminders: true,
  email_casual_alerts: true,
  email_tax_updates: true,
  sms_payment_confirmations: false,
  frequency: 'realtime' as const,
}

function formatNotificationSettingsError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to save notification settings'
  const normalized = message.toLowerCase()
  if (normalized.includes('relation') && normalized.includes('notification_settings') && normalized.includes('does not exist')) {
    return 'Notification settings table is missing. Run update_notification_settings_schema.sql in Supabase SQL Editor.'
  }
  if (normalized.includes('row-level security') || normalized.includes('policy')) {
    return 'Notification settings RLS policy denied this action. Apply update_notification_settings_schema.sql and retry.'
  }
  return message
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
      .from('notification_settings')
      .select('email_housing_reminders,email_casual_alerts,email_tax_updates,sms_payment_confirmations,frequency')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json({
      email_housing_reminders: data.email_housing_reminders ?? true,
      email_casual_alerts: data.email_casual_alerts ?? true,
      email_tax_updates: data.email_tax_updates ?? true,
      sms_payment_confirmations: data.sms_payment_confirmations ?? false,
      frequency: data.frequency ?? 'realtime',
    })
  } catch (error: unknown) {
    const message = formatNotificationSettingsError(error)
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

    const body = (await req.json()) as NotificationSettingsPayload
    const frequency = body.frequency ?? 'realtime'
    if (!['realtime', 'daily', 'weekly'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
    }

    const payload = {
      user_id: user.id,
      email_housing_reminders: !!body.email_housing_reminders,
      email_casual_alerts: !!body.email_casual_alerts,
      email_tax_updates: !!body.email_tax_updates,
      sms_payment_confirmations: !!body.sms_payment_confirmations,
      frequency,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('notification_settings')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = formatNotificationSettingsError(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
