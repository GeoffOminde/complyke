import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendIntegrationWebhook } from '@/lib/integration-webhook'
import { isPaidTierPlan, mapPayPerUsePlanToFeature } from '@/lib/entitlements'
import { auditLog } from '@/lib/audit-log'
import { sendPaymentReceiptEmail } from '@/lib/mail'
import { sendInstitutionalSMS } from '@/lib/sms'

interface MpesaCallbackItem {
  Name: string
  Value: string | number
}

interface MpesaCallbackMetadata {
  Item?: MpesaCallbackItem[]
}

interface MpesaCallback {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResultCode?: number
      ResultDesc?: string
      CallbackMetadata?: MpesaCallbackMetadata
    }
  }
}

function getRequestIp(request: NextRequest): string {
  const xff = (request.headers.get('x-forwarded-for') || '').trim()
  if (xff) return xff.split(',')[0].trim()
  return (request.headers.get('x-real-ip') || '').trim()
}

function verifyCallbackSource(request: NextRequest): { ok: boolean; reason: string } {
  const strict = (process.env.MPESA_CALLBACK_STRICT || '').toLowerCase() === 'true'
  const sharedSecret = (process.env.MPESA_CALLBACK_SHARED_SECRET || '').trim()
  const allowlist = (process.env.MPESA_CALLBACK_IP_ALLOWLIST || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  const hasControl = Boolean(sharedSecret) || allowlist.length > 0
  if (!hasControl && strict) {
    return { ok: false, reason: 'strict_mode_without_verification_controls' }
  }

  if (sharedSecret) {
    const header = (request.headers.get('x-callback-secret') || '').trim()
    if (!header || header !== sharedSecret) {
      return { ok: false, reason: 'shared_secret_mismatch' }
    }
  }

  if (allowlist.length > 0) {
    const ip = getRequestIp(request)
    if (!ip || !allowlist.includes(ip)) {
      return { ok: false, reason: 'source_ip_not_allowlisted' }
    }
  }

  if (!hasControl) {
    return { ok: !strict, reason: strict ? 'unverifiable_source' : 'verification_not_configured_non_strict' }
  }

  return { ok: true, reason: 'verified' }
}

export async function POST(request: NextRequest) {
  try {
    const sourceCheck = verifyCallbackSource(request)
    if (!sourceCheck.ok) {
      await auditLog({
        event: 'payment.callback_rejected',
        level: 'warn',
        metadata: { reason: sourceCheck.reason, ip: getRequestIp(request) || null },
      })
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorized callback source' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const data = await request.json() as MpesaCallback

    const { Body } = data
    const { stkCallback } = Body ?? {}
    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID, MerchantRequestID } = stkCallback ?? {}

    const metadata = CallbackMetadata?.Item ?? []
    const amount = metadata.find((item) => item.Name === 'Amount')?.Value
    const mpesaReceiptNumber = metadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value
    const phoneNumber = metadata.find((item) => item.Name === 'PhoneNumber')?.Value
    const transactionDate = metadata.find((item) => item.Name === 'TransactionDate')?.Value

    let paymentRow: { id: string; user_id: string | null; plan: string | null; status: string | null } | null = null
    if (CheckoutRequestID) {
      const byCheckout = await supabase
        .from('payments')
        .select('id,user_id,plan,status')
        .eq('checkout_request_id', CheckoutRequestID)
        .maybeSingle()
      if (!byCheckout.error && byCheckout.data) paymentRow = byCheckout.data
    }
    if (!paymentRow && MerchantRequestID) {
      const byMerchant = await supabase
        .from('payments')
        .select('id,user_id,plan,status')
        .eq('merchant_request_id', MerchantRequestID)
        .maybeSingle()
      if (!byMerchant.error && byMerchant.data) paymentRow = byMerchant.data
    }

    if (!paymentRow) {
      await auditLog({
        event: 'payment.callback_unmatched',
        level: 'warn',
        metadata: {
          checkoutRequestID: CheckoutRequestID || null,
          merchantRequestID: MerchantRequestID || null,
          resultCode: ResultCode ?? null,
          resultDesc: ResultDesc || null,
        },
      })
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
    }

    if (ResultCode === 0) {
      if ((paymentRow.status || '').toLowerCase() === 'completed') {
        await auditLog({
          event: 'payment.callback_duplicate_completed',
          level: 'warn',
          actorUserId: paymentRow.user_id,
          metadata: {
            paymentId: paymentRow.id,
            checkoutRequestID: CheckoutRequestID || null,
            merchantRequestID: MerchantRequestID || null,
          },
        })
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
      }

      const paymentUpdatePayload = {
        status: 'completed',
        mpesa_receipt: String(mpesaReceiptNumber || ''),
        result_code: ResultCode,
        result_desc: ResultDesc || 'Success',
        transaction_date: transactionDate ? String(transactionDate) : null,
        raw_callback: data,
        updated_at: new Date().toISOString(),
      }

      const transitioned = await supabase
        .from('payments')
        .update(paymentUpdatePayload)
        .eq('id', paymentRow.id)
        .neq('status', 'completed')
        .select('id,user_id,plan')
        .maybeSingle()

      if (transitioned.error || !transitioned.data) {
        await auditLog({
          event: 'payment.callback_duplicate_race',
          level: 'warn',
          actorUserId: paymentRow.user_id,
          metadata: { paymentId: paymentRow.id, error: transitioned.error?.message || null },
        })
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
      }

      const paidPlan = transitioned.data.plan || null
      const userId = transitioned.data.user_id || null

      await auditLog({
        event: 'payment.callback_matched_completed',
        actorUserId: userId,
        metadata: {
          paymentId: transitioned.data.id,
          plan: paidPlan,
          amount: amount ?? null,
          checkoutRequestID: CheckoutRequestID || null,
          merchantRequestID: MerchantRequestID || null,
        },
      })

      if (userId && isPaidTierPlan(paidPlan)) {
        await supabase
          .from('profiles')
          .update({
            subscription_plan: paidPlan,
            subscription_status: 'active',
            subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', userId)
        await auditLog({
          event: 'entitlement.plan_activated',
          actorUserId: userId,
          metadata: { plan: paidPlan },
        })
      }

      const ppuFeature = mapPayPerUsePlanToFeature(paidPlan)
      if (userId && ppuFeature) {
        const existingCredit = await supabase
          .from('feature_credits')
          .select('id,credit_balance')
          .eq('user_id', userId)
          .eq('feature', ppuFeature)
          .maybeSingle()

        if (!existingCredit.error && existingCredit.data) {
          const next = Number(existingCredit.data.credit_balance || 0) + 1
          await supabase
            .from('feature_credits')
            .update({
              credit_balance: next,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCredit.data.id)
          await auditLog({
            event: 'entitlement.credit_incremented',
            actorUserId: userId,
            metadata: { feature: ppuFeature, nextBalance: next },
          })
        } else {
          await supabase
            .from('feature_credits')
            .insert({
              user_id: userId,
              feature: ppuFeature,
              credit_balance: 1,
            })
          await auditLog({
            event: 'entitlement.credit_seeded',
            actorUserId: userId,
            metadata: { feature: ppuFeature, nextBalance: 1 },
          })
        }
      }

      if (phoneNumber) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'payment_confirmation',
          message: `M-Pesa payment received. Receipt: ${String(mpesaReceiptNumber || 'N/A')}.`,
          phone_number: String(phoneNumber),
          status: 'sent',
          is_read: false,
        })

        // Institutional SMS Protocol
        await sendInstitutionalSMS(
          String(phoneNumber),
          `[COMPLYKE] Payment Verified. Receipt: ${String(mpesaReceiptNumber || 'N/A')}. Your Institutional Vault is now active.`
        )
      }

      // Institutional Mail Protocol
      if (userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        if (userData?.user?.email) {
          await sendPaymentReceiptEmail(
            userData.user.email,
            Number(amount || 0),
            paidPlan || 'unknown',
            String(mpesaReceiptNumber || 'N/A')
          )
        }
      }

      await sendIntegrationWebhook('payment.completed', {
        checkoutRequestID: CheckoutRequestID || null,
        merchantRequestID: MerchantRequestID || null,
        phoneNumber: phoneNumber ? String(phoneNumber) : null,
        amount: amount ?? null,
        mpesaReceiptNumber: mpesaReceiptNumber ? String(mpesaReceiptNumber) : null,
        resultCode: ResultCode ?? 0,
        resultDesc: ResultDesc || 'Success',
        transactionDate: transactionDate ? String(transactionDate) : null,
      })
    } else {
      const failPayload = {
        status: 'failed',
        result_code: ResultCode ?? -1,
        result_desc: ResultDesc || 'Failed',
        raw_callback: data,
        updated_at: new Date().toISOString(),
      }

      await supabase
        .from('payments')
        .update(failPayload)
        .eq('id', paymentRow.id)
        .neq('status', 'completed')

      await auditLog({
        event: 'payment.callback_failed',
        level: 'warn',
        actorUserId: paymentRow.user_id,
        metadata: {
          paymentId: paymentRow.id,
          resultCode: ResultCode ?? -1,
          resultDesc: ResultDesc || 'Failed',
        },
      })

      await sendIntegrationWebhook('payment.failed', {
        checkoutRequestID: CheckoutRequestID || null,
        merchantRequestID: MerchantRequestID || null,
        resultCode: ResultCode ?? -1,
        resultDesc: ResultDesc || 'Failed',
      })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'M-Pesa callback error'
    await auditLog({
      event: 'payment.callback_error',
      level: 'error',
      metadata: { message },
    })

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  }
}

