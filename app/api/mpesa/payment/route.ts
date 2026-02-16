import { NextRequest, NextResponse } from 'next/server'
import { initiateMpesaPayment, formatPhoneNumber, isValidKenyanPhone } from '@/lib/mpesa'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { auditLog } from '@/lib/audit-log'

export async function POST(request: NextRequest) {
    try {
        // Authenticate User
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Please sign in to initiate payment'
                },
                { status: 401 }
            )
        }

        const { phoneNumber, amount, plan } = await request.json()

        // Validate input
        if (!phoneNumber || !amount || !plan) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields',
                    message: 'Phone number, amount, and plan are required'
                },
                { status: 400 }
            )
        }

        // Format and validate phone number
        const formattedPhone = formatPhoneNumber(phoneNumber)
        if (!isValidKenyanPhone(formattedPhone)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid phone number',
                    message: 'Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)'
                },
                { status: 400 }
            )
        }

        // Validate amount
        const numAmount = parseInt(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid amount',
                    message: 'Amount must be a positive number'
                },
                { status: 400 }
            )
        }

        // Initiate M-Pesa payment
        const result = await initiateMpesaPayment(
            formattedPhone,
            numAmount,
            `ComplyKe-${plan}`,
            `ComplyKe ${plan} Subscription`
        )

        // Persist transaction handshake using checkout/merchant IDs so callback reconciliation is deterministic.
        const admin = createAdminClient()

        if (result.ResponseCode === '0') {
            await auditLog({
                event: 'payment.stk_initiated',
                actorUserId: user.id,
                metadata: {
                    plan,
                    amount: numAmount,
                    checkoutRequestID: result.CheckoutRequestID,
                    merchantRequestID: result.MerchantRequestID,
                },
            })

            const extendedInsert = await admin.from('payments').insert({
                user_id: user.id,
                amount: numAmount,
                plan,
                phone_number: formattedPhone,
                status: 'pending',
                checkout_request_id: result.CheckoutRequestID,
                merchant_request_id: result.MerchantRequestID,
            })

            if (extendedInsert.error) {
                console.error('M-Pesa payment persistence failed:', extendedInsert.error.message)
                await auditLog({
                    event: 'payment.persistence_failed',
                    level: 'error',
                    actorUserId: user.id,
                    metadata: {
                        plan,
                        amount: numAmount,
                        checkoutRequestID: result.CheckoutRequestID,
                        merchantRequestID: result.MerchantRequestID,
                        error: extendedInsert.error.message,
                    },
                })
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Payment tracking unavailable',
                        message: 'Unable to securely link this STK request to your account. Confirm payments schema migration and retry.'
                    },
                    { status: 500 }
                )
            }
        }

        // Check if STK push was successful
        if (result.ResponseCode === '0') {
            return NextResponse.json({
                success: true,
                message: 'STK Push sent successfully. Please check your phone.',
                data: {
                    merchantRequestID: result.MerchantRequestID,
                    checkoutRequestID: result.CheckoutRequestID,
                    responseCode: result.ResponseCode,
                    responseDescription: result.ResponseDescription,
                    customerMessage: result.CustomerMessage,
                }
            })
        } else {
            await auditLog({
                event: 'payment.stk_rejected',
                level: 'warn',
                actorUserId: user.id,
                metadata: {
                    plan,
                    amount: numAmount,
                    responseCode: result.ResponseCode,
                    responseDescription: result.ResponseDescription,
                },
            })
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment initiation failed',
                    message: result.ResponseDescription || 'Failed to initiate payment',
                    data: result
                },
                { status: 400 }
            )
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An error occurred while processing your payment'
        console.error('M-Pesa payment error:', error)
        await auditLog({
            event: 'payment.stk_error',
            level: 'error',
            metadata: { message },
        })
        const isClientSideMpesaFailure =
            /status code 4\d\d/i.test(message) ||
            /token/i.test(message) ||
            /credential/i.test(message) ||
            /payment initiation failed/i.test(message)

        return NextResponse.json(
            {
                success: false,
                error: 'Payment initiation failed',
                message: message + '. Please try again.',
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined
            },
            { status: isClientSideMpesaFailure ? 400 : 500 }
        )
    }
}
