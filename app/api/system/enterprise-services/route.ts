import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getPlanPrivileges, normalizePlan, PlanPrivileges } from '@/lib/entitlements'

const SERVICE_DEFINITIONS: Record<string, { label: string; privilegeKey: keyof PlanPrivileges; column: string }> = {
  vault_subnet: {
    label: 'Private Cloud Vault Subnet',
    privilegeKey: 'privateVaultSubnet',
    column: 'vault_subnet_id',
  },
  compliance_officer: {
    label: 'Dedicated Compliance Officer',
    privilegeKey: 'complianceOfficer',
    column: 'compliance_officer_id',
  },
  white_label: {
    label: 'White-label Reporting',
    privilegeKey: 'whiteLabelReporting',
    column: 'white_label_brand',
  },
  multi_entity: {
    label: 'Multi-entity Management',
    privilegeKey: 'multiEntityManagement',
    column: 'multi_entity_enabled',
  },
}

type ServiceStatus = {
  id: string
  label: string
  supported: boolean
  enabled: boolean
  info: string | null
  updated_at: string | null
}

async function fetchServiceStatuses(userId: string, plan: string | null, profile: any) {
  const privileges = getPlanPrivileges(plan)
  const services: ServiceStatus[] = []

  for (const [key, def] of Object.entries(SERVICE_DEFINITIONS)) {
    const supported = Boolean(privileges[def.privilegeKey])
    const enabled = Boolean(profile?.[def.column])
    services.push({
      id: key,
      label: def.label,
      supported,
      enabled,
      info: enabled ? `Last active ${new Date().toLocaleString('en-KE')}` : null,
      updated_at: enabled ? new Date().toISOString() : null,
    })
  }

  return services
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan,vault_subnet_id,compliance_officer_id,white_label_brand,multi_entity_enabled')
      .eq('id', user.id)
      .maybeSingle()

    const services = await fetchServiceStatuses(user.id, profile?.subscription_plan || null, profile)
    return NextResponse.json({ services })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load enterprise services'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as { service: string; metadata?: Record<string, unknown> }
    const definition = SERVICE_DEFINITIONS[body.service]
    if (!definition) {
      return NextResponse.json({ error: 'Unknown enterprise service' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) throw profileError

    const privileges = getPlanPrivileges(profile?.subscription_plan || null)
    if (!privileges[definition.privilegeKey]) {
      return NextResponse.json({ error: 'Plan does not support this service' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (body.service === 'vault_subnet') {
      updates.vault_subnet_id = `vault-${Date.now()}`
    } else if (body.service === 'compliance_officer') {
      updates.compliance_officer_id = user.id
    } else if (body.service === 'white_label') {
      updates.white_label_brand = String(body.metadata?.brand || 'ComplyKe Private Label')
    } else if (body.service === 'multi_entity') {
      updates.multi_entity_enabled = true
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        enterprise_service_notes: new Date().toISOString()
      })
      .eq('id', user.id)
    if (updateError) throw updateError

    await supabase
      .from('enterprise_service_requests')
      .insert({
        user_id: user.id,
        service: body.service,
        status: 'completed',
        metadata: body.metadata || {},
      })

    const { data: refreshedProfile } = await supabase
      .from('profiles')
      .select('subscription_plan,vault_subnet_id,compliance_officer_id,white_label_brand,multi_entity_enabled')
      .eq('id', user.id)
      .maybeSingle()

    const services = await fetchServiceStatuses(user.id, refreshedProfile?.subscription_plan || null, refreshedProfile)
    return NextResponse.json({ services })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update enterprise service'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
