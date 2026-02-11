# 🤖 AI Features Guide - ComplyKe

## Overview

ComplyKe now includes three powerful AI features powered by OpenAI GPT-4o:

1. **🔍 The Tax Lens** - Smart Receipt Scanner
2. **⚖️ Wakili AI** - Legal Chatbot
3. **📋 Contract Risk Analysis** - AI-Powered Contract Review

---

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### 2. Configure Environment Variables

Create a file named `.env.local` in the project root:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important**: Never commit `.env.local` to Git. It's already in `.gitignore`.

### 3. Restart the Development Server

```bash
npm run dev
```

---

## Feature 1: The Tax Lens 🔍

### What It Does
- Scans receipt images using OCR (Tesseract.js)
- Extracts: Merchant Name, KRA PIN, Amount, Date, Items
- Validates tax deductibility (checks for KRA PIN)
- Auto-categorizes expenses using AI

### How to Use
1. Click "Tax Lens" in the sidebar
2. Click "Scan Receipt" button
3. Upload or capture a receipt image
4. AI will analyze and display:
   - ✅ **Tax Deductible** (if KRA PIN found)
   - ❌ **Non-Deductible** (if no KRA PIN)
   - Expense category (Transport, Office Supplies, etc.)

### API Endpoint
```typescript
POST /api/scan-receipt
Content-Type: multipart/form-data

Body: { image: File }

Response: {
  success: boolean
  data: {
    merchantName: string | null
    kraPin: string | null
    totalAmount: number | null
    date: string | null
    items: string[]
    isDeductible: boolean
    category: string
  }
}
```

### Example Use Case
**Scenario**: You buy fuel for KES 5,000

**Without KRA PIN**: Receipt flagged as non-deductible (red)
**With KRA PIN**: Receipt approved, categorized as "Transport Expense" (green)

---

## Feature 2: Wakili AI ⚖️

### What It Does
- 24/7 Kenyan legal assistant chatbot
- Specialized in:
  - Employment Act 2007
  - Finance Act 2023/2024/2025
  - SHIF Regulations
  - Housing Levy
  - NSSF Act
  - Data Protection Act 2019
  - PAYE Tax

### How to Use
1. Click the floating chat button (bottom-right)
2. Ask questions like:
   - "What is the minimum wage in Nairobi for 2025?"
   - "How much is Housing Levy?"
   - "What are the penalties for late SHIF payment?"
3. Wakili AI responds with:
   - Specific law citations (e.g., "Section 37 of Employment Act 2007")
   - Actionable advice for SMEs
   - Kenyan context and examples

### API Endpoint
```typescript
POST /api/chat
Content-Type: application/json

Body: {
  messages: [
    { role: 'user', content: 'Your question here' }
  ]
}

Response: {
  message: string
  usage: object
}
```

### System Constraints
- **Refuses non-business questions** (poems, recipes, etc.)
- **Always cites specific laws**
- **Kenyan-focused** (uses KES, Kenyan examples)
- **Recommends lawyers** when uncertain

---

## Feature 3: Contract Risk Analysis 📋

### What It Does
- Reviews employment contracts for legal compliance
- Checks minimum wage by location (2025 rates)
- Identifies missing mandatory clauses
- Provides AI-powered legal feedback

### 2025 Minimum Wages
| Location | Minimum Wage (KES) |
|----------|-------------------|
| Nairobi  | 17,000           |
| Mombasa  | 16,500           |
| Kisumu   | 15,500           |
| Nakuru   | 15,000           |
| Other    | 15,000           |

### How to Use
1. Generate a contract in "Contract Generator"
2. Click "AI Review" button (coming soon in UI)
3. AI analyzes:
   - Minimum wage compliance
   - Missing mandatory clauses
   - Legal risks

### API Endpoint
```typescript
POST /api/review-contract
Content-Type: application/json

Body: {
  employeeName: string
  jobTitle: string
  grossSalary: number
  location: string
  contractText: string
}

Response: {
  success: boolean
  isApproved: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  issues: string[]
  warnings: string[]
  suggestions: string[]
  minimumWageCheck: {
    location: string
    minimumWage: number
    providedSalary: number
    compliant: boolean
  }
}
```

### Example
**Input**: Contract for "Nairobi" with salary KES 14,000
**Output**: 
```
❌ CRITICAL: Salary (KES 14,000) is below the 2025 minimum wage 
for Nairobi (KES 17,000). This violates the Regulation of Wages 
(General) Order 2025.
```

---

## Cost Estimates

### OpenAI API Pricing (GPT-4o)
- **Input**: $2.50 per 1M tokens
- **Output**: $10.00 per 1M tokens

### Typical Usage Costs
| Feature | Tokens/Request | Cost/Request |
|---------|---------------|--------------|
| Tax Lens | ~1,500 | ~$0.02 |
| Wakili AI | ~500 | ~$0.01 |
| Contract Review | ~2,000 | ~$0.03 |

**Monthly estimate** (100 receipts, 200 chats, 50 reviews): **~$10-15**

---

## Troubleshooting

### "OpenAI API key not configured"
**Solution**: Add `OPENAI_API_KEY` to `.env.local` and restart server

### Receipt scan fails
**Possible causes**:
1. Image too blurry
2. Receipt text not in English
3. API key invalid

**Solution**: Use clear, well-lit photos

### Wakili AI gives wrong answers
**Note**: AI is not a replacement for licensed lawyers. Always verify critical legal advice.

---

## Future Enhancements

### Planned Features
- [ ] Receipt history and expense tracking
- [ ] Bulk contract review
- [ ] Voice chat with Wakili AI
- [ ] Swahili language support
- [ ] Integration with M-Pesa for payments
- [ ] Supabase database for storing scans

---

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use environment variables** for all secrets
3. **Implement rate limiting** in production
4. **Validate all user inputs** before sending to AI
5. **Monitor API usage** to prevent abuse

---

## Support

For AI feature issues:
- Check `.env.local` configuration
- Verify OpenAI API key is valid
- Check console for error messages
- Email: geoffominde8@gmail.com

---

**Powered by OpenAI GPT-4o • Updated for 2025 Kenyan Laws**
