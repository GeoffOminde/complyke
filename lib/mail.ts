/**
 * ComplyKe Institutional Mail Service
 * Handles transactional emails for M-Pesa receipts, compliance alerts, and vault events.
 */

interface MailPayload {
    to: string
    subject: string
    text: string
    html?: string
}

export async function sendTransactionalEmail(payload: MailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('--- COMPlYKE MAIL PROTOCOL INITIATED ---')
    console.log(`TO: ${payload.to}`)
    console.log(`SUBJECT: ${payload.subject}`)
    console.log(`BODY: ${payload.text}`)
    console.log('-----------------------------------------')

    // In a real environment, we would use Resend, SendGrid, or AWS SES.
    // Given the 2026 Institutional Requirements:

    const isProd = process.env.NODE_ENV === 'production'

    if (!isProd) {
        return { success: true, messageId: `msg_${Math.random().toString(36).substring(7)}` }
    }

    // Placeholder for future production integration
    // const res = await fetch('https://api.resend.com/emails', { ... })

    return { success: true, messageId: 'internal_mock_id' }
}

export async function sendPaymentReceiptEmail(email: string, amount: number, plan: string, receipt: string) {
    return sendTransactionalEmail({
        to: email,
        subject: `[RECEIPT] ComplyKe Institutional Vault: ${plan.toUpperCase()}`,
        text: `Your payment of KES ${amount.toLocaleString()} for the ${plan} plan has been verified.\nM-Pesa Receipt: ${receipt}\n\nYour vault access is now active until 2026.`,
        html: `<h1>Payment Verified</h1><p>Your institutional vault for <strong>${plan}</strong> is now active.</p><p>Receipt: ${receipt}</p>`
    })
}
