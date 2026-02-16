"use client"

import { useState } from "react"
import {
  X,
  Zap,
  Building2,
  Rocket,
  CreditCard,
  Smartphone,
  ArrowRight,
  BadgeCheck,
  Scale,
  Shield,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { useAuth } from "@/contexts/auth-context"
import { getPlanPrivileges } from "@/lib/entitlements"
import type { PlanCode } from "@/lib/entitlements"

type PricingPlan = {
  name: string
  price: string
  description: string
  icon: LucideIcon
  color: string
  features: string[]
  limitations: string[]
  cta: string
  planCode?: PlanCode
  popular?: boolean
}

export default function PricingPage() {
  const { user } = useAuth()
  const { showToast, showConfirm, showPrompt, showAlert } = useInstitutionalUI()
  const [loading, setLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  const plans = [
    {
      name: "Institutional Trial",
      price: "0",
      description: "Risk-free statutory evaluation",
      icon: Zap,
      color: "emerald",
      features: [
        "Full Statutory Audit Suite",
        "Unlimited Calculations",
        "Document Synthesis",
        "Priority Email Access",
      ],
      limitations: [
        "7-day trial window",
        "No archival persistence",
      ],
      cta: "Initiate Trial",
      planCode: "trial",
      badge: "Evaluation",
    },
    {
      name: "Micro-Entity",
      price: "2,500",
      description: "Core compliance for small teams",
      icon: Building2,
      color: "navy",
      features: [
        "Up to 5 Fixed Employees",
        "Unlimited Payroll Audits",
        "Contract Synthesizer",
        "Privacy Policy Wizard",
        "Tax Lens Scanner",
        "Monthly Compliance Ledger",
      ],
      limitations: [
        "Email-only resolution",
      ],
      cta: "Select Protocol",
      planCode: "micro-entity",
    },
    {
      name: "Institutional SME",
      price: "7,500",
      description: "Comprehensive statutory automation",
      icon: Rocket,
      color: "blue",
      features: [
        "Up to 50 Active Employees",
        "Everything in Micro-Entity",
        "Bulk Governance Tools",
        "Automated Disbursements",
        "WhatsApp Concierge",
        "SMS Statutory Reminders (Active)",
      ],
      limitations: [],
      cta: "Scale Compliance",
      popular: true,
      planCode: "institutional-sme",
    },
    {
      name: "Institutional Elite",
      price: "19,500",
      description: "Advanced autonomy for larger entities",
      icon: Scale,
      color: "navy",
      features: [
        "Up to 200 Active Employees",
        "Everything in SME Power",
        "Bulk Export Engine (High Speed)",
        "Direct iTax Integration (Beta Access)",
        "Custom Audit Reporting",
        "API Governance Access",
      ],
      limitations: [],
      cta: "Engage Elite",
      planCode: "institutional-elite",
    },
    {
      name: "Conglomerate",
      price: "49,500",
      description: "Unlimited scale and custom governance",
      icon: Shield,
      color: "emerald",
      features: [
        "Unlimited Headcount (200+)",
        "Dedicated Compliance Officer",
        "Private Cloud Vault Subnet",
        "Unlimited Bulk Processing",
        "Multi-Entity Management",
        "White-label Reporting",
      ],
      limitations: [],
      cta: "Connect via Counsel",
      planCode: "conglomerate",
    },
  ]

  const handleSelectPlan = async (plan: PricingPlan, amount: number) => {
    if (!plan.planCode) {
      showAlert("Plan Error", "Unsupported plan selected.")
      return
    }

    if (plan.planCode === "trial" || plan.planCode === "free_trial") {
      showConfirm(
        "Activate Trial Protocol?",
        "This will initialize a 7-day statutory evaluation of your institutional risk. Are you ready to proceed?",
        async () => {
          if (!user) {
            showAlert("Authentication Required", "Please sign in to initialize your institutional trial.")
            return
          }
          try {
            setLoading(true)
            const res = await fetch('/api/subscription/activate-trial', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) {
              showAlert("Vault Sync Error", data.error || "Failed to initialize trial.")
              return
            }
            showToast("Trial Protocol Activated. Vault synchronized.", "success")
            setTimeout(() => window.location.reload(), 800)
          } finally {
            setLoading(false)
          }
        },
        "Initialize Trial",
        "Maintain Status Quo"
      )
      return
    }

    if (!user) {
      showAlert("Authentication Required", "Please sign in to purchase a plan.")
      return
    }

    showPrompt(
      "Financial Authorization",
      "To initiate secure M-Pesa STK push, enter your M-Pesa phone number. Your plan activates automatically after callback confirmation.",
      async (phoneNumber) => {
        if (!phoneNumber || !user) return
        setLoading(true)

        try {
          showToast("Processing M-Pesa Handshake...", "info")
          const res = await fetch('/api/mpesa/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber,
              amount,
              plan: plan.planCode,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            showAlert("Payment Error", data.message || data.error || "Failed to initiate M-Pesa payment.")
            return
          }
          showToast(`STK sent. ${plan.name} will activate after you accept the prompt.`, "success")
        } finally {
          setLoading(false)
        }
      },
      "254..."
    )
  }

  const handlePayPerUse = (itemLabel: string, price: string) => {
    const featurePlanCode: Record<string, string> = {
      Contract: 'ppu-contract',
      Payroll: 'ppu-payroll',
      Privacy: 'ppu-privacy',
      'Scan/OCR': 'ppu-scan',
    }
    const plan = featurePlanCode[itemLabel]
    const amount = Number(price.replace(/,/g, ''))
    if (!plan) {
      showAlert("Plan Error", "Unsupported pay-per-use item.")
      return
    }

    showPrompt(
      "Single-Use Authorization",
      `Initiate KES ${price} M-Pesa transaction for one-time ${itemLabel} credit?`,
      async (phoneNumber) => {
        if (!phoneNumber || !user) return
        setLoading(true)
        try {
          showToast("Processing Liquidity Transfer...", "info")
          const res = await fetch('/api/mpesa/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber,
              amount,
              plan,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            showAlert("Payment Error", data.message || data.error || "Failed to initiate M-Pesa payment.")
            return
          }
          showToast(`STK sent. ${itemLabel} credit will be added after payment callback.`, "success")
        } finally {
          setLoading(false)
        }
      },
      "254..."
    )
  }

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Strategy Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-4 animate-bounce-subtle">
          <BadgeCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">2026 Statutory Ready</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-navy-950 tracking-tight leading-[1.1]">
          Institutional <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-900 via-navy-600 to-navy-900">Billing Console</span>
        </h1>
        <p className="text-lg text-navy-600 font-medium max-w-2xl mx-auto leading-relaxed">
          Select a governance protocol tailored to your operational scale. All plans include real-time legal engine updates.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-navy-950' : 'text-navy-400'}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-16 h-8 rounded-full bg-navy-100 relative p-1 transition-all"
          >
            <div className={`w-6 h-6 rounded-full bg-navy-950 shadow-lg transition-all transform ${billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold transition-colors ${billingCycle === 'annual' ? 'text-navy-950' : 'text-navy-400'}`}>Annually</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest">Safe 20%</span>
          </div>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
        {plans.map((plan) => {
          const Icon = plan.icon
          const numericPrice = billingCycle === 'annual' ? Math.floor(parseInt(plan.price.replace(',', '')) * 0.8) : parseInt(plan.price.replace(',', ''))
          const price = numericPrice.toLocaleString()
          const privileges = getPlanPrivileges(plan.planCode || '')

          return (
            <div key={plan.name} className="h-full">
              <Card
                className={`group relative border-none overflow-hidden transition-all duration-500 hover:scale-[1.02] h-full min-h-[520px] flex flex-col ${plan.popular ? 'shadow-[0_40px_80px_rgba(0,0,0,0.12)] bg-navy-950 text-white' : 'glass-card'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest z-10 shadow-lg">
                    Primary Plan
                  </div>
                )}
                <CardHeader className="p-8 pb-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:rotate-12 ${plan.popular ? 'bg-white/10' : 'bg-navy-50 text-navy-600'}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className={`text-xl font-black uppercase tracking-tight ${plan.popular ? 'text-white' : 'text-navy-950'}`}>{plan.name}</h3>
                  <p className={`text-xs font-medium mt-1 ${plan.popular ? 'text-navy-400' : 'text-navy-500'}`}>{plan.description}</p>
                  <div className="mt-8 flex items-baseline gap-2">
                    <span className="text-sm font-black opacity-50 uppercase">KES</span>
                    <span className="text-4xl font-black">{price}</span>
                    <span className="text-xs font-bold opacity-40">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-6 flex flex-col gap-6 h-full">
                  <Button
                    onClick={() => handleSelectPlan(plan, numericPrice)}
                    disabled={loading}
                    className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all ${plan.popular ? 'bg-white text-navy-950 hover:bg-emerald-50 shadow-emerald-950/20' : 'bg-navy-950 text-white hover:bg-navy-800 shadow-navy-200'}`}
                  >
                    {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${plan.popular ? 'text-navy-500' : 'text-navy-400'}`}>Tier Privileges</p>
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${plan.popular ? 'bg-emerald-400' : 'bg-navy-900'}`} />
                          <span className={`text-[11px] font-semibold leading-relaxed ${plan.popular ? 'text-navy-300' : 'text-navy-700'}`}>{feature}</span>
                        </div>
                      ))}
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start gap-3 opacity-40">
                          <X className={`h-4 w-4 shrink-0 ${plan.popular ? 'text-white' : 'text-navy-400'}`} />
                          <span className={`text-[11px] font-bold line-through ${plan.popular ? 'text-white' : 'text-navy-950'}`}>{limitation}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${privileges.privateVaultSubnet ? 'text-emerald-600' : 'text-rose-600'}`}>Vault Subnet</span>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${privileges.complianceOfficer ? 'text-emerald-600' : 'text-rose-600'}`}>Compliance Officer</span>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${privileges.multiEntityManagement ? 'text-emerald-600' : 'text-rose-600'}`}>Multi-Entity</span>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${privileges.whiteLabelReporting ? 'text-emerald-600' : 'text-rose-600'}`}>White-label</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Pay-Per-Audit Strip */}
      <div className="relative p-12 rounded-[48px] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-navy-700">
              <CreditCard className="h-3 w-3 text-emerald-400" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Instant Liquidity Plan</span>
            </div>
            <h2 className="text-3xl font-black text-white">Dynamic Audit Engine</h2>
            <p className="text-navy-400 text-sm font-medium max-w-md leading-relaxed">
              Bypass subscriptions. Deploy our audit engine per transaction with institutional precision.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            {[
              { label: "Contract", price: "999" },
              { label: "Payroll", price: "499" },
              { label: "Privacy", price: "999" },
              { label: "Scan/OCR", price: "299" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handlePayPerUse(item.label, item.price)}
                disabled={loading}
                className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
              >
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-xl font-black text-white">
                  <span className="text-[10px] opacity-30 mr-1">KES</span>{item.price}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Institutional FAQ */}
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tight">Governance Intelligence</h2>
          <p className="text-navy-500 font-medium mt-2 italic">Standard inquiries regarding institutional operations</p>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          {[
            { q: "Execution Methods?", a: "We support M-Pesa STK Push and secure bank transfers for Enterprise accounts." },
            { q: "Statutory Validity?", a: "Every calculation is verified against the 2026 Kenya Gazette and KRA technical circulars." },
            { q: "Termination?", a: "Corporate protocols can be terminated at any interval with 100% data portability." },
            { q: "Liability Insurance?", a: "Our Enterprise tier includes compliance liability guarantees up to specified limits." },
          ].map((item) => (
            <div key={item.q} className="space-y-3">
              <h4 className="flex items-center gap-3 font-black text-navy-950 uppercase tracking-tight text-sm">
                <div className="h-1 w-4 bg-emerald-500" /> {item.q}
              </h4>
              <p className="text-[13px] text-navy-600 font-medium leading-relaxed pl-7 border-l border-navy-100">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Support Terminal */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-[40px] bg-navy-50 border border-navy-100">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="h-16 w-16 rounded-[24px] bg-white shadow-xl flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-navy-900" />
          </div>
          <div>
            <h4 className="text-xl font-black text-navy-950">Concierge Support</h4>
            <p className="text-sm text-navy-500 font-medium">Connect with an institutional advisor via encrypted channel.</p>
          </div>
        </div>
        <Button className="h-14 px-10 rounded-2xl bg-white border-2 border-navy-950 text-navy-950 font-black uppercase text-xs hover:bg-navy-950 hover:text-white transition-all">
          Initialize WhatsApp Channel
        </Button>
      </div>
    </div>
  )
}

