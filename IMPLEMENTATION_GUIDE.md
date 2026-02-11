# 🚀 ComplyKe - Implementation Guide for Kenyan Market Sellability

## Overview
This document provides step-by-step instructions to implement the features needed to make ComplyKe sellable in the Kenyan market.

---

## ✅ What Has Been Created

### 1. **Kenyan Market Strategy Document** (`KENYAN_MARKET_STRATEGY.md`)
- Comprehensive roadmap for market readiness
- Pricing strategy (KES 999 - KES 4,999/month)
- Revenue projections (KES 10M+ ARR Year 1)
- Marketing and growth strategies
- Risk mitigation plans

### 2. **Pricing Page Component** (`components/pricing-page.tsx`)
- 4 pricing tiers optimized for Kenyan SMEs
- Pay-per-use option (KES 99/document)
- FAQ section
- Trust signals
- M-Pesa payment placeholders

### 3. **WhatsApp Support Button** (`components/whatsapp-button.tsx`)
- Floating button with pulsing animation
- Hover expansion effect
- Direct link to WhatsApp Business
- Mobile-optimized

---

## 🔧 Implementation Steps

### Step 1: Add Pricing Page to Navigation

**File:** `app/page.tsx`

Add the pricing case to the `renderContent()` function (around line 140):

```typescript
case "privacy":
  return \u003cPrivacyPolicyWizard /\u003e
case "pricing":
  return \u003cPricingPage /\u003e
case "settings":
  return (
    // ... existing settings code
  )
```

### Step 2: Add WhatsApp Button to Main Layout

**File:** `app/page.tsx`

Add the WhatsApp button import at the top:

```typescript
import WhatsAppButton from "@/components/whatsapp-button"
```

Then add it before the closing `\u003c/div\u003e` of the main container (around line 600):

```typescript
      {/* Wakili AI Chatbot - Floating */}
      \u003cWakiliChat /\u003e

      {/* WhatsApp Support Button */}
      \u003cWhatsAppButton /\u003e

      {/* Notification Detail Modal */}
```

### Step 3: Update WhatsApp Phone Number

**File:** `components/whatsapp-button.tsx`

Replace the placeholder phone number with your actual WhatsApp Business number:

```typescript
const phoneNumber = "254XXXXXXXXX" // Your actual number
```

---

## 💳 M-Pesa Integration (Critical for Kenyan Market)

### Prerequisites
1. Register for Safaricom Daraja API: https://developer.safaricom.co.ke/
2. Create an app and get:
   - Consumer Key
   - Consumer Secret
   - Passkey (for STK Push)

### Implementation Steps

#### 1. Install Dependencies

```bash
npm install axios
```

#### 2. Create M-Pesa Service

**File:** `lib/mpesa.ts`

```typescript
import axios from 'axios'

const CONSUMER_KEY = process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_MPESA_CONSUMER_SECRET
const PASSKEY = process.env.NEXT_PUBLIC_MPESA_PASSKEY
const SHORTCODE = process.env.NEXT_PUBLIC_MPESA_SHORTCODE

// Get OAuth token
export async function getMpesaToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  
  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  )
  
  return response.data.access_token
}

// Initiate STK Push
export async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
) {
  const token = await getMpesaToken()
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')
  
  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
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
}
```

#### 3. Create M-Pesa API Route

**File:** `app/api/mpesa/payment/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { initiateMpesaPayment } from '@/lib/mpesa'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, amount, plan } = await request.json()
    
    // Validate input
    if (!phoneNumber || !amount || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Initiate payment
    const result = await initiateMpesaPayment(
      phoneNumber,
      amount,
      `ComplyKe-${plan}`,
      `ComplyKe ${plan} Subscription`
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('M-Pesa payment error:', error)
    return NextResponse.json(
      { error: 'Payment initiation failed' },
      { status: 500 }
    )
  }
}
```

#### 4. Create M-Pesa Callback Route

**File:** `app/api/mpesa/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Log the callback for debugging
    console.log('M-Pesa Callback:', JSON.stringify(data, null, 2))
    
    // Extract payment details
    const { Body } = data
    const { stkCallback } = Body
    const { ResultCode, ResultDesc, CallbackMetadata } = stkCallback
    
    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata.Item
      const amount = metadata.find((item: any) =\u003e item.Name === 'Amount')?.Value
      const mpesaReceiptNumber = metadata.find((item: any) =\u003e item.Name === 'MpesaReceiptNumber')?.Value
      const phoneNumber = metadata.find((item: any) =\u003e item.Name === 'PhoneNumber')?.Value
      
      // TODO: Update database with payment info
      // - Mark subscription as active
      // - Store receipt number
      // - Send confirmation email
      
      console.log('Payment successful:', {
        amount,
        mpesaReceiptNumber,
        phoneNumber,
      })
    } else {
      // Payment failed
      console.log('Payment failed:', ResultDesc)
    }
    
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Failed' },
      { status: 500 }
    )
  }
}
```

