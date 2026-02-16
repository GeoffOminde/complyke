import { NextRequest, NextResponse } from 'next/server'
import { appendFileSync } from 'node:fs'
import { createClient } from '@/lib/supabase-server'
import { createEtimsProviderFromEnv } from '@/lib/etims'

interface LedgerPayload {
  kraPin: string
  totalAmount: number
  merchantName?: string | null
  trnsMsNo?: string
  invcNo?: string
  receptNo?: string
  itemList?: Array<{
    itemCd: string
    qty: number
    unitPrice: number
  }>
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as LedgerPayload

    if (!body.kraPin || !body.totalAmount) {
      return NextResponse.json({ error: 'kraPin and totalAmount required' }, { status: 400 })
    }

    const etimsProvider = createEtimsProviderFromEnv()
    const etimsSubmission = await etimsProvider.submitSale({
      ...body,
      trnsMsNo: body.trnsMsNo || `TRN-${Date.now()}`,
      invcNo: body.invcNo || `INV-${Math.floor(Math.random() * 1000)}`,
      receptNo: body.receptNo || `RCPT-${Math.floor(Math.random() * 1000)}`,
    })

    const { error } = await supabase.from('itax_ledger_entries').insert({
      user_id: user.id,
      kra_pin: body.kraPin,
      total_amount: body.totalAmount,
      merchant_name: body.merchantName || 'Nexvision Solutions',
      status: etimsSubmission.status === 'accepted' ? 'submitted' : 'failed',
      etims_signature: etimsSubmission.submissionRef || null,
      trns_ms_no: body.trnsMsNo || null,
      invc_no: body.invcNo || null,
      recept_no: body.receptNo || null,
      item_list: body.itemList || null,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      etims: etimsSubmission,
    })
  } catch (error: unknown) {
    const stamp = new Date().toISOString()
    if (error instanceof Error) {
      console.error('Itax ledger error', error.message, error.stack)
      appendFileSync('ledger-errors.log', `${stamp} ${error.message}\n${error.stack?.replace(/\n/g, ' | ')}\n`)
    } else {
      console.error('Itax ledger error', error)
      appendFileSync('ledger-errors.log', `${stamp} ${JSON.stringify(error)}\n`)
    }
    const message = error instanceof Error ? error.message : 'Failed to push receipt to iTax ledger'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
