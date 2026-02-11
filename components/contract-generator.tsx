"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertTriangle,
    FileText,
    Download,
    ShieldCheck,
    RefreshCcw,
    UserPlus,
    BadgeCheck,
    Scale,
    Calendar,
    Briefcase,
    Banknote,
    Upload,
    Building2
} from "lucide-react"
import { generateEmploymentContract } from "@/lib/contract-generator"
import { isAboveMinimumWage, formatKES } from "@/lib/tax-calculator"
import { downloadAsWord } from "@/lib/download-helpers"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useInstitutionalUI } from "@/contexts/ui-context"

export default function ContractGenerator() {
    const { user, profile } = useAuth()
    const { showToast, showAlert } = useInstitutionalUI()
    const [formData, setFormData] = useState({
        companyName: profile?.business_name || "",
        employeeName: "",
        idNumber: "",
        jobTitle: "",
        grossSalary: "",
        startDate: "",
    })

    const [companyLogo, setCompanyLogo] = useState<string | null>(null)
    const [generatedContract, setGeneratedContract] = useState("")
    const [showWarning, setShowWarning] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [currentContractId, setCurrentContractId] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)

    useEffect(() => {
        if (profile?.business_name && !formData.companyName) {
            setFormData(prev => ({ ...prev, companyName: profile.business_name }))
        }
    }, [profile])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (name === "grossSalary") {
            const salary = parseFloat(value)
            if (!isNaN(salary)) {
                setShowWarning(!isAboveMinimumWage(salary))
            }
        }
    }

    const handleGenerate = async () => {
        const salary = parseFloat(formData.grossSalary)

        if (!formData.companyName || !formData.employeeName || !formData.idNumber || !formData.jobTitle || isNaN(salary) || !formData.startDate) {
            showAlert('Protocol Error', 'Please complete all institutional parameters including Company Name.')
            return
        }

        setIsGenerating(true)

        // Step 1: Generate the legal text
        const contract = generateEmploymentContract({
            employeeName: formData.employeeName,
            idNumber: formData.idNumber,
            jobTitle: formData.jobTitle,
            grossSalary: salary,
            startDate: formData.startDate,
            employerName: formData.companyName,
        })

        setGeneratedContract(contract)
        setIsGenerating(false)

        // Step 2: Save to Supabase if user is logged in
        if (user) {
            setIsSaving(true)
            try {
                const { data, error } = await supabase.from('contracts').insert([
                    {
                        user_id: user.id,
                        employee_name: formData.employeeName,
                        employee_id: formData.idNumber,
                        job_title: formData.jobTitle,
                        gross_salary: salary,
                        start_date: formData.startDate,
                        contract_content: contract
                    }
                ]).select('id').single()

                if (error) throw error
                if (data) setCurrentContractId(data.id)
                console.log("✅ Contract archived to institutional vault")
            } catch (error: any) {
                console.error("❌ Error archiving contract:", error.message)
            } finally {
                setIsSaving(false)
            }
        }
    }

    const handleDownload = async () => {
        if (!generatedContract) return

        try {
            const filename = `Employment_Contract_${formData.employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
            await downloadAsWord(generatedContract, filename)
            showToast('✅ Instrument exported to DOCX format')
        } catch (error: any) {
            console.error("Download error:", error)
        }
    }

    const handleDownloadPDF = async () => {
        if (!generatedContract) return
        setIsDownloadingPDF(true)

        try {
            const { downloadAsPDF } = await import('@/lib/download-helpers')
            const filename = `Employment_Contract_${formData.employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
            await downloadAsPDF(generatedContract, filename)
            showToast('✅ Instrument exported to PDF format')
        } catch (error: any) {
            console.error("PDF Download error:", error)
            showAlert('Export Error', 'Failed to render PDF instrument.')
        } finally {
            setIsDownloadingPDF(false)
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setCompanyLogo(reader.result as string)
                showToast('🏢 Company logo successfully loaded')
            }
            reader.readAsDataURL(file)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentContractId || !user) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${currentContractId}_signed.${fileExt}`
            const filePath = `contracts/${fileName}`

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('institutional-vault')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Update Contract record with URL
            const { error: updateError } = await supabase
                .from('contracts')
                .update({ signed_copy_url: filePath })
                .eq('id', currentContractId)

            if (updateError) throw updateError

            setUploadSuccess(true)
            showToast('✅ Signed instrument archived in Cloud Vault')
        } catch (error: any) {
            console.error('Upload error:', error.message)
            showAlert('Archival Failure', 'Security check failed: ' + error.message)
        } finally {
            setIsUploading(false)
        }
    }

    const handleReset = () => {
        setFormData({
            companyName: profile?.business_name || "",
            employeeName: "",
            idNumber: "",
            jobTitle: "",
            grossSalary: "",
            startDate: "",
        })
        setGeneratedContract("")
        setShowWarning(false)
        setCompanyLogo(null)
    }

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-black text-navy-950 tracking-tight flex items-center gap-4">
                        <FileText className="h-10 w-10 text-navy-900" />
                        Contract Engine
                    </h1>
                    <p className="text-navy-600 font-medium mt-1">Legally binding employment instruments aligned with 2026 statutes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Counsel Verified</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Configuration Panel */}
                <div className="lg:col-span-5 space-y-8">
                    <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-navy-400 via-navy-900 to-navy-400" />
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-black text-navy-900 uppercase tracking-tight">Instrument parameters</CardTitle>
                            <CardDescription className="text-navy-500 font-medium text-xs">Configure the legal boundaries of this engagement</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 className="h-3 w-3" /> Employer / Entity Name
                                    </label>
                                    <Input
                                        name="companyName"
                                        placeholder="e.g., ACME STRATEGIC SOLUTIONS LTD"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className="h-12 bg-navy-50/50 border-navy-100 focus:bg-white transition-all uppercase font-black text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                        <Upload className="h-3 w-3" /> Company Logo (Optional)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {companyLogo ? (
                                            <div className="h-12 w-12 rounded-xl border border-navy-100 bg-white overflow-hidden relative group">
                                                <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
                                                <button
                                                    onClick={() => setCompanyLogo(null)}
                                                    className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => document.getElementById('logo-upload')?.click()}
                                                className="h-12 w-12 rounded-xl border-2 border-dashed border-navy-100 hover:border-navy-400 transition-colors flex items-center justify-center cursor-pointer bg-white"
                                            >
                                                <Upload className="h-4 w-4 text-navy-400" />
                                            </div>
                                        )}
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoUpload}
                                        />
                                        <p className="text-[10px] text-navy-400 font-medium">PNG or SVG for document header.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                        <UserPlus className="h-3 w-3" /> Employee Full Name
                                    </label>
                                    <Input
                                        name="employeeName"
                                        placeholder="e.g., JANE WANJIKU KAMAU"
                                        value={formData.employeeName}
                                        onChange={handleInputChange}
                                        className="h-12 bg-navy-50/50 border-navy-100 focus:bg-white transition-all uppercase font-bold text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                            <BadgeCheck className="h-3 w-3" /> ID Number
                                        </label>
                                        <Input
                                            name="idNumber"
                                            placeholder="87654321"
                                            value={formData.idNumber}
                                            onChange={handleInputChange}
                                            className="h-12 bg-navy-50/50 border-navy-100 focus:bg-white transition-all font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> Start Date
                                        </label>
                                        <Input
                                            name="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            className="h-12 bg-navy-50/50 border-navy-100 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase className="h-3 w-3" /> Job Title
                                    </label>
                                    <Input
                                        name="jobTitle"
                                        placeholder="Operations Associate"
                                        value={formData.jobTitle}
                                        onChange={handleInputChange}
                                        className="h-12 bg-navy-50/50 border-navy-100 focus:bg-white transition-all font-bold text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                        <Banknote className="h-3 w-3" /> Monthly Gross Salary
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="grossSalary"
                                            type="number"
                                            placeholder="35000"
                                            value={formData.grossSalary}
                                            onChange={handleInputChange}
                                            className={`h-12 bg-navy-50/50 border-navy-100 focus:bg-white transition-all pl-12 font-black text-lg ${showWarning ? 'text-rose-600' : 'text-navy-900'}`}
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 font-bold text-sm">KES</span>
                                    </div>
                                </div>
                            </div>

                            {showWarning && (
                                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4 animate-bounce-subtle">
                                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-rose-900 uppercase">Statutory Minimum Wage Breach</p>
                                        <p className="text-[10px] text-rose-700 font-medium mt-1 leading-relaxed">
                                            The specified salary is below the required minimum wage for your selected location. This instrument may be legally void.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !formData.employeeName}
                                    className="flex-1 h-14 bg-navy-950 text-white rounded-2xl shadow-xl shadow-navy-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
                                            Sealing Instrument...
                                        </>
                                    ) : (
                                        <>
                                            <Scale className="mr-2 h-5 w-5" />
                                            Generate Instrument
                                        </>
                                    )}
                                </Button>
                                {generatedContract && (
                                    <Button onClick={handleReset} variant="outline" className="h-14 w-14 rounded-2xl border-navy-100 hover:bg-navy-50">
                                        <RefreshCcw className="h-6 w-6 text-navy-400" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Legal Context Card */}
                    <div className="p-8 rounded-[32px] bg-navy-950 text-white relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Compliance Logic v2.10</h4>
                            <ul className="space-y-3 text-[11px] font-medium text-navy-300">
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                                    Automated SHIF/SHA Deductions (2.75%)
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                                    Phase 4 NSSF Tier Integration
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                                    Data Protection Clause (DPA 2019)
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                                    Institutional "Affordable Housing" Logic
                                </li>
                            </ul>
                        </div>
                        <Scale className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 opacity-20" />
                    </div>
                </div>

                {/* Preview Surface */}
                <div className="lg:col-span-7">
                    {!generatedContract ? (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-navy-100 rounded-[40px] bg-navy-50/30 text-center p-12">
                            <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center shadow-lg mb-6 shadow-navy-100/50">
                                <FileText className="h-10 w-10 text-navy-200" />
                            </div>
                            <h3 className="text-xl font-black text-navy-900 mb-2 uppercase tracking-tight">Instrument Surface Ready</h3>
                            <p className="text-sm text-navy-500 font-medium max-w-xs mx-auto">Configure the parameters on the left to initialize the document rendering engine.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-slide-in">
                            <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.12)] bg-white rounded-none relative">
                                {/* Institutional Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none uppercase font-black text-8xl -rotate-12 border-4 border-navy-900 m-20">
                                    Official Draft
                                </div>
                                <CardHeader className="border-b border-navy-50 px-10 py-8 flex flex-row items-center justify-between">
                                    <div className="flex flex-col items-center gap-4">
                                        {companyLogo && (
                                            <img src={companyLogo} alt="Company Logo" className="h-16 w-auto mb-4" />
                                        )}
                                        <div className="text-center">
                                            <CardTitle className="text-navy-900 font-serif italic text-2xl uppercase tracking-tighter">Employment Contract</CardTitle>
                                            <CardDescription className="uppercase tracking-[0.2em] text-[10px] font-black text-emerald-600 mt-1">Legally Validated Instrument</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleDownload} variant="outline" className="rounded-xl border-navy-100 hover:bg-navy-50 shadow-sm">
                                            <Download className="mr-2 h-4 w-4" /> DOCX
                                        </Button>
                                        <Button onClick={handleDownloadPDF} disabled={isDownloadingPDF} className="rounded-xl bg-navy-900 hover:bg-navy-800 shadow-xl shadow-navy-200">
                                            {isDownloadingPDF ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                            PDF
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-12 py-12">
                                    <div className="prose prose-sm max-w-none text-navy-800 leading-relaxed font-serif whitespace-pre-line text-sm border-l-2 border-navy-50 pl-8">
                                        {generatedContract}
                                    </div>
                                </CardContent>
                                <div className="p-10 bg-navy-50 border-t border-navy-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-navy-100 flex items-center justify-center text-navy-400 font-black text-xs">A4</div>
                                        <p className="text-[10px] font-black text-navy-500 uppercase tracking-widest leading-none">Standard Business <br />Portrait Layout</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-navy-400">© 2026 ComplyKe Statutory Engine • All Rights Reserved</p>
                                </div>
                            </Card>

                            {/* Cloud Vault Upload Section */}
                            {currentContractId && (
                                <Card className="border-none shadow-2xl bg-navy-950 text-white rounded-[40px] overflow-hidden p-10 animate-slide-in-up">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="space-y-2 text-center md:text-left">
                                            <h3 className="text-2xl font-black italic uppercase">Institutional Archival</h3>
                                            <p className="text-navy-400 text-sm font-medium">Upload the signed physical instrument to lock it in your 2026 Cloud Vault.</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="file"
                                                id="signed-upload"
                                                name="signed_instrument"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                accept=".pdf,image/*"
                                            />
                                            <Button
                                                onClick={() => document.getElementById('signed-upload')?.click()}
                                                disabled={isUploading || uploadSuccess}
                                                className={`h-16 px-8 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${uploadSuccess ? 'bg-emerald-500 text-white' : 'bg-white text-navy-950 hover:bg-emerald-50'}`}
                                            >
                                                {isUploading ? (
                                                    <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                                                ) : uploadSuccess ? (
                                                    <ShieldCheck className="h-5 w-5 mr-2" />
                                                ) : (
                                                    <Upload className="h-5 w-5 mr-2" />
                                                )}
                                                {isUploading ? 'Securing...' : uploadSuccess ? 'Archived' : 'Upload Signed Copy'}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

