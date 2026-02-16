import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendSMS } from '@/lib/africastalking'

type ReminderType = 'housing_levy' | 'shif' | 'nssf'

interface ReminderRuleRow {
  user_id: string
  enabled: boolean
  phone_override: string | null
  days_before: number
  reminder_types: ReminderType[]
}

interface ProfileRow {
  id: string
  business_name: string | null
  phone: string | null
  role: string | null
  subscription_plan: string | null
  subscription_status: string | null
}

function isAuthorizedCron(req: NextRequest): boolean {
  const cronHeader = req.headers.get('x-vercel-cron')
  if (cronHeader) return true

  const token = process.env.CRON_SECRET
  if (!token) return false
  const authHeader = req.headers.get('authorization') || ''
  return authHeader === `Bearer ${token}`
}

function kenyaNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type: string) => parts.find((p) => p.type === type)?.value || ''
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
  }
}

function dueDayFor(type: ReminderType): number {
  if (type === 'housing_levy') return 9
  if (type === 'shif') return 9
  return 9
}

function buildMessage(type: ReminderType, businessName: string | null, daysUntilDue: number) {
  const entity = businessName || 'your business'
  const taxLabel = type === 'housing_levy' ? 'Housing Levy' : type === 'shif' ? 'SHIF' : 'NSSF'
  const dueText = daysUntilDue === 0 ? 'is due today' : `is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
  return `ComplyKe Reminder: ${taxLabel} for ${entity} ${dueText}. Deadline: 9th of this month.`
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { day, dateKey } = kenyaNow()

    const { data: rulesData, error: rulesError } = await supabase
      .from('sms_reminder_rules')
      .select('user_id,enabled,phone_override,days_before,reminder_types')
      .eq('enabled', true)

    if (rulesError) throw rulesError

    const rules = (rulesData || []) as ReminderRuleRow[]
    if (rules.length === 0) {
      return NextResponse.json({ success: true, sent: 0, skipped: 0, reason: 'No enabled reminder rules' })
    }

    const userIds = [...new Set(rules.map((r) => r.user_id))]
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id,business_name,phone,role,subscription_plan,subscription_status')
      .in('id', userIds)

    if (profilesError) throw profilesError

    const profiles = (profilesData || []) as ProfileRow[]
    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    let sent = 0
    let skipped = 0

    for (const rule of rules) {
      const profile = profileMap.get(rule.user_id)
      if (!profile) {
        skipped++
        continue
      }

      const plan = (profile.subscription_plan || '').toLowerCase()
      const status = (profile.subscription_status || '').toLowerCase()
      const role = (profile.role || '').toLowerCase()
      const eligiblePlan = plan === 'sme-power' || plan === 'enterprise' || role === 'super-admin'
      const eligibleStatus = status === 'active' || status === 'trialing' || role === 'super-admin'

      if (!eligiblePlan || !eligibleStatus) {
        skipped++
        continue
      }

      const phone = rule.phone_override || profile.phone
      if (!phone) {
        skipped++
        continue
      }

      const reminderTypes: ReminderType[] = Array.isArray(rule.reminder_types) && rule.reminder_types.length > 0
        ? rule.reminder_types.filter((t): t is ReminderType => t === 'housing_levy' || t === 'shif' || t === 'nssf')
        : ['housing_levy', 'shif', 'nssf']

      for (const reminderType of reminderTypes) {
        const dueDay = dueDayFor(reminderType)
        const daysUntilDue = dueDay - day
        if (daysUntilDue !== rule.days_before && daysUntilDue !== 0) {
          continue
        }

        const notificationType = `sms_reminder_${reminderType}_${dateKey}`
        const { data: existingLog } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', rule.user_id)
          .eq('type', notificationType)
          .limit(1)
          .maybeSingle()

        if (existingLog?.id) {
          skipped++
          continue
        }

        const message = buildMessage(reminderType, profile.business_name, daysUntilDue)
        const smsResult = await sendSMS(phone, message)
        const statusLabel = smsResult.success ? 'sent' : 'failed'

        await supabase.from('notifications').insert({
          user_id: rule.user_id,
          type: notificationType,
          message,
          phone_number: phone,
          status: statusLabel,
          is_read: false,
        })

        sent += smsResult.success ? 1 : 0
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      dateKey,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run SMS reminder scheduler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
