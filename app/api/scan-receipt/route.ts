import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { canAccessFeature } from '@/lib/entitlements'

interface ReceiptData {
    merchantName: string | null
    kraPin: string | null
    totalAmount: number | null
    date: string | null
    items: string[]
    isDeductible: boolean
    category: string
    rawText: string
    verificationStatus: 'verified' | 'unverified' | 'failed'
    etimsSignature: string | null
    auditHash: string
}

interface ExtractedReceiptData {
    merchantName?: string | null
    kraPin?: string | null
    totalAmount?: number | null
    date?: string | null
    items?: string[]
    category?: string | null
    etimsSignature?: string | null
}

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string
            }>
        }
    }>
}

export async function POST(req: NextRequest) {
    try {
        // Authenticate User
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized: Institutional session required' },
                { status: 401 }
            )
        }

        // Enforce plan/credit access server-side.
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan, subscription_end_date, role')
            .eq('id', user.id)
            .maybeSingle()

        const isSuperAdmin = profile?.role === 'super-admin'
        const hasPlanAccess = isSuperAdmin || canAccessFeature(profile?.subscription_plan || null, 'receipts', profile?.subscription_end_date)
        if (!hasPlanAccess) {
            const admin = createAdminClient()
            const creditRow = await admin
                .from('feature_credits')
                .select('id,credit_balance')
                .eq('user_id', user.id)
                .eq('feature', 'scan')
                .maybeSingle()

            const balance = Number(creditRow.data?.credit_balance || 0)
            if (!creditRow.error && balance > 0) {
                await admin
                    .from('feature_credits')
                    .update({
                        credit_balance: balance - 1,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', creditRow.data!.id)
            } else {
                return NextResponse.json(
                    { error: 'Tier Restricted: Tax Lens requires Micro-Entity+ plan or Scan credit.' },
                    { status: 402 }
                )
            }
        }

        const formData = await req.formData()
        const imageFile = formData.get('image') as File

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            )
        }

        const isGeminiEnabled = !!process.env.GEMINI_API_KEY

        if (!isGeminiEnabled) {
            return NextResponse.json(
                { error: 'AI Protocol Error: Gemini engine not configured. Please check your institutional vault (.env).' },
                { status: 500 }
            )
        }

        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Image = buffer.toString('base64')

        let extractedData: ExtractedReceiptData = {}
        let category = 'Other'
        let rawText = ''

        // ============================================================================
        // GEMINI FLASH: END-TO-END VISION EXTRACTION
        // ============================================================================
        console.log('Utilizing Gemini Statutory Vision Engine...')

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `Analyze this Kenyan statutory document (receipt/invoice).
                                
                                **Institutional Extraction Rules:**
                                1. merchantName: Look for the institutional header/logo text.
                                2. kraPin: Must be 11 characters, starting with P or A (e.g., P051234567X).
                                3. totalAmount: Look for 'TOTAL', 'GROSS', or 'TOTAL KES'.
                                4. date: YYYY-MM-DD.
                                5. items: Array of line items.
                                6. etimsSignature: Search for CUSN, CU Serial Number, Invoice Number, or the long VSCU hash usually found at the bottom.
                                7. category: ONE of: Transport, Office Supplies, Utilities, Professional Services, Equipment, Marketing, Other.

                                Respond ONLY with valid JSON:
                                {
                                  "merchantName": "string",
                                  "kraPin": "string",
                                  "totalAmount": number,
                                  "date": "string",
                                  "items": ["string"],
                                  "etimsSignature": "string",
                                  "category": "string"
                                }`
                        },
                        {
                            inline_data: {
                                mime_type: imageFile.type,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        })

        const result = await geminiResponse.json() as GeminiResponse
        const contentText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        extractedData = JSON.parse(contentText) as ExtractedReceiptData
        category = extractedData.category || 'Other'
        rawText = `[Gemini Vision Extraction Successful]`

        // Statutory Verification Logic
        const kraPinPattern = /^[AP][0-9]{9}[A-Z]$/i
        const pin = (extractedData.kraPin || '').trim().toUpperCase()
        const isPinValid = kraPinPattern.test(pin)

        // Simulating Real-time KRA iTax/eTIMS Handshake
        let verificationStatus: 'verified' | 'unverified' | 'failed' = 'unverified'
        if (isPinValid && extractedData.etimsSignature) {
            verificationStatus = 'verified'
        } else if (isPinValid) {
            verificationStatus = 'unverified'
        } else if (pin) {
            verificationStatus = 'failed'
        }

        const isDeductible = verificationStatus === 'verified'

        const receiptData: ReceiptData = {
            merchantName: extractedData.merchantName ?? null,
            kraPin: pin || null,
            totalAmount: extractedData.totalAmount ?? null,
            date: extractedData.date ?? null,
            items: extractedData.items ?? [],
            etimsSignature: extractedData.etimsSignature ?? null,
            isDeductible,
            category: category || extractedData.category || 'Other',
            rawText,
            verificationStatus,
            auditHash: `CKE-AUD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }

        return NextResponse.json({
            success: true,
            data: receiptData
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to process statutory asset'
        console.error('Tax Lens Statutory Error:', message)
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