#### 5. Update Pricing Page to Use M-Pesa

**File:** `components/pricing-page.tsx`

Update the `handleSelectPlan` function:

```typescript
const handleSelectPlan = async (planName: string, price: string) => {
  if (planName === "Free Trial") {
    alert("🎉 Free Trial Activated!")
    return
  }
  
  if (planName === "Enterprise") {
    alert("📞 Contact Sales\\n\\nEmail: sales@complyke.co.ke")
    return
  }
  
  // Get phone number from user
  const phoneNumber = prompt("Enter your M-Pesa phone number (254XXXXXXXXX):")
  
  if (!phoneNumber) return
  
  // Validate phone number
  if (!/^254[0-9]{9}$/.test(phoneNumber)) {
    alert("Invalid phone number. Please use format: 254XXXXXXXXX")
    return
  }
  
  try {
    // Initiate M-Pesa payment
    const response = await fetch('/api/mpesa/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        amount: parseInt(price.replace(',', '')),
        plan: planName,
      }),
    })
    
    const data = await response.json()
    
    if (data.ResponseCode === '0') {
      alert(`📱 M-Pesa STK Push Sent!\\n\\nCheck your phone and enter your M-Pesa PIN to complete payment.\\n\\nAmount: KES ${price}`)
    } else {
      alert(`❌ Payment failed: ${data.ResponseDescription}`)
    }
  } catch (error) {
    alert("❌ Payment initiation failed. Please try again.")
    console.error(error)
  }
}
```

#### 6. Add Environment Variables

**File:** `.env.local`

```env
# M-Pesa Credentials (Sandbox)
NEXT_PUBLIC_MPESA_CONSUMER_KEY=your_consumer_key
NEXT_PUBLIC_MPESA_CONSUMER_SECRET=your_consumer_secret
NEXT_PUBLIC_MPESA_PASSKEY=your_passkey
NEXT_PUBLIC_MPESA_SHORTCODE=174379

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
- Change sandbox URLs to production URLs
- Use production credentials
- Update shortcode to your production paybill number

---

## 🗄️ Database Setup (User Authentication \u0026 Data Persistence)

### Option 1: Supabase (Recommended)

#### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Get your project URL and anon key

#### 2. Install Supabase

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

#### 3. Create Supabase Client

**File:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 4. Create Database Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  kra_pin TEXT,
  industry TEXT,
  num_employees INTEGER,
  phone TEXT,
  location TEXT,
  subscription_plan TEXT DEFAULT 'free_trial',
  subscription_status TEXT DEFAULT 'active',
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table
CREATE TABLE public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  gross_salary NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  contract_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll calculations table
CREATE TABLE public.payroll_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gross_salary NUMERIC NOT NULL,
  housing_levy NUMERIC NOT NULL,
  shif NUMERIC NOT NULL,
  nssf NUMERIC NOT NULL,
  paye NUMERIC NOT NULL,
  net_pay NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy policies table
CREATE TABLE public.privacy_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  collects_phone BOOLEAN DEFAULT FALSE,
  uses_cctv BOOLEAN DEFAULT FALSE,
  policy_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  plan TEXT NOT NULL,
  mpesa_receipt TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contracts" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Repeat for other tables...
```

#### 5. Add Environment Variables

**File:** `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🔐 Authentication Setup

### 1. Create Auth Context

**File:** `contexts/auth-context.tsx`

```typescript
"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) =\u003e Promise\u003cvoid\u003e
  signUp: (email: string, password: string) =\u003e Promise\u003cvoid\u003e
  signOut: () =\u003e Promise\u003cvoid\u003e
}

