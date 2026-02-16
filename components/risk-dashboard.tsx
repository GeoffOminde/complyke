"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, Shield, Activity, Lock, Users, Receipt } from "lucide-react"
import { getPlanPrivileges } from "@/lib/entitlements"
import ComplianceBadges from "@/components/compliance-badges"
import KRAPINChecker from "@/components/kra-pin-checker"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { Button } from "@/components/ui/button"

import DocumentPreviewModal from "@/components/document-preview-modal"
import { downloadAsWord } from "@/lib/download-helpers"

interface ComplianceItem {
    id: string
    label: string
    completed: boolean
    icon: React.ReactNode
}

interface ArchiveResponse {
    contracts: Array<{ id: string; employee_name: string; job_title: string; created_at: string }>
    policies: Array<{ id: string; company_name: string; created_at: string }>
    payroll: Array<{ id: string; gross_salary: number; net_pay: number; created_at: string }>
    payments: Array<{ id: string; amount: number; plan: string; status: string; mpesa_receipt: string | null; created_at: string }>
}

export default function RiskDashboard({ onOpenCompliance }: { onOpenCompliance?: () => void }) {
    const { user, profile } = useAuth()
    const { showToast, showAlert } = useInstitutionalUI()
    const [previewDoc, setPreviewDoc] = useState<{ isOpen: boolean; title: string; content: string; type: 'contract' | 'policy' }>({
        isOpen: false,
        title: '',
        content: '',
        type: 'contract'
    })
    const [showArchiveModal, setShowArchiveModal] = useState(false)
    const [archiveLoading, setArchiveLoading] = useState(false)
    const [archiveData, setArchiveData] = useState<ArchiveResponse>({
        contracts: [],
        policies: [],
        payroll: [],
        payments: [],
    })

    const isEnterprise = profile?.subscription_plan === 'enterprise' || profile?.role === 'super-admin'
    const isSME = profile?.subscription_plan === 'sme-power' || isEnterprise || profile?.role === 'super-admin'
    const isSuperAdmin = profile?.role === 'super-admin'
    const planPrivileges = getPlanPrivileges(profile?.subscription_plan)

    const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
        { id: "sha", label: "SHA/SHIF Registration", completed: false, icon: <Shield className="h-4 w-4" /> },
        { id: "housing", label: "Housing Levy Compliance", completed: false, icon: <Receipt className="h-4 w-4" /> },
        { id: "data", label: "Data Protection Policy", completed: false, icon: <Lock className="h-4 w-4" /> },
        { id: "contracts", label: "Employee Contracts", completed: false, icon: <Users className="h-4 w-4" /> },
    ])

    const [auditId, setAuditId] = useState<string>("CKE-INIT")

    useEffect(() => {
        setAuditId(`CKE-DASH-${new Date().getTime().toString(16).toUpperCase()}`)

        async function fetchComplianceStatus() {
            if (!user) return

            try {
                const { count: contractCount } = await supabase
                    .from('contracts')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                const { count: payrollCount } = await supabase
                    .from('payroll_calculations')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                const { count: policyCount } = await supabase
                    .from('privacy_policies')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                setComplianceItems(prev => prev.map(item => {
                    if (item.id === 'contracts') return { ...item, completed: (contractCount || 0) > 0 }
                    if (item.id === 'housing' || item.id === 'sha') return { ...item, completed: (payrollCount || 0) > 0 }
                    if (item.id === 'data') return { ...item, completed: (policyCount || 0) > 0 }
                    return item
                }))
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            }
        }

        fetchComplianceStatus()
    }, [user])

    const toggleItem = (id: string) => {
        setComplianceItems(items =>
            items.map(item =>
                item.id === id ? { ...item, completed: !item.completed } : item
            )
        )
    }

    const completedCount = complianceItems.filter(item => item.completed).length
    const totalCount = complianceItems.length
    const healthScore = isSuperAdmin ? 100 : Math.round((completedCount / totalCount) * 100)
    const isAtRisk = healthScore < 75

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tight">
                        {isSuperAdmin ? 'Institutional Command' : 'Risk Dashboard'}
                    </h1>
                    <p className="text-navy-600 font-medium">
                        {isSuperAdmin ? 'Full Statutory Override Active' : 'Monitoring your business compliance in real-time'}
                    </p>
                    <div className="flex gap-3 mt-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${planPrivileges.privateVaultSubnet ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Vault Subnet
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${planPrivileges.includesTaxLens ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Tax Lens
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${planPrivileges.multiEntityManagement ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Multi-Entity
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-navy-100 shadow-sm">
                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-navy-800 uppercase tracking-widest">Live Monitoring</span>
                </div>
            </div>

            {/* Health Score Card */}
            <Card className="glass-card border-none overflow-hidden relative shadow-2xl bg-white/50 backdrop-blur-xl">
                <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-10 -mr-20 -mt-20 ${isAtRisk ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <CardContent className="p-8 md:p-12 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Score Section */}
                        <div className="text-center md:text-left space-y-2">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <div className={`p-3 rounded-2xl ${isAtRisk ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    <Shield className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-navy-900">Compliance Health</h3>
                                    <p className="text-xs text-navy-500 font-medium">Global Status Check</p>
                                </div>
                            </div>
                            <div className="flex items-baseline justify-center md:justify-start gap-2">
                                <span className={`text-8xl font-black tracking-tighter ${isAtRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {healthScore}<span className="text-4xl">%</span>
                                </span>
                            </div>
                            <p className={`text-sm font-black uppercase tracking-widest ${isAtRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isSuperAdmin ? 'Institutional Safe' : isAtRisk ? 'Attention Required' : 'statutory Compliant'}
                            </p>
                        </div>

                        {/* Action & Progress Section */}
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold text-navy-600 uppercase tracking-wide">
                                    <span>Audit Progress</span>
                                    <span>{healthScore}/100</span>
                                </div>
                                <div className="h-4 w-full overflow-hidden rounded-full bg-navy-50 border border-navy-100/50">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out shadow-lg ${isAtRisk ? 'bg-alert-gradient' : 'bg-success-gradient'}`}
                                        style={{ width: `${healthScore}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-navy-400 font-mono text-right" suppressHydrationWarning>
                                    REF: {auditId || "SYNCING..."}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={onOpenCompliance}
                                    className="h-14 border-navy-100 text-navy-600 font-bold uppercase tracking-wider text-xs hover:bg-navy-50"
                                >
                                    View Report
                                </Button>
                                <Button
                                    onClick={onOpenCompliance}
                                    className="h-14 px-8 bg-navy-950 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    Execute Protocol Audit
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-white">
                        <CardHeader className="border-b border-navy-50">
                            <CardTitle className="text-lg">Critical Compliance Items</CardTitle>
                            <CardDescription className="font-medium">Mandatory tasks to reach 100% safety</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                {complianceItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300 group min-h-[100px] ${item.completed
                                            ? 'border-emerald-100 bg-emerald-50/50'
                                            : 'border-navy-50 bg-white hover:border-navy-200 hover:shadow-md active:scale-95'
                                            }`}
                                    >
                                        <div
                                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all group-hover:scale-110 ${item.completed
                                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                                : 'border-navy-100 bg-navy-50 text-navy-400'
                                                }`}
                                        >
                                            {item.completed ? (
                                                <CheckCircle2 className="h-6 w-6" />
                                            ) : (
                                                item.icon
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black truncate ${item.completed ? 'text-emerald-900 line-through opacity-50' : 'text-navy-900'}`}>
                                                {item.label}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold text-navy-400 mt-0.5">
                                                {item.completed ? 'Verified' : 'Pending Action'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-navy-950 text-white border-none shadow-xl relative overflow-hidden group min-h-[160px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 animate-pulse" />
                        <CardHeader className="relative z-10 pb-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-500 border border-white/5">
                                    <Receipt className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-tight text-white">Fuel Levy Audit</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">eTIMS Mandate Active</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-4">
                            <p className="text-[11px] text-navy-200 leading-relaxed font-medium">
                                <span className="text-white font-bold">New Regulation:</span> Petrol stations must now issue eTIMS receipts. Non-compliant fuel expenses are <span className="underline decoration-rose-500 decoration-2">non-deductible</span>.
                            </p>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                <span className="text-[10px] font-bold text-navy-300 uppercase">Feb Cycle Coverage</span>
                                <span className="text-lg font-black text-white">0%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {isAtRisk ? (
                        <Card className="bg-alert-gradient text-white border-none shadow-xl min-h-[160px]">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-tight">Statutory Liability Risk</h4>
                                        <p className="mt-1 text-sm text-rose-100 leading-relaxed">
                                            Your business is currently exposed to potential KRA and ODPC audits. Complete the remaining items to lock in your &quot;Protected&quot; status for Q1 2026.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-success-gradient text-white border-none shadow-xl min-h-[160px]">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-tight">Institutional Safety Locked</h4>
                                        <p className="mt-1 text-sm text-emerald-100 leading-relaxed">
                                            All critical compliance tasks are verified. We&apos;ll alert you if government regulations change.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-6">
                        <KRAPINChecker />
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <ComplianceBadges />
            </div>

            <DocumentPreviewModal
                isOpen={previewDoc.isOpen}
                onClose={() => setPreviewDoc(prev => ({ ...prev, isOpen: false }))}
                title={previewDoc.title}
                content={previewDoc.content}
                type={previewDoc.type}
            />
        </div>
    )
}
