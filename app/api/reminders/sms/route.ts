import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '@/lib/africastalking'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate Request
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Request
        const { phoneNumber, message, type } = await req.json() as {
            phoneNumber?: string
            message?: string
            type?: string
        }

        if (!phoneNumber || !message) {
            return NextResponse.json({ error: 'Phone and message required' }, { status: 400 })
        }

        // 3. Log the reminder in the database (Optional)
        try {
            await supabase.from('notifications').insert({
                user_id: user.id,
                type: type || 'sms_reminder',
                message: message,
                phone_number: phoneNumber,
                status: 'sent'
            })
        } catch (dbError) {
            console.warn('Logging skipped:', dbError)
        }

        // 4. Send the SMS via AfricasTalking
        const result = await sendSMS(phoneNumber, message)

        return NextResponse.json({
            success: true,
            message: 'Statutory reminder dispatched over encrypted channel',
            simulated: result.simulated || false
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Reminder protocol failure'
        console.error('Reminder Error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