const AuthContext = createContext\u003cAuthContextType | undefined\u003e(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState\u003cUser | null\u003e(null)
  const [loading, setLoading] = useState(true)

  useEffect(() =\u003e {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) =\u003e {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) =\u003e {
        setUser(session?.user ?? null)
      }
    )

    return () =\u003e subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) =\u003e {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) =\u003e {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () =\u003e {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    \u003cAuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}\u003e
      {children}
    \u003c/AuthContext.Provider\u003e
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 2. Create Login Page

**File:** `components/login-page.tsx`

```typescript
"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) =\u003e {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        alert('Check your email to confirm your account!')
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    \u003cdiv className="min-h-screen bg-navy-50 flex items-center justify-center p-4"\u003e
      \u003cCard className="w-full max-w-md"\u003e
        \u003cCardHeader className="text-center"\u003e
          \u003cdiv className="flex justify-center mb-4"\u003e
            \u003cdiv className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-900"\u003e
              \u003cShield className="h-8 w-8 text-white" /\u003e
            \u003c/div\u003e
          \u003c/div\u003e
          \u003cCardTitle className="text-2xl"\u003e
            {isLogin ? 'Welcome Back' : 'Create Account'}
          \u003c/CardTitle\u003e
          \u003cCardDescription\u003e
            {isLogin
              ? 'Sign in to access your compliance dashboard'
              : 'Start your 7-day free trial today'}
          \u003c/CardDescription\u003e
        \u003c/CardHeader\u003e
        \u003cCardContent\u003e
          \u003cform onSubmit={handleSubmit} className="space-y-4"\u003e
            \u003cdiv\u003e
              \u003clabel className="block text-sm font-medium text-navy-900 mb-2"\u003e
                Email
              \u003c/label\u003e
              \u003cInput
                type="email"
                value={email}
                onChange={(e) =\u003e setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              /\u003e
            \u003c/div\u003e
            \u003cdiv\u003e
              \u003clabel className="block text-sm font-medium text-navy-900 mb-2"\u003e
                Password
              \u003c/label\u003e
              \u003cInput
                type="password"
                value={password}
                onChange={(e) =\u003e setPassword(e.target.value)}
                placeholder="••••••••"
                required
              /\u003e
            \u003c/div\u003e
            \u003cButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            \u003e
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            \u003c/Button\u003e
          \u003c/form\u003e
          \u003cdiv className="mt-4 text-center"\u003e
            \u003cbutton
              onClick={() =\u003e setIsLogin(!isLogin)}
              className="text-sm text-navy-600 hover:text-navy-900"
            \u003e
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            \u003c/button\u003e
          \u003c/div\u003e
        \u003c/CardContent\u003e
      \u003c/Card\u003e
    \u003c/div\u003e
  )
}
```

---

## 📊 Analytics Setup

### Google Analytics

#### 1. Install Package

```bash
npm install @next/third-parties
```

#### 2. Add to Layout

**File:** `app/layout.tsx`

```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    \u003chtml lang="en"\u003e
      \u003cbody\u003e
        {children}
        \u003cGoogleAnalytics gaId="G-XXXXXXXXXX" /\u003e
      \u003c/body\u003e
    \u003c/html\u003e
  )
}
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key

# M-Pesa (Production)
NEXT_PUBLIC_MPESA_CONSUMER_KEY=your_production_key
NEXT_PUBLIC_MPESA_CONSUMER_SECRET=your_production_secret
NEXT_PUBLIC_MPESA_PASSKEY=your_production_passkey
NEXT_PUBLIC_MPESA_SHORTCODE=your_paybill_number

# App
NEXT_PUBLIC_APP_URL=https://complyke.vercel.app

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 📈 Marketing Checklist

### Pre-Launch
- [ ] Set up social media accounts (Twitter, Facebook, LinkedIn)
- [ ] Create demo video
- [ ] Prepare launch announcement
- [ ] Reach out to beta testers
- [ ] Set up email marketing (Mailchimp/SendGrid)

### Launch Day
- [ ] Post on social media
- [ ] Email beta users
- [ ] Post in Kenyan SME Facebook groups
- [ ] Post on Twitter with #KenyanSMEs #Compliance
- [ ] Reach out to tech bloggers

### Post-Launch
- [ ] Collect user feedback
- [ ] Monitor analytics
- [ ] Fix bugs quickly
- [ ] Respond to all support requests
- [ ] Iterate on features

---

## 💡 Quick Wins for Immediate Sellability

1. **Add Testimonials** (even if from beta testers)
2. **Create Demo Video** (screen recording with voiceover)
3. **Set up WhatsApp Business** (free and essential in Kenya)
4. **Add Trust Badges** ("Updated for 2025 Laws", "500+ Businesses Trust Us")
5. **Offer Free Trial** (7 days, no credit card required)
6. **Simple Pricing** (Clear, affordable, M-Pesa friendly)
7. **Fast Support** (Respond within 2 hours on WhatsApp)

---

## 📞 Support

For implementation help:
- Email: dev@complyke.co.ke
- WhatsApp: +254 700 123 456

---

*Last Updated: December 24, 2024*
