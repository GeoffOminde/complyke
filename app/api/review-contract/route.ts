import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase-server'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
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
                `❌ CRITICAL: Salary (KES ${grossSalary.toLocaleString()}) is below the 2025 minimum wage for ${location} (KES ${minimumWage.toLocaleString()}). This violates the Regulation of Wages (General) Order 2025.`
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

        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert in Kenyan employment law. Provide precise, actionable feedback on employment contracts.'
                },
                {
                    role: 'user',
                    content: reviewPrompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        })

        const aiReview = aiResponse.choices[0]?.message?.content || ''

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

    } catch (error: any) {
        console.error('Contract Review Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to review contract' },
            { status: 500 }
        )
    }
}
