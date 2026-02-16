"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Wallet, BadgeCheck } from "lucide-react"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { useAuth } from "@/contexts/auth-context"

interface BillingSummary {
  profile: {
    subscription_plan: string | null
    subscription_status: string | null
    subscription_end_date: string | null
  }
  credits: {
    payroll: number
    scan: number
    contract: number
    privacy: number
  }
  payments: Array<{
    id: string
    amount: number
    plan: string
    status: string
    mpesa_receipt: string | null
    created_at: string
  }>
}

import { getSubscriptionStatus } from "@/lib/entitlements"

export default function BillingCredits() {
  const { showAlert } = useInstitutionalUI()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BillingSummary | null>(null)

  const isSuperAdmin = profile?.role === 'super-admin'

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/billing/summary')
      const payload = await res.json()
      if (!res.ok) {
        showAlert('Billing Error', payload.error || 'Failed to load billing summary.')
        return
      }
      setData(payload)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy-950 tracking-tight">Billing & Credits</h1>
          <p className="text-navy-600 font-medium">Track your active plan, credit balances, and payment history.</p>
        </div>
        <Button onClick={() => void load()} className="bg-navy-900 text-white hover:bg-navy-800">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-navy-700" />
            Subscription
          </CardTitle>
          <CardDescription>Current commercial status</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-navy-100 bg-white">
            <p className="text-xs text-navy-500 uppercase font-bold">Plan</p>
            <p className="text-lg font-black text-navy-900">{data?.profile.subscription_plan?.replace('_', ' ').toUpperCase() || 'FREE'}</p>
          </div>
          <div className="p-4 rounded-xl border border-navy-100 bg-white flex flex-col justify-between">
            <p className="text-xs text-navy-500 uppercase font-bold">Status</p>
            <div className="flex items-center gap-2 mt-1">
              {(() => {
                const status = getSubscriptionStatus(data?.profile.subscription_plan, data?.profile.subscription_end_date)
                if (status === 'active') return (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <BadgeCheck className="h-3 w-3 mr-1" /> Active
                  </span>
                )
                if (status === 'grace_period') return (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    Grace Period
                  </span>
                )
                if (isSuperAdmin) return (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-navy-950 text-white border border-navy-800">
                    <BadgeCheck className="h-3 w-3 mr-1" /> Institutional Active
                  </span>
                )
                return (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                    Locked
                  </span>
                )
              })()}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-navy-100 bg-white">
            <p className="text-xs text-navy-500 uppercase font-bold">Period Ends</p>
            <p className="text-sm font-bold text-navy-900">
              {data?.profile.subscription_end_date ? new Date(data.profile.subscription_end_date).toLocaleString('en-KE') : 'Never'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
            Feature Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Payroll', data?.credits.payroll ?? 0],
            ['Scan', data?.credits.scan ?? 0],
            ['Contract', data?.credits.contract ?? 0],
            ['Privacy', data?.credits.privacy ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="p-4 rounded-xl border border-navy-100 bg-navy-50">
              <p className="text-xs text-navy-500 uppercase font-bold">{label}</p>
              <p className="text-2xl font-black text-navy-900">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-white">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-navy-500">Loading...</p>}
          {!loading && (data?.payments.length || 0) === 0 && (
            <p className="text-sm text-navy-500">No payments found.</p>
          )}
          {(data?.payments || []).map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-navy-100">
              <p className="text-sm font-bold text-navy-900">
                KES {Number(p.amount || 0).toLocaleString()} • {p.plan} • {p.status}
              </p>
              <p className="text-xs text-navy-500">
                Receipt: {p.mpesa_receipt || 'Pending'} • {new Date(p.created_at).toLocaleString('en-KE')}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
