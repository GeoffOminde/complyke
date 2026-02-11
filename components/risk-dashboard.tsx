"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, Shield, Activity, Lock, Users, Receipt } from "lucide-react"
import ComplianceBadges from "@/components/compliance-badges"
import KRAPINChecker from "@/components/kra-pin-checker"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useInstitutionalUI } from "@/contexts/ui-context"

import DocumentPreviewModal from "@/components/document-preview-modal"
import { downloadAsWord } from "@/lib/download-helpers"

interface ComplianceItem {
    id: string
    label: string
    completed: boolean
    icon: React.ReactNode
}

export default function RiskDashboard() {
    const { user, profile } = useAuth()
    const { showToast, showAlert } = useInstitutionalUI()
    const [loading, setLoading] = useState(true)
    const [previewDoc, setPreviewDoc] = useState<{ isOpen: boolean; title: string; content: string; type: 'contract' | 'policy' }>({
        isOpen: false,
        title: '',
        content: '',
        type: 'contract'
    })

    const isEnterprise = profile?.subscription_plan === 'enterprise' || profile?.role === 'super-admin'
    const isSME = profile?.subscription_plan === 'sme-power' || isEnterprise || profile?.role === 'super-admin'
    const isSuperAdmin = profile?.role === 'super-admin' || user?.email?.toLowerCase() === 'geoffominde8@gmail.com' // Authorized Administrator Override

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
                // Check Contracts
                const { count: contractCount } = await supabase
                    .from('contracts')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                // Check Payroll
                const { count: payrollCount } = await supabase
                    .from('payroll_calculations')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                // Check Policies
                const { count: policyCount } = await supabase
                    .from('privacy_policies')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                // Update items
                setComplianceItems(prev => prev.map(item => {
                    if (item.id === 'contracts') return { ...item, completed: (contractCount || 0) > 0 }
                    if (item.id === 'housing' || item.id === 'sha') return { ...item, completed: (payrollCount || 0) > 0 }
                    if (item.id === 'data') return { ...item, completed: (policyCount || 0) > 0 }
                    return item
                }))
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
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

    // Hardening: Ensure Super Admin always 100% even if data is missing
    const healthScore = isSuperAdmin ? 100 : Math.round((completedCount / totalCount) * 100)

    const isAtRisk = healthScore < 75

    const handlePreviewFromVault = async (id: string, type: 'contract' | 'policy') => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from(type === 'contract' ? 'contracts' : 'privacy_policies')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error || !data) {
                showAlert('Vault Error', 'No archived instruments found. Please generate a document first.')
                return
            }

            setPreviewDoc({
                isOpen: true,
                title: type === 'contract' ? 'Institutional Employment Contract' : 'Privacy & Data Governance Policy',
                content: type === 'contract' ? data.contract_content : data.policy_content,
                type
            })
        } catch (err) {
            console.error('Handshake error:', err)
        }
    }

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
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-navy-100 shadow-sm">
                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-navy-800 uppercase tracking-widest">Live Monitoring</span>
                </div>
            </div>

            {/* Health Score Card */}
            <Card className="glass-card border-none overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 -mr-20 -mt-20 ${isAtRisk ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <CardHeader>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <CardTitle className="text-xl font-bold text-navy-900">Compliance Health Score</CardTitle>
                            <CardDescription className="font-medium text-navy-500">
                                Global status across 2026 Kenyan statutes
                            </CardDescription>
                        </div>
                        <div className={`p-4 rounded-2xl ${isAtRisk ? 'bg-rose-50/50 text-rose-600' : 'bg-emerald-50/50 text-emerald-600'}`}>
                            <Shield className="h-8 w-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="flex items-baseline gap-4">
                        <div className={`text-7xl font-black tracking-tighter ${isAtRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {healthScore}%
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-navy-800 uppercase tracking-wide">
                                {isSuperAdmin ? 'Institutional Safe' : isAtRisk ? 'Attention Required' : 'Institutional Safety'}
                            </p>
                            <p className="text-xs text-navy-400 font-medium font-mono" suppressHydrationWarning>
                                Audit ID: {auditId || "STABILIZING..."}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8 h-4 w-full overflow-hidden rounded-full bg-navy-50 border border-navy-100 shadow-inner">
                        <div
                            className={`h-full transition-all duration-1000 ease-out shadow-lg ${isAtRisk ? 'bg-alert-gradient' : 'bg-success-gradient'}`}
                            style={{ width: `${healthScore}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Compliance Checklist - Left 2 Columns */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl bg-white">
                        <CardHeader className="border-b border-navy-50">
                            <CardTitle className="text-lg">Critical Compliance Items</CardTitle>
                            <CardDescription className="font-medium">Mandatory tasks to reach 100% safety</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                {complianceItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-300 group ${item.completed
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

                    {/* Risk Alert / Success */}
                    {isAtRisk ? (
                        <Card className="bg-alert-gradient text-white border-none shadow-xl animate-pulse-slow">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg uppercase tracking-tight">Statutory Liability Risk</h4>
                                        <p className="mt-1 text-sm text-rose-100 leading-relaxed">
                                            Your business is currently exposed to potential KRA and ODPC audits. Complete the remaining items to lock in your "Protected" status for Q1 2026.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-success-gradient text-white border-none shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg uppercase tracking-tight">Institutional Safety Locked</h4>
                                        <p className="mt-1 text-sm text-emerald-100 leading-relaxed">
                                            All critical compliance tasks are verified. Your 2026 status is healthy. We'll alert you if government regulations change.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* PIN Validator - Right Column */}
                <div className="space-y-6">
                    <KRAPINChecker />
                    <div className="p-6 bg-navy-950 rounded-3xl border border-navy-800 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">ComplyKe Pro</p>
                            <h3 className="text-xl font-bold text-white mb-2">Automated Filing</h3>
                            <p className="text-xs text-navy-400 leading-relaxed mb-6">
                                Connect your iTax account to automate your monthly PAYE and SHIF remittances.
                            </p>
                            <button
                                onClick={() => {
                                    if (isEnterprise) {
                                        showToast('🚀 Beta enrollment requested! We will contact you soon.', 'info')
                                    } else {
                                        showAlert("Tier Restricted", "Automated iTax Filing is an Enterprise-grade feature. Please upgrade your protocol in the Pricing console.")
                                    }
                                }}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${isEnterprise ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-950/20' : 'bg-navy-800 text-navy-400 cursor-not-allowed opacity-50'}`}
                            >
                                {isEnterprise ? 'Enroll in Beta' : 'Upgrade to Unlock'}
                            </button>
                        </div>
                        <Receipt className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5" />
                    </div>

                    {/* Cloud Vault Preview */}
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-navy-50 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-navy-900" />
                                <CardTitle className="text-sm uppercase tracking-widest">Cloud Vault</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-navy-50">
                                <div
                                    onClick={() => handlePreviewFromVault('latest-contract', 'contract')}
                                    className="p-4 hover:bg-navy-50/50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-navy-900 truncate">Employment Contract (Draft)</p>
                                            <p className="text-[10px] text-navy-400">Ready for signing</p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    onClick={() => handlePreviewFromVault('latest-policy', 'policy')}
                                    className="p-4 hover:bg-navy-50/50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-navy-900 truncate">Privacy Policy Instrument</p>
                                            <p className="text-[10px] text-navy-400">DPA 2019 Compliant</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-navy-50/50">
                                <button
                                    onClick={() => {
                                        if (!isSME) {
                                            showAlert("Institutional Limit", "Cloud Vault archival history is available for SME Power and Enterprise protocols only.")
                                        }
                                    }}
                                    className={`w-full py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isSME ? 'text-navy-900 hover:text-navy-600' : 'text-navy-300'}`}
                                >
                                    {isSME ? 'View Full Archive' : 'Upgrade to View History'}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Forensic Preview Modal */}
            <DocumentPreviewModal
                isOpen={previewDoc.isOpen}
                onClose={() => setPreviewDoc(prev => ({ ...prev, isOpen: false }))}
                title={previewDoc.title}
                content={previewDoc.content}
                type={previewDoc.type}
                onDownloadWord={() => downloadAsWord(previewDoc.content, previewDoc.title.replace(/\s+/g, '_'))}
                onDownloadPDF={async () => {
                    const { downloadAsPDF } = await import('@/lib/download-helpers')
                    await downloadAsPDF(previewDoc.content, previewDoc.title.replace(/\s+/g, '_'))
                }}
            />

            {/* Compliance Badges Footer */}
            <div className="pt-8 border-t border-navy-100">
                <div className="flex items-center gap-2 mb-6">
                    <Shield className="h-5 w-5 text-navy-900" />
                    <h3 className="text-xs uppercase font-black tracking-tighter text-navy-900">Your Trust Certifications</h3>
                </div>
                <ComplianceBadges />
            </div>
        </div>
    )
}
