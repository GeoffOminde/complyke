"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { getPlanPrivileges } from "@/lib/entitlements"
import { Shield, Lock, CreditCard, Activity, Server, Database, CheckCircle2, XCircle, AlertTriangle, Key } from "lucide-react"

export default function SettingsPage() {
    const { profile, user } = useAuth()
    const { showToast } = useInstitutionalUI()
    const planPrivileges = getPlanPrivileges(profile?.subscription_plan)
    const [isLoading, setIsLoading] = useState(false)
    const [schemaStatus, setSchemaStatus] = useState<{
        vault: boolean
        revenue: boolean
        audit: boolean
        notifications: boolean
        hasRun: boolean
    }>({
        vault: false,
        revenue: false,
        audit: false,
        notifications: false,
        hasRun: false
    })
    const [serviceStatus, setServiceStatus] = useState<Array<{
        id: string
        label: string
        supported: boolean
        enabled: boolean
        info: string | null
        updated_at: string | null
    }>>([])
    const [serviceLoading, setServiceLoading] = useState(false)

    const StatusIndicator = ({ isActive }: { isActive: boolean }) => {
        if (!schemaStatus.hasRun) return (
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-navy-300"></span>
                <span className="text-[10px] font-bold text-navy-400 uppercase">Pending Check</span>
            </div>
        )
        if (isActive) return (
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
            </div>
        )
        return (
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="text-[10px] font-bold text-rose-600 uppercase">Missing</span>
            </div>
        )
    }

    const handleSchemaCheck = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/system/schema-check')
            if (!res.ok) throw new Error('Schema check failed')

            const data = await res.json()
            setSchemaStatus({
                vault: !!data.vault,
                revenue: !!data.revenue,
                audit: !!data.audit,
                notifications: !!data.notifications,
                hasRun: true
            })
            showToast("Schema Validation Complete: Statutory Tables Verified", "success")
        } catch (error) {
            console.error(error)
            showToast("Schema Check Failed: Infrastructure Unreachable", "error")
        } finally {
            setIsLoading(false)
        }
    }

    const loadServiceStatus = async () => {
        if (!profile?.id) return
        setServiceLoading(true)
        try {
            const res = await fetch('/api/system/enterprise-services')
            if (!res.ok) throw new Error('Failed to load service status')
            const data = await res.json()
            setServiceStatus(data.services || [])
        } catch (error) {
            console.error(error)
        } finally {
            setServiceLoading(false)
        }
    }

    const handleEnableService = async (serviceId: string) => {
        setServiceLoading(true)
        try {
            const res = await fetch('/api/system/enterprise-services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service: serviceId })
            })
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}))
                throw new Error(payload.error || 'Service activation failed')
            }
            const data = await res.json()
            setServiceStatus(data.services || [])
            showToast('Service activated', 'success')
        } catch (error: unknown) {
            showToast('Service Error', error instanceof Error ? error.message : 'Unable to activate service')
        } finally {
            setServiceLoading(false)
        }
    }

    useEffect(() => {
        if (profile?.role === 'super-admin') {
            handleSchemaCheck()
        }
    }, [profile?.role])

    useEffect(() => {
        if (profile?.id) {
            loadServiceStatus()
        }
    }, [profile?.id])

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-navy-950 tracking-tight flex items-center gap-3">
                    System Configuration
                    <span className="text-[10px] bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Admin Protocol</span>
                </h1>
                <p className="text-navy-600 font-medium mt-2">Manage RBAC permissions, audit logs, and infrastructure health.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* RBAC Transparency Panel */}
                <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-navy-50/50 border-b border-navy-50 p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-lg">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-navy-950 uppercase tracking-tight">Access Control (RBAC)</CardTitle>
                                <CardDescription className="text-xs font-bold text-navy-400 uppercase tracking-widest">Current Session Privileges</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-navy-50">
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-navy-500 uppercase tracking-widest">Assigned Role</p>
                                    <p className="text-lg font-black text-navy-950 mt-1">{profile?.role === 'super-admin' ? 'System Administrator' : 'Institutional User'}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${profile?.role === 'super-admin' ? 'bg-purple-100 text-purple-700' : 'bg-navy-100 text-navy-600'}`}>
                                    {profile?.role === 'super-admin' ? 'Root Protocol' : 'Standard Entity'}
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-4">Feature Permissions</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                            </div>
                                            <span className="text-xs font-bold text-navy-700">Contract Generator</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                            </div>
                                            <span className="text-xs font-bold text-navy-700">Payroll Engine</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {(profile?.subscription_plan === 'micro-entity' || profile?.role === 'super-admin') ? (
                                                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                </div>
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <Key className="h-3.5 w-3.5 text-amber-600" />
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-navy-700">Tax Lens (OCR)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {profile?.role === 'super-admin' ? (
                                                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                </div>
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-navy-100 flex items-center justify-center">
                                                    <Lock className="h-3.5 w-3.5 text-navy-400" />
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-navy-700">Schema Admin</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-navy-50 border border-navy-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-navy-900">Session Security</p>
                                    </div>
                                    <p className="text-xs font-medium text-navy-500 leading-relaxed">
                                        This session is secured by token-based authentication. Privileged actions are logged to the audit trail for compliance verification.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Schema Health Dashboard */}
                <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-navy-50/50 border-b border-navy-50 p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-navy-950 uppercase tracking-tight">Schema Health</CardTitle>
                                <CardDescription className="text-xs font-bold text-navy-400 uppercase tracking-widest">Infrastructure Readiness</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-navy-50">
                            <div className="p-6">
                                <p className="text-xs font-medium text-navy-500 mb-6 leading-relaxed">
                                    Real-time validation of critical database tables required for compliance. Ensure all indicators are active before initiating statutory filings.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-navy-50/50 border border-navy-50 transition-colors hover:bg-navy-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-navy-400 shadow-sm border border-navy-50">
                                                <Server className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-navy-900 uppercase tracking-wide">Document Vault</p>
                                                <p className="text-[10px] text-navy-400 font-mono">public.document_vault</p>
                                            </div>
                                        </div>
                                        <StatusIndicator isActive={schemaStatus.vault} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-navy-50/50 border border-navy-50 transition-colors hover:bg-navy-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-navy-400 shadow-sm border border-navy-50">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-navy-900 uppercase tracking-wide">Revenue Controls</p>
                                                <p className="text-[10px] text-navy-400 font-mono">public.payments</p>
                                            </div>
                                        </div>
                                        <StatusIndicator isActive={schemaStatus.revenue} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-navy-50/50 border border-navy-50 transition-colors hover:bg-navy-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-navy-400 shadow-sm border border-navy-50">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-navy-900 uppercase tracking-wide">Audit Trails</p>
                                                <p className="text-[10px] text-navy-400 font-mono">public.audit_logs</p>
                                            </div>
                                        </div>
                                        <StatusIndicator isActive={schemaStatus.audit} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-navy-50/50 border border-navy-50 transition-colors hover:bg-navy-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-navy-400 shadow-sm border border-navy-50">
                                                <Database className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-navy-900 uppercase tracking-wide">Alert System</p>
                                                <p className="text-[10px] text-navy-400 font-mono">public.notifications</p>
                                            </div>
                                        </div>
                                        <StatusIndicator isActive={schemaStatus.notifications} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-navy-50/30">
                                <Button
                                    onClick={handleSchemaCheck}
                                    disabled={isLoading}
                                    className="w-full h-12 bg-navy-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-navy-800 transition-all shadow-lg shadow-navy-900/20 active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Server className="mr-2 h-4 w-4 animate-bounce" />
                                            Verifying Schema Integrity...
                                        </>
                                    ) : (
                                        <>
                                            <Activity className="mr-2 h-4 w-4" />
                                            Run Deep Health Check
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Enterprise Services Panel */}
                <Card className="border-none shadow-xl bg-white rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-navy-50/50 border-b border-navy-50 p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-navy-950 uppercase tracking-tight">Enterprise Services</CardTitle>
                                <CardDescription className="text-xs font-bold text-navy-400 uppercase tracking-widest">Premium governance controls</CardDescription>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className={`text-[9px] uppercase tracking-widest font-black ${planPrivileges.privateVaultSubnet ? 'text-emerald-600' : 'text-rose-600'}`}>Vault Subnet</span>
                                    <span className={`text-[9px] uppercase tracking-widest font-black ${planPrivileges.complianceOfficer ? 'text-emerald-600' : 'text-rose-600'}`}>Compliance Officer</span>
                                    <span className={`text-[9px] uppercase tracking-widest font-black ${planPrivileges.multiEntityManagement ? 'text-emerald-600' : 'text-rose-600'}`}>Multi-Entity</span>
                                    <span className={`text-[9px] uppercase tracking-widest font-black ${planPrivileges.whiteLabelReporting ? 'text-emerald-600' : 'text-rose-600'}`}>White-label</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {serviceStatus.length === 0 ? (
                            <p className="text-xs text-navy-400">Loading enterprise service readiness...</p>
                        ) : (
                            <div className="space-y-4">
                                {serviceStatus.map((service) => (
                                    <div key={service.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-navy-50 border border-navy-100">
                                        <div>
                                            <p className="text-sm font-black text-navy-900 uppercase tracking-[0.2em]">{service.label}</p>
                                            <p className="text-[10px] text-navy-500 mt-1">{service.enabled ? 'Provisioned' : 'Activation required'}</p>
                                            {service.info && <p className="text-[9px] text-navy-400 mt-1">{service.info}</p>}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${service.supported ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {service.supported ? 'Supported' : 'Locked'}
                                            </span>
                                            <Button
                                                variant="outline"
                                                disabled={!service.supported || service.enabled || serviceLoading}
                                                onClick={() => handleEnableService(service.id)}
                                                className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {service.enabled ? 'Active' : 'Activate'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
