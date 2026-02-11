import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Tesseract from 'tesseract.js'
import { createClient } from '@/lib/supabase-server'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

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
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            )
        }

        // Convert image to base64 for OCR
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Perform OCR using Tesseract.js
        console.log('Starting OCR...')
        const { data: { text } } = await Tesseract.recognize(
            buffer,
            'eng',
            {
                logger: (m) => console.log(m),
            }
        )

        console.log('OCR Text:', text)

        // Use GPT-4o to extract structured data from OCR text
        const extractionPrompt = `You are a receipt data extraction expert for Kenyan businesses.

Extract the following information from this receipt text:
1. Merchant Name
2. KRA PIN (format: P051234567X or similar)
3. Total Amount (in KES)
4. Date
5. List of items purchased

Receipt Text:
${text}

Respond ONLY with valid JSON in this exact format:
{
  "merchantName": "string or null",
  "kraPin": "string or null",
  "totalAmount": number or null,
  "date": "YYYY-MM-DD or null",
  "items": ["item1", "item2"],
  "etimsSignature": "string or null (Look for Control Unit Serial Number (CUSN) or Invoice Number like OSCU... or KRA...)"
}

If you cannot find a field, use null. Be precise.`

        const extractionResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are a precise data extraction assistant. Always respond with valid JSON only.' },
                { role: 'user', content: extractionPrompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })

        const extractedData = JSON.parse(extractionResponse.choices[0]?.message?.content || '{}')

        // Statutory Verification Logic
        const kraPinPattern = /^[AP][0-9]{9}[A-Z]$/i
        const isPinValid = extractedData.kraPin && kraPinPattern.test(extractedData.kraPin.trim())

        // Simulating Real-time KRA iTax/eTIMS Handshake
        // In a production environment, this would call the GavaConnect or eTIMS Ledger API
        let verificationStatus: 'verified' | 'unverified' | 'failed' = 'unverified'
        if (isPinValid && extractedData.etimsSignature) {
            verificationStatus = 'verified'
        } else if (isPinValid) {
            verificationStatus = 'unverified' // Valid PIN format but missing eTIMS signature
        } else if (extractedData.kraPin) {
            verificationStatus = 'failed' // PIN provided but failed format protocol
        }

        const isDeductible = verificationStatus === 'verified'

        // Use AI to categorize the expense
        const categorizationPrompt = `Based on these items: ${extractedData.items.join(', ')}, categorize this expense into ONE of these categories:
- Transport Expense
- Office Supplies
- Utilities
- Professional Services
- Equipment
- Marketing
- Other

Respond with ONLY the category name, nothing else.`

        const categoryResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'user', content: categorizationPrompt }
            ],
            temperature: 0.3,
            max_tokens: 20
        })

        const category = categoryResponse.choices[0]?.message?.content?.trim() || 'Other'

        const receiptData: ReceiptData = {
            ...extractedData,
            isDeductible,
            category,
            rawText: text,
            verificationStatus,
            auditHash: `CKE-AUD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }

        return NextResponse.json({
            success: true,
            data: receiptData
        })

    } catch (error: any) {
        console.error('Receipt Scan Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to process receipt' },
            { status: 500 }
        )
    }
}
