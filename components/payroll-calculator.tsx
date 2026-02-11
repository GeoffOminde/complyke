"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calculator, TrendingDown, ShieldCheck, CheckCircle2, AlertTriangle, FileCheck, Landmark, ChevronDown, Lock, ArrowRight } from "lucide-react"
import { calculatePayroll, formatKES } from "@/lib/tax-calculator"
import { verifyCalculation, VerificationReport } from "@/lib/verification-service"
import { supabase } from "@/lib/supabase"
import DocumentPreviewModal from "@/components/document-preview-modal"
import { generatePayslip } from "@/lib/payslip-generator"
import { useAuth } from "@/contexts/auth-context"
import { useInstitutionalUI } from "@/contexts/ui-context"

export default function PayrollCalculator() {
    const { user, profile } = useAuth()
    const { showAlert, unlockedFeatures } = useInstitutionalUI()
    const [grossSalary, setGrossSalary] = useState("")
    const [location, setLocation] = useState("other")
    const [breakdown, setBreakdown] = useState<ReturnType<typeof calculatePayroll> | null>(null)
    const [report, setReport] = useState<VerificationReport | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [payslipContent, setPayslipContent] = useState("")

    const handleCalculate = async () => {
        const salary = parseFloat(grossSalary)

        if (isNaN(salary) || salary <= 0) {
            showAlert("Engine Parameter Error", "Please enter a valid gross monthly salary amount to initialize the deterministic calculation.")
            return
        }

        const payrollResult = calculatePayroll(salary)
        const verificationResult = verifyCalculation(payrollResult, location)

        setBreakdown(payrollResult)
        setReport(verificationResult)

        // Save to Supabase if user is logged in
        if (user) {
            setIsSaving(true)
            try {
                const { error } = await supabase.from('payroll_calculations').insert([
                    {
                        user_id: user.id,
                        gross_salary: salary,
                        housing_levy: payrollResult.housingLevyEmployee,
                        shif: payrollResult.shif,
                        nssf: payrollResult.nssf,
                        paye: payrollResult.paye,
                        net_pay: payrollResult.netPay
                    }
                ])

                if (error) throw error
                console.log("✅ Payroll archived to cloud ledger")
            } catch (error: any) {
                console.error("❌ Error archiving payroll:", error.message)
            } finally {
                setIsSaving(false)
            }
        }
    }

    const handleReset = () => {
        setGrossSalary("")
        setBreakdown(null)
        setReport(null)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <Card className="glass-card overflow-hidden">
                <div className="h-2 bg-compliance-gradient" />
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-navy-100 p-3 rounded-xl">
                            <Calculator className="h-8 w-8 text-navy-800" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-navy-950">Payroll Tax Engine</CardTitle>
                            <CardDescription className="text-navy-600 font-medium">
                                Institutional-grade calculations for Kenya 2026 Laws
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label htmlFor="grossSalary" className="text-sm font-bold text-navy-800 flex items-center gap-2">
                                Gross Monthly Salary (KES)
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 font-bold">KES</span>
                                <Input
                                    id="grossSalary"
                                    type="number"
                                    placeholder="e.g., 50000"
                                    className="pl-12 h-12 text-lg font-bold border-navy-200 focus:ring-navy-500"
                                    value={grossSalary}
                                    onChange={(e) => setGrossSalary(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-navy-800">Business Location</label>
                            <div className="relative">
                                <select
                                    id="business-location"
                                    name="business_location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full h-12 px-4 rounded-md border border-navy-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-500 appearance-none pr-10"
                                >
                                    <option value="nairobi">Nairobi / Major Cities</option>
                                    <option value="other">Other Urban Areas</option>
                                    <option value="rural">Rural Areas</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => {
                                const isUnlocked = unlockedFeatures.includes('payroll')
                                if (!isUnlocked && (profile?.subscription_plan === 'free_trial' || !profile?.subscription_plan)) {
                                    showAlert("Institutional Tier Restriction", "Your current evaluation protocol is limited to document synthesis. Please upgrade to a Professional tier or use the 'Instant Liquidity Plan' to unlock the Deterministic Payroll Engine.")
                                    return
                                }
                                handleCalculate()
                            }}
                            className="flex-1 h-12 text-lg font-bold bg-navy-900 hover:bg-navy-950 transition-all shadow-lg shadow-navy-200 flex items-center justify-center gap-2"
                        >
                            {!unlockedFeatures.includes('payroll') && (profile?.subscription_plan === 'free_trial' || !profile?.subscription_plan) && <Lock className="h-4 w-4" />}
                            Run Deterministic Engine
                        </Button>
                        {breakdown && (
                            <Button onClick={handleReset} variant="outline" className="h-12 border-navy-200">
                                Reset
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {breakdown && report && (
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Calculation Breakdown */}
                    <Card className="document-shadow animate-slide-in">
                        <CardHeader className="bg-navy-50 border-b border-navy-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl">Payslip Breakdown</CardTitle>
                                <span className="text-xs font-bold bg-navy-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                                    v2026.1
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 space-y-6">
                                {/* Gross Section */}
                                <div className="flex items-center justify-between pb-4 border-b border-dashed border-navy-200">
                                    <span className="text-navy-600 font-medium">Monthly Gross Salary</span>
                                    <span className="text-2xl font-black text-navy-950">
                                        {formatKES(breakdown.grossSalary)}
                                    </span>
                                </div>

                                {/* Deductions Section */}
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-navy-400 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4" />
                                        Statutory Deductions
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between group">
                                            <div className="flex flex-col">
                                                <span className="text-navy-800 font-bold">Standard PAYE</span>
                                                <span className="text-xs text-navy-400">After KES 2,400 Personal Relief</span>
                                            </div>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.paye)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-navy-800 font-bold">SHIF (2.75%)</span>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.shif)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-navy-800 font-bold">NSSF Phase 4 (6%)</span>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.nssf)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-navy-800 font-bold">Housing Levy (1.5%)</span>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.housingLevyEmployee)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Deductions */}
                                <div className="flex items-center justify-between py-4 bg-rose-50/50 px-4 rounded-xl border border-rose-100">
                                    <span className="text-rose-900 font-bold">Total Retention</span>
                                    <span className="text-xl font-bold text-rose-700">-{formatKES(breakdown.totalDeductions)}</span>
                                </div>

                                {/* Net Pay Footer */}
                                <div className="bg-success-gradient p-6 rounded-2xl text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs mb-1">Final Net Take-Home</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-4xl font-black">{formatKES(breakdown.netPay)}</h3>
                                        </div>
                                        <p className="text-emerald-50 text-xs mt-3 opacity-80 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Amount verified for transfer in February 2026
                                        </p>
                                    </div>
                                    <FileCheck className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Verification & Trust */}
                    <div className="space-y-6">
                        <Card className="glass-card border-none shadow-xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className={`h-6 w-6 ${report.status === 'Verified' ? 'text-emerald-600' : 'text-rose-600'}`} />
                                    <CardTitle>Deterministic Trust Seal</CardTitle>
                                </div>
                                <div className="text-[10px] font-mono bg-navy-100 px-2 py-1 rounded text-navy-600">
                                    ID: {report.auditHash}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    {report.checks.map(check => (
                                        <div key={check.id} className="flex gap-3 group">
                                            {check.status === 'Pass' ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-navy-900">{check.label}</p>
                                                <p className="text-xs text-navy-500 leading-relaxed">{check.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-navy-100 mt-6 space-y-4">
                                    <Button
                                        onClick={() => {
                                            const content = generatePayslip({
                                                employeeName: "Institutional Employee",
                                                businessName: profile?.business_name || "ComplyKe Entity",
                                                month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                                                grossSalary: breakdown.grossSalary,
                                                housingLevy: breakdown.housingLevyEmployee,
                                                shif: breakdown.shif,
                                                nssf: breakdown.nssf,
                                                paye: breakdown.paye,
                                                netPay: breakdown.netPay
                                            })
                                            setPayslipContent(content)
                                            setIsPreviewOpen(true)
                                        }}
                                        className="w-full h-12 bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-100 font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileCheck className="h-5 w-5" />
                                        Preview Institutional Payslip
                                    </Button>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-navy-50 rounded-lg border border-navy-100">
                                            <p className="text-[10px] font-bold text-navy-400 uppercase mb-1">Audit Timestamp</p>
                                            <p className="text-xs font-mono text-navy-800 break-all">{new Date(report.timestamp).toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-navy-50 rounded-lg border border-navy-100">
                                            <p className="text-[10px] font-bold text-navy-400 uppercase mb-1">KRA Specs Code</p>
                                            <p className="text-xs font-mono text-navy-800">LN-164-2024</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-navy-950 text-white overflow-hidden relative">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Landmark className="h-5 w-5" />
                                    <CardTitle className="text-sm uppercase tracking-widest font-bold">Employer Remittance Info</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <p className="text-xs text-navy-300 leading-relaxed">
                                    Total employer liability for this employee (including their deductions):
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm py-2 border-b border-navy-800">
                                        <span className="text-navy-400">Total Employer Outlay</span>
                                        <span className="font-bold">{formatKES(breakdown.grossSalary + breakdown.housingLevyEmployer + breakdown.nssf)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-1">
                                        <span className="text-navy-500">Employer NSSF Match</span>
                                        <span>{formatKES(breakdown.nssf)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-1">
                                        <span className="text-navy-500">Employer Housing Levy Match</span>
                                        <span>{formatKES(breakdown.housingLevyEmployer)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-navy-900 rounded-full blur-3xl opacity-50 -mr-16 -mt-16" />
                        </Card>
                    </div>
                </div>
            )}

            {/* Forensic Preview */}
            <DocumentPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="Institutional Payslip Instrument"
                content={payslipContent}
                type="contract"
                onDownloadWord={async () => {
                    const { downloadAsWord } = await import('@/lib/download-helpers')
                    await downloadAsWord(payslipContent, `Payslip_${new Date().toISOString().split('T')[0]}`)
                }}
                onDownloadPDF={async () => {
                    const { downloadAsPDF } = await import('@/lib/download-helpers')
                    await downloadAsPDF(payslipContent, `Payslip_${new Date().toISOString().split('T')[0]}`)
                }}
            />
        </div>
    )
}
