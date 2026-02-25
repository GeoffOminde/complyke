import axios from 'axios'

// M-Pesa Configuration
// SECURITY: All M-Pesa secrets MUST use server-side env vars only.
// NEVER use NEXT_PUBLIC_MPESA_* — those are bundled into client-side JS
// and expose credentials to anyone who opens DevTools.
const CONSUMER_KEY = (process.env.MPESA_CONSUMER_KEY || '').trim()
const CONSUMER_SECRET = (process.env.MPESA_CONSUMER_SECRET || '').trim()
const PASSKEY = (process.env.MPESA_PASSKEY || '').trim()
const SHORTCODE = (process.env.MPESA_SHORTCODE || '174379').trim()
const ENVIRONMENT = (process.env.MPESA_ENVIRONMENT || 'sandbox').trim()

// API URLs
const BASE_URL = ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

interface MpesaStkResponse {
    MerchantRequestID: string
    CheckoutRequestID: string
    ResponseCode: string
    ResponseDescription: string
    CustomerMessage: string
}

interface MpesaQueryResponse {
    ResponseCode: string
    ResponseDescription: string
    MerchantRequestID: string
    CheckoutRequestID: string
    ResultCode: string
    ResultDesc: string
}

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
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status
            const data = error.response?.data
            const detail =
                (typeof data?.errorMessage === 'string' && data.errorMessage) ||
                (typeof data?.error_description === 'string' && data.error_description) ||
                (typeof data?.errorCode === 'string' && data.errorCode) ||
                (typeof data?.error === 'string' && data.error) ||
                'unknown_token_error'
            console.error('M-Pesa token error:', status, data)
            throw new Error(`M-Pesa token request failed (${status ?? 'unknown'}): ${detail}`)
        }
        console.error('M-Pesa token error:', error)
        const message = error instanceof Error ? error.message : 'Failed to get M-Pesa token'
        throw new Error(message)
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
): Promise<MpesaStkResponse> {
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
                CallBackURL: `${(process.env.NEXT_PUBLIC_APP_URL || '').trim()}/api/mpesa/callback`,
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
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status
            const data = error.response?.data
            const detail =
                (typeof data?.errorMessage === 'string' && data.errorMessage) ||
                (typeof data?.ResponseDescription === 'string' && data.ResponseDescription) ||
                (typeof data?.responseDescription === 'string' && data.responseDescription) ||
                (typeof data?.errorCode === 'string' && data.errorCode) ||
                (typeof data?.error === 'string' && data.error) ||
                'payment_initiation_failed'
            console.error('M-Pesa payment error:', status, data || error.message)
            throw new Error(`M-Pesa STK request failed (${status ?? 'unknown'}): ${detail}`)
        }
        throw error
    }
}

/**
 * Query STK Push transaction status
 */
export async function queryMpesaTransaction(checkoutRequestID: string): Promise<MpesaQueryResponse> {
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
    } catch (error: unknown) {
        console.error('M-Pesa query error:', error)
        const message = error instanceof Error ? error.message : 'Failed to query transaction'
        throw new Error(message)
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
