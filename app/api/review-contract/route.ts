import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const apiKey = process.env.GEMINI_API_KEY

// 2025 Minimum Wage Data for Kenya
const MINIMUM_WAGES_2025 = {
    nairobi: 17000,
    mombasa: 16500,
    kisumu: 15500,
    nakuru: 15000,
    other: 15000,
}

interface ContractReviewRequest {
    employeeName: string
    jobTitle: string
    grossSalary: number
    location: string
    contractText: string
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

        const body: ContractReviewRequest = await req.json()
        const { employeeName, jobTitle, grossSalary, location, contractText } = body

        if (!apiKey) {
            return NextResponse.json(
                { error: 'AI key not configured. Set GEMINI_API_KEY.' },
                { status: 500 }
            )
        }

        const issues: string[] = []
        const warnings: string[] = []
        const suggestions: string[] = []

        // 1. Minimum Wage Compliance Check
        const locationKey = location.toLowerCase() as keyof typeof MINIMUM_WAGES_2025
        const minimumWage = MINIMUM_WAGES_2025[locationKey] || MINIMUM_WAGES_2025.other

        if (grossSalary < minimumWage) {
            issues.push(
                `CRITICAL: Salary (KES ${grossSalary.toLocaleString()}) is below the 2025 minimum wage for ${location} (KES ${minimumWage.toLocaleString()}). This violates the Regulation of Wages (General) Order 2025.`
            )
        }

        // 2. AI-Powered Contract Review
        const reviewPrompt = `You are a Kenyan employment law expert. Review this employment contract for compliance with:
- Employment Act 2007
- Finance Act 2023/2024/2025 (Housing Levy, SHIF)
- NSSF Act 2013
- 2025 Minimum Wage Regulations

Contract Details:
- Employee: ${employeeName}
- Position: ${jobTitle}
- Salary: KES ${grossSalary.toLocaleString()}
- Location: ${location}

Contract Text:
${contractText}

Identify:
1. Missing mandatory clauses
2. Legal compliance issues
3. Recommendations for improvement

Format your response as:
**ISSUES:**
- [List critical legal issues]

**WARNINGS:**
- [List potential problems]

**SUGGESTIONS:**
- [List improvements]

Be specific and cite relevant sections of Kenyan law.`

        type GeminiResponse = {
            candidates?: Array<{
                content?: {
                    parts?: Array<{ text?: string }>
                }
            }>
        }

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: 'You are an expert in Kenyan employment law. Provide precise, actionable feedback on employment contracts.' }]
                    },
                    contents: [{ parts: [{ text: reviewPrompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1000
                    }
                })
            }
        )

        if (!geminiRes.ok) {
            const errBody = await geminiRes.text()
            return NextResponse.json(
                { error: `Gemini request failed: ${errBody}` },
                { status: geminiRes.status }
            )
        }

        const aiResponse = await geminiRes.json() as GeminiResponse
        const aiReview = aiResponse.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim() || ''

        // Parse AI response
        const issuesMatch = aiReview.match(/\*\*ISSUES:\*\*([\s\S]*?)(?=\*\*WARNINGS:|\*\*SUGGESTIONS:|$)/i)
        const warningsMatch = aiReview.match(/\*\*WARNINGS:\*\*([\s\S]*?)(?=\*\*ISSUES:|\*\*SUGGESTIONS:|$)/i)
        const suggestionsMatch = aiReview.match(/\*\*SUGGESTIONS:\*\*([\s\S]*?)(?=\*\*ISSUES:|\*\*WARNINGS:|$)/i)

        if (issuesMatch) {
            const aiIssues = issuesMatch[1].trim().split('\n').filter(line => line.trim().startsWith('-'))
            issues.push(...aiIssues.map(i => i.trim()))
        }

        if (warningsMatch) {
            const aiWarnings = warningsMatch[1].trim().split('\n').filter(line => line.trim().startsWith('-'))
            warnings.push(...aiWarnings.map(w => w.trim()))
        }

        if (suggestionsMatch) {
            const aiSuggestions = suggestionsMatch[1].trim().split('\n').filter(line => line.trim().startsWith('-'))
            suggestions.push(...aiSuggestions.map(s => s.trim()))
        }

        // Determine overall status
        const isApproved = issues.length === 0
        const riskLevel = issues.length > 0 ? 'HIGH' : warnings.length > 0 ? 'MEDIUM' : 'LOW'

        return NextResponse.json({
            success: true,
            isApproved,
            riskLevel,
            issues,
            warnings,
            suggestions,
            minimumWageCheck: {
                location,
                minimumWage,
                providedSalary: grossSalary,
                compliant: grossSalary >= minimumWage
            },
            fullReview: aiReview
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to review contract'
        console.error('Contract Review Error:', message)
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
