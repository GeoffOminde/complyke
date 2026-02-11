import { NextRequest, NextResponse } from 'next/server'
import { initiateMpesaPayment, formatPhoneNumber, isValidKenyanPhone } from '@/lib/mpesa'
import { createClient } from '@/lib/supabase-server'

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
    } catch (error: any) {
        console.error('M-Pesa payment error:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Payment initiation failed',
                message: error.message || 'An error occurred while processing your payment. Please try again.',
                details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
            },
            { status: 500 }
        )
    }
}
