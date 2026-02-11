import axios from 'axios'

// M-Pesa Configuration
// CRITICAL SECURITY: Use server-side environment variables for secrets to prevent exposure
const CONSUMER_KEY = (process.env.MPESA_CONSUMER_KEY || process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY || '').trim()
const CONSUMER_SECRET = (process.env.MPESA_CONSUMER_SECRET || process.env.NEXT_PUBLIC_MPESA_CONSUMER_SECRET || '').trim()
const PASSKEY = (process.env.MPESA_PASSKEY || process.env.NEXT_PUBLIC_MPESA_PASSKEY || '').trim()
const SHORTCODE = (process.env.MPESA_SHORTCODE || process.env.NEXT_PUBLIC_MPESA_SHORTCODE || '174379').trim()
const ENVIRONMENT = (process.env.MPESA_ENVIRONMENT || process.env.NEXT_PUBLIC_MPESA_ENVIRONMENT || 'sandbox').trim()

// API URLs
const BASE_URL = ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

/**
 * Get OAuth token from M-Pesa API
 */
export async function getMpesaToken(): Promise<string> {
    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')

        const response = await axios.get(
            `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        )

        return response.data.access_token
    } catch (error) {
        console.error('M-Pesa token error:', error)
        throw new Error('Failed to get M-Pesa token')
    }
}

/**
 * Initiate STK Push for M-Pesa payment
 */
export async function initiateMpesaPayment(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string
): Promise<any> {
    try {
        const token = await getMpesaToken()
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

        const response = await axios.post(
            `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
            {
                BusinessShortCode: SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: phoneNumber,
                PartyB: SHORTCODE,
                PhoneNumber: phoneNumber,
                CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
                AccountReference: accountReference,
                TransactionDesc: transactionDesc,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        return response.data
    } catch (error: any) {
        console.error('M-Pesa payment error:', error.response?.data || error)
        throw new Error(error.response?.data?.errorMessage || 'Payment initiation failed')
    }
}

/**
 * Query STK Push transaction status
 */
export async function queryMpesaTransaction(checkoutRequestID: string): Promise<any> {
    try {
        const token = await getMpesaToken()
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

        const response = await axios.post(
            `${BASE_URL}/mpesa/stkpushquery/v1/query`,
            {
                BusinessShortCode: SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        return response.data
    } catch (error) {
        console.error('M-Pesa query error:', error)
        throw new Error('Failed to query transaction')
    }
}

/**
 * Format phone number to M-Pesa format (254XXXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or plus signs
    let cleaned = phone.replace(/[\s\-+]/g, '')

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.slice(1)
    }

    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned
    }

    return cleaned
}

/**
 * Validate phone number
 */
export function isValidKenyanPhone(phone: string): boolean {
    const formatted = formatPhoneNumber(phone)
    return /^254[0-9]{9}$/.test(formatted)
}
