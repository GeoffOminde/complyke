import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        // Log the callback for debugging
        console.log('=== M-Pesa Callback Received ===')
        console.log(JSON.stringify(data, null, 2))

        // Extract payment details
        const { Body } = data
        const { stkCallback } = Body
        const { ResultCode, ResultDesc, CallbackMetadata } = stkCallback

        if (ResultCode === 0) {
            // Payment successful
            const metadata = CallbackMetadata?.Item || []
            const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value
            const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value
            const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value
            const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value

            console.log('✅ Payment Successful:', {
                amount,
                mpesaReceiptNumber,
                phoneNumber,
                transactionDate,
            })

            // TODO: Update database with payment info
            // - Mark subscription as active
            // - Store receipt number
            // - Send confirmation email/SMS
            // - Update user's subscription_end_date

            // Example database update (uncomment when database is set up):
            /*
            await supabase
              .from('payments')
              .insert({
                phone_number: phoneNumber,
                amount: amount,
                mpesa_receipt: mpesaReceiptNumber,
                transaction_date: transactionDate,
                status: 'completed',
              })
            
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              })
              .eq('phone', phoneNumber)
            */

        } else {
            // Payment failed or cancelled
            console.log('❌ Payment Failed:', {
                resultCode: ResultCode,
                resultDesc: ResultDesc,
            })

            // TODO: Update database with failed payment
            // - Log the failure
            // - Notify user via email/SMS
        }

        // Always return success to M-Pesa
        return NextResponse.json({
            ResultCode: 0,
            ResultDesc: 'Success'
        })

    } catch (error) {
        console.error('M-Pesa callback error:', error)

        // Still return success to M-Pesa to avoid retries
        return NextResponse.json({
            ResultCode: 0,
            ResultDesc: 'Success'
        })
    }
}
