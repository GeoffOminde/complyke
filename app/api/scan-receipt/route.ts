import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Tesseract from 'tesseract.js'
import { createClient } from '@/lib/supabase-server'

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

        const formData = await req.formData()
        const imageFile = formData.get('image') as File

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            )
        }

        const isGeminiEnabled = !!process.env.GEMINI_API_KEY
        const isOpenAIEnabled = !!process.env.OPENAI_API_KEY

        if (!isGeminiEnabled && !isOpenAIEnabled) {
            return NextResponse.json(
                { error: 'AI Protocol Error: No active AI engine configured. Please check your institutional vault (.env).' },
                { status: 500 }
            )
        }

        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Image = buffer.toString('base64')

        let extractedData: any = {}
        let category = 'Other'
        let rawText = ''

        if (isGeminiEnabled) {
            // ============================================================================
            // GEMINI 1.5 FLASH: END-TO-END VISION EXTRACTION (FREE TIER)
            // ============================================================================
            console.log('Utilizing Gemini Statutory Vision Engine...')

            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Extract data from this Kenyan receipt. Respond ONLY with valid JSON.
                                {
                                  "merchantName": "string",
                                  "kraPin": "string (format P05... or A00...)",
                                  "totalAmount": number,
                                  "date": "YYYY-MM-DD",
                                  "items": ["item1", "item2"],
                                  "etimsSignature": "string (Look for CUSN, Invoice Number, or QR data)",
                                  "category": "ONE of: Transport, Office Supplies, Utilities, Professional Services, Equipment, Marketing, Other"
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

            const result = await geminiResponse.json()
            const contentText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
            extractedData = JSON.parse(contentText)
            category = extractedData.category || 'Other'
            rawText = `[Gemini Vision Extraction Successful]`

        } else {
            // ============================================================================
            // LEGACY: TESSERACT + OPENAI FALLBACK
            // ============================================================================
            console.log('Falling back to Legacy Tesseract OCR...')
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng')
            rawText = text

            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
            const extractionResponse = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{
                    role: 'system',
                    content: 'Extract receipt data. Respond with JSON only.'
                }, {
                    role: 'user',
                    content: text
                }],
                response_format: { type: 'json_object' }
            })

            extractedData = JSON.parse(extractionResponse.choices[0]?.message?.content || '{}')
        }

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
            ...extractedData,
            kraPin: pin || null,
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

    } catch (error: any) {
        console.error('Tax Lens Statutory Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to process statutory asset' },
            { status: 500 }
        )
    }
}
