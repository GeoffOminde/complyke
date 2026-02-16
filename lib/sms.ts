/**
 * ComplyKe Institutional SMS Gateway
 * Powered by AfricasTalking for Kenyan statutory alerts.
 */

export async function sendInstitutionalSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('--- COMPLYKE SMS GATEWAY INITIATED ---')
    console.log(`TO: ${to}`)
    console.log(`MESSAGE: ${message}`)
    console.log('---------------------------------------')

    const isProd = process.env.NODE_ENV === 'production'
    const username = process.env.AT_USERNAME
    const apiKey = process.env.AT_API_KEY

    if (!isProd || !username || !apiKey) {
        // Return mock success for development
        return { success: true, messageId: `sms_${Math.random().toString(36).substring(7)}` }
    }

    try {
        // Standard AT API implementation
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': apiKey
            },
            body: new URLSearchParams({
                username: username,
                to: to,
                message: message,
                from: process.env.AT_SENDER_ID || 'COMPLYKE'
            })
        })

        const result = await response.json()
        return { success: true, messageId: result.SMSMessageData?.Recipients?.[0]?.messageId }
    } catch (err) {
        console.error('SMS Gateway Failure:', err)
        return { success: false, error: 'gateway_error' }
    }
}

export async function sendDeadlineReminder(phone: string, taxType: string, deadline: string) {
    const message = `[COMPLYKE ALERT] Institutional Reminder: Your ${taxType} filing is due on ${deadline}. Login to the vault to automate submission.`
    return sendInstitutionalSMS(phone, message)
}
