"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { supabase } from "@/lib/supabase"
import {
    ShieldCheck,
    Building2,
    MapPin,
    Fingerprint,
    FileUp,
    CheckCircle2,
    AlertTriangle,
    History,
    FileText,
    Download
} from "lucide-react"

export default function InstitutionalProfile() {
    const { profile, user, refreshProfile } = useAuth()
    const { showToast, showAlert } = useInstitutionalUI()
    const [isSaving, setIsSaving] = useState(false)
    const [documents, setDocuments] = useState<any[]>([])
    const [isLoadingDocs, setIsLoadingDocs] = useState(false)

    const [formData, setFormData] = useState({
        business_name: profile?.business_name || "",
        kra_pin: profile?.kra_pin || "",
        business_address: profile?.business_address || "",
        registration_number: profile?.registration_number || "",
    })

    useEffect(() => {
        if (profile) {
            setFormData({
                business_name: profile.business_name || "",
                kra_pin: profile.kra_pin || "",
                business_address: profile.business_address || "",
                registration_number: profile.registration_number || "",
            })
            fetchVault()
        }
    }, [profile])

    const fetchVault = async () => {
        if (!user) return
        try {
            setIsLoadingDocs(true)
            const { data, error } = await supabase
                .from('document_vault')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) setDocuments(data)
        } catch (err) {
            console.error('Vault Fetch Error:', err)
        } finally {
            setIsLoadingDocs(false)
        }
    }

    const handleUpdateProfile = async () => {
        if (!user) return
        try {
            setIsSaving(true)
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            await refreshProfile()
            showToast("Institutional Identity Updated", "success")
        } catch (err: any) {
            showAlert("Update Failed", err.message || "Failed to synchronize profile.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Identity Verification Form */}
                <Card className="md:col-span-2 glass-card border-none shadow-xl overflow-hidden">
                    <div className="h-2 bg-compliance-gradient" />
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-navy-100 overflow-hidden border border-navy-50">
                                <img src="/logo.svg" alt="ComplyKe Logo" className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-navy-950 uppercase tracking-tight italic">Business Identity</CardTitle>
                                <CardDescription className="text-navy-500 font-bold text-[10px] uppercase tracking-widest">
                                    Statutory Verification Protocol
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                    Legal Entity Name
                                    {profile?.is_verified && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                </label>
                                <Input
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    placeholder="NEXVISION SOLUTIONS LTD"
                                    className="h-12 rounded-xl border-navy-100 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Institutional KRA PIN</label>
                                <Input
                                    value={formData.kra_pin}
                                    onChange={(e) => setFormData({ ...formData, kra_pin: e.target.value })}
                                    placeholder="P052XXXXXXK"
                                    className="h-12 rounded-xl border-navy-100 font-bold uppercase"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Registration No. (CR12)</label>
                                <Input
                                    value={formData.registration_number}
                                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                                    placeholder="PVT-2026-XXXX"
                                    className="h-12 rounded-xl border-navy-100 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Physical Head Office</label>
                                <Input
                                    value={formData.business_address}
                                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                                    placeholder="Westlands, Nairobi, KE"
                                    className="h-12 rounded-xl border-navy-100 font-bold"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-navy-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-navy-400">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">KRA Portal Sync Ready</span>
                            </div>
                            <Button
                                onClick={handleUpdateProfile}
                                disabled={isSaving}
                                className="h-12 px-8 bg-navy-950 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-navy-100"
                            >
                                {isSaving ? "Syncing..." : "Synchronize Identity"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Vertification Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-navy-950 text-white border-none shadow-2xl rounded-3xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-10" />
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                Audit Rating
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-end justify-between">
                                    <div className="text-4xl font-black">{profile?.compliance_score || 0}%</div>
                                    <div className="text-[10px] font-black text-navy-400 uppercase mb-2">Protocol Readiness</div>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-compliance-gradient transition-all duration-1000"
                                        style={{ width: `${profile?.compliance_score || 0}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-navy-400 font-medium leading-relaxed italic">
                                    Complete your CR12 and Pin Certificate upload to reach Level 3 Institutional Compliance.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-navy-50 shadow-lg rounded-3xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-navy-400">Security Layer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${profile?.mfa_enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        <Fingerprint className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-bold text-navy-950">Biometric MFA</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${profile?.mfa_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {profile?.mfa_enabled ? 'Active' : 'Missing'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${profile?.kra_pin_certificate_url ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <FileUp className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-bold text-navy-950">PIN Certificate</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${profile?.kra_pin_certificate_url ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {profile?.kra_pin_certificate_url ? 'Linked' : 'Pending'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Document Vault Summary */}
            <Card className="bg-white border-navy-50 shadow-xl rounded-[40px] overflow-hidden">
                <CardHeader className="p-8 border-b border-navy-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-navy-50 flex items-center justify-center text-navy-900 shadow-sm border border-navy-100">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-navy-950 uppercase tracking-tight italic">Document Vault</CardTitle>
                            <CardDescription className="text-xs font-bold text-navy-400 uppercase tracking-widest mt-1">
                                {documents.filter(d => d.document_type === 'contract').length} Contracts • {documents.filter(d => d.document_type === 'policy').length} Policies
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-navy-50">
                        {isLoadingDocs ? (
                            <div className="p-12 text-center text-navy-400 font-bold uppercase text-[10px] animate-pulse">Scanning Archive...</div>
                        ) : documents.length > 0 ? (
                            documents.map((doc) => (
                                <div key={doc.id} className="p-6 hover:bg-navy-50/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group border-l-4 border-transparent hover:border-navy-900">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white border border-navy-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-navy-300 group-hover:text-navy-900">
                                            {doc.document_type === 'contract' ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-navy-950 text-sm uppercase tracking-tight">{doc.document_name}</p>
                                                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                                    Archived
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-widest flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-navy-300"></span>
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] font-mono text-navy-300 uppercase tracking-widest flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-navy-300"></span>
                                                    Vault Hash: {doc.id.split('-')[0]}...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-900 hover:text-white transition-all border-navy-100">
                                        <Download className="h-3 w-3 mr-2" />
                                        Retrieve
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-16 text-center">
                                <div className="h-16 w-16 rounded-full bg-navy-50 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-8 w-8 text-navy-200" />
                                </div>
                                <h3 className="text-sm font-black text-navy-950 uppercase mb-1">Archive Empty</h3>
                                <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest">No statutory instruments have been vaulted yet.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
