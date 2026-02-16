import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { auditLog } from '@/lib/audit-log'
import { selectDevice } from '@/lib/etims'

interface SelectDeviceBody {
  tin?: string
  bhfId?: string
  dvcSrlNo?: string
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = (profile?.role || '').toLowerCase()
    if (role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as SelectDeviceBody
    const tin = (body.tin || '').trim().toUpperCase()
    const bhfId = (body.bhfId || '').trim()
    const dvcSrlNo = (body.dvcSrlNo || '').trim()

    if (!tin || !bhfId || !dvcSrlNo) {
      return NextResponse.json(
        { error: 'tin, bhfId, and dvcSrlNo are required' },
        { status: 400 }
      )
    }

    const result = await selectDevice({ tin, bhfId, dvcSrlNo })

    await auditLog({
      event: 'etims.onboarding_select_device',
      actorUserId: user.id,
      metadata: {
        ok: result.ok,
        status: result.status,
      },
    })

    const safeText = result.bodyText.length > 4000 ? `${result.bodyText.slice(0, 4000)}...` : result.bodyText
    return NextResponse.json({
      ok: result.ok,
      status: result.status,
      bodyJson: result.bodyJson ?? null,
      bodyText: safeText,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run eTIMS device selection'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

