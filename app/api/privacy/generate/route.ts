import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { generatePrivacyPolicy } from '@/lib/privacy-policy-generator'
import { canAccessFeature } from '@/lib/entitlements'

interface PrivacyGenerateRequest {
  companyName: string
  email?: string
  phone?: string
  address?: string
  collectsPhoneNumbers?: boolean
  hasCCTV?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as PrivacyGenerateRequest
    if (!body.companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_end_date, role')
      .eq('id', user.id)
      .maybeSingle()

    const isSuperAdmin = profile?.role === 'super-admin'
    const hasPlanAccess = isSuperAdmin || canAccessFeature(profile?.subscription_plan || null, 'privacy', profile?.subscription_end_date)
    if (!hasPlanAccess) {
      const admin = createAdminClient()
      const creditRow = await admin
        .from('feature_credits')
        .select('id,credit_balance')
        .eq('user_id', user.id)
        .eq('feature', 'privacy')
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
          { error: 'Tier Restricted: Privacy Policy requires Micro-Entity+ plan or Privacy credit.' },
          { status: 402 }
        )
      }
    }

    const policy = generatePrivacyPolicy({
      companyName: body.companyName,
      collectsPhoneNumbers: !!body.collectsPhoneNumbers,
      hasCCTV: !!body.hasCCTV,
      email: body.email,
      phone: body.phone,
      address: body.address,
    })

    const { error: insertError } = await supabase
      .from('privacy_policies')
      .insert([
        {
          user_id: user.id,
          company_name: body.companyName,
          collects_phone: !!body.collectsPhoneNumbers,
          uses_cctv: !!body.hasCCTV,
          policy_content: policy,
        },
      ])

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, policy })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate privacy policy'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

