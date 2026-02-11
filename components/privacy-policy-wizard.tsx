"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Shield,
    Download,
    CheckCircle2,
    Building2,
    Phone,
    Video,
    ScrollText,
    FileSignature,
    RefreshCw,
    Lock
} from "lucide-react"
import { generatePrivacyPolicy } from "@/lib/privacy-policy-generator"
import { downloadAsWord } from "@/lib/download-helpers"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export default function PrivacyPolicyWizard() {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        companyName: "",
        collectsPhoneNumbers: false,
        hasCCTV: false,
    })

    const [generatedPolicy, setGeneratedPolicy] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handleGenerate = async () => {
        if (!formData.companyName) return

        setIsGenerating(true)

        // Step 1: Generate the policy text
        const policy = generatePrivacyPolicy({
            companyName: formData.companyName,
            collectsPhoneNumbers: formData.collectsPhoneNumbers,
            hasCCTV: formData.hasCCTV,
        })

        setGeneratedPolicy(policy)
        setIsGenerating(false)

        // Step 2: Save to Supabase if user is logged in
        if (user) {
            setIsSaving(true)
            try {
                const { error } = await supabase.from('privacy_policies').insert([
                    {
                        user_id: user.id,
                        company_name: formData.companyName,
                        collects_phone: formData.collectsPhoneNumbers,
                        uses_cctv: formData.hasCCTV,
                        policy_content: policy
                    }
                ])

                if (error) throw error
                console.log("✅ Privacy Policy archived to governance vault")
            } catch (error: any) {
                console.error("❌ Error archiving policy:", error.message)
            } finally {
                setIsSaving(false)
            }
        }
    }

    const handleDownload = async () => {
        if (!generatedPolicy) return

        try {
            const filename = `Privacy_Policy_${formData.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
            await downloadAsWord(generatedPolicy, filename)
        } catch (error: any) {
            console.error("Download error:", error)
        }
    }

    const handleReset = () => {
        setFormData({
            companyName: "",
            collectsPhoneNumbers: false,
            hasCCTV: false,
        })
        setGeneratedPolicy("")
    }

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-black text-navy-950 tracking-tight flex items-center gap-4">
                        <Lock className="h-10 w-10 text-navy-900" />
                        GDPR/DPA Engine
                    </h1>
                    <p className="text-navy-600 font-medium mt-1">Institutional Privacy Policy Generator aligned with ODPC (Kenya) guidelines.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">DPA 2019 COMPLIANT</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Configuration Panel */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                    <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-navy-900 to-emerald-400" />
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-black text-navy-900 uppercase tracking-tight">Security profiling</CardTitle>
                            <CardDescription className="text-navy-500 font-medium text-xs">Map your data collection boundaries</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 className="h-3 w-3" /> Data Controller Entity
                                    </label>
                                    <Input
                                        name="companyName"
                                        placeholder="e.g., Acme Strategic Solutions Ltd"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className="h-14 bg-navy-50/50 border-navy-100 focus:bg-white transition-all uppercase font-bold text-sm tracking-tight"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Data Inventory</p>

                                    <label className={`group relative flex items-start gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer ${formData.collectsPhoneNumbers ? 'bg-navy-950 text-white border-navy-900 shadow-xl' : 'bg-white border-navy-50 hover:border-navy-200'}`}>
                                        <input
                                            id="collect-phone-numbers"
                                            type="checkbox"
                                            name="collectsPhoneNumbers"
                                            checked={formData.collectsPhoneNumbers}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.collectsPhoneNumbers ? 'bg-white/20' : 'bg-navy-50 text-navy-400'}`}>
                                            <Phone className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 pr-8">
                                            <p className="font-bold text-sm uppercase tracking-tight">Telecommunications Data</p>
                                            <p className={`text-[11px] mt-1 font-medium leading-relaxed ${formData.collectsPhoneNumbers ? 'text-navy-300' : 'text-navy-500'}`}>
                                                Collection of phone numbers for communication, marketing, or verification.
                                            </p>
                                        </div>
                                        {formData.collectsPhoneNumbers && (
                                            <div className="absolute top-4 right-4">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                            </div>
                                        )}
                                    </label>

                                    <label className={`group relative flex items-start gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer ${formData.hasCCTV ? 'bg-navy-950 text-white border-navy-900 shadow-xl' : 'bg-white border-navy-50 hover:border-navy-200'}`}>
                                        <input
                                            id="has-cctv-surveillance"
                                            type="checkbox"
                                            name="hasCCTV"
                                            checked={formData.hasCCTV}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${formData.hasCCTV ? 'bg-white/20' : 'bg-navy-50 text-navy-400'}`}>
                                            <Video className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 pr-8">
                                            <p className="font-bold text-sm uppercase tracking-tight">Visual Surveillance</p>
                                            <p className={`text-[11px] mt-1 font-medium leading-relaxed ${formData.hasCCTV ? 'text-navy-300' : 'text-navy-500'}`}>
                                                CCTV monitoring on commercial or residential premises for security.
                                            </p>
                                        </div>
                                        {formData.hasCCTV && (
                                            <div className="absolute top-4 right-4">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !formData.companyName}
                                    className="flex-1 h-16 bg-navy-950 text-white rounded-[24px] shadow-2xl shadow-navy-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                            Mapping Governance...
                                        </>
                                    ) : (
                                        <>
                                            <FileSignature className="mr-2 h-5 w-5" />
                                            Initialize Instrument
                                        </>
                                    )}
                                </Button>
                                {generatedPolicy && (
                                    <Button onClick={handleReset} variant="outline" className="h-16 w-16 rounded-[24px] border-navy-100 hover:bg-navy-50">
                                        <RefreshCw className="h-6 w-6 text-navy-400" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 rounded-[40px] bg-gradient-to-br from-navy-900 to-black text-white relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Institutional Privacy Stack</h4>
                            <p className="text-xs text-navy-300 font-medium leading-relaxed">
                                Our engine implements the mandatory "Data Subject Rights" framework required under Section 25 of the DPA 2019.
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-center">Right to Erasure</div>
                                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-center">Data Portability</div>
                            </div>
                        </div>
                        <Shield className="absolute -right-8 -bottom-8 h-40 w-40 text-blue-500 opacity-10" />
                    </div>
                </div>

                {/* Preview Surface */}
                <div className="lg:col-span-12 xl:col-span-7">
                    {!generatedPolicy ? (
                        <div className="h-full min-h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-navy-100 rounded-[50px] bg-navy-50/20 text-center p-12">
                            <div className="h-24 w-24 rounded-[32px] bg-white flex items-center justify-center shadow-xl mb-8 shadow-navy-100/50">
                                <ScrollText className="h-12 w-12 text-navy-100" />
                            </div>
                            <h3 className="text-2xl font-black text-navy-900 mb-2 uppercase tracking-tight italic">Awaiting Governance Logic</h3>
                            <p className="text-sm text-navy-500 font-medium max-w-sm mx-auto">Define your operational parameters to initiate the DPA-compliant instrument renderer.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-slide-in">
                            <Card className="border-none shadow-[0_40px_80px_rgba(0,0,0,0.15)] bg-white rounded-[40px] overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-[0.05]">
                                    <Shield className="h-64 w-64 text-navy-900" />
                                </div>
                                <CardHeader className="border-b border-navy-50 px-12 py-10 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-navy-950 font-serif italic text-3xl">Privacy & Data Governance</CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <CardDescription className="uppercase tracking-[0.2em] text-[10px] font-black text-navy-400">Section 26 DPA Certified Instrument</CardDescription>
                                        </div>
                                    </div>
                                    <Button onClick={handleDownload} className="rounded-2xl h-14 px-8 bg-navy-950 hover:bg-black shadow-2xl shadow-navy-300 transition-all">
                                        <Download className="mr-2 h-5 w-5" /> Export Instrument
                                    </Button>
                                </CardHeader>
                                <CardContent className="px-16 py-16">
                                    <div className="prose prose-sm max-w-none text-navy-900 leading-loose font-serif whitespace-pre-line text-base max-h-[600px] overflow-y-auto custom-scrollbar pr-8">
                                        {generatedPolicy}
                                    </div>
                                </CardContent>
                                <div className="px-16 py-10 bg-navy-50 border-t border-navy-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="px-3 py-1.5 rounded-full bg-navy-900 text-white text-[9px] font-black uppercase tracking-widest">ODPC v2026.1</div>
                                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Kanya Statutory Engine Verified</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-navy-300">© 2026 {formData.companyName || 'ENTITY'} • Dynamic Governance Locked</p>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

