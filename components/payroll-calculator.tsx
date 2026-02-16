"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calculator, TrendingDown, ShieldCheck, CheckCircle2, AlertTriangle, FileCheck, Landmark, ChevronDown, Lock } from "lucide-react"
import { calculatePayroll, formatKES } from "@/lib/tax-calculator"
import { verifyCalculation, VerificationReport } from "@/lib/verification-service"
import DocumentPreviewModal from "@/components/document-preview-modal"
import { generatePayslip } from "@/lib/payslip-generator"
import { useAuth } from "@/contexts/auth-context"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { canAccessFeature } from "@/lib/entitlements"

export default function PayrollCalculator() {
    const { profile } = useAuth()
    const { showAlert } = useInstitutionalUI()
    const [grossSalary, setGrossSalary] = useState("")
    const [location, setLocation] = useState("other")
    const [breakdown, setBreakdown] = useState<ReturnType<typeof calculatePayroll> | null>(null)
    const [report, setReport] = useState<VerificationReport | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [payslipContent, setPayslipContent] = useState("")
    const [payrollCredits, setPayrollCredits] = useState(0)

    const loadCredits = async () => {
        try {
            const res = await fetch('/api/credits')
            if (!res.ok) return
            const data = await res.json()
            setPayrollCredits(Number(data?.credits?.payroll || 0))
        } catch {
            // no-op
        }
    }

    useEffect(() => {
        void loadCredits()
    }, [])

    const handleCalculate = async () => {
        const salary = parseFloat(grossSalary)

        if (isNaN(salary) || salary <= 0) {
            showAlert("Engine Parameter Error", "Please enter a valid gross monthly salary amount to initialize the deterministic calculation.")
            return
        }

        const res = await fetch('/api/payroll/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grossSalary: salary }),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
            showAlert("Engine Error", payload.error || "Failed to run payroll engine.")
            return
        }

        const payrollResult = payload.breakdown as ReturnType<typeof calculatePayroll>
        const verificationResult = verifyCalculation(payrollResult, location)

        setBreakdown(payrollResult)
        setReport(verificationResult)
        void loadCredits()
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
                            onClick={async () => {
                                await handleCalculate()
                            }}
                            className="flex-1 h-12 text-lg font-bold bg-navy-900 hover:bg-navy-950 transition-all shadow-lg shadow-navy-200 flex items-center justify-center gap-2"
                        >
                            {!canAccessFeature(profile?.subscription_plan, 'payroll') && <Lock className="h-4 w-4" />}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-slide-in">
                    {/* Left Column: Calculation Breakdown */}
                    <Card className="document-shadow overflow-hidden">
                        <CardHeader className="bg-navy-50/50 border-b border-navy-100 p-6">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl font-bold text-navy-900">Payslip Breakdown</CardTitle>
                                <span className="text-[10px] font-black bg-navy-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                                    v2026.1
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 md:p-8 space-y-8">
                                {/* Gross Section */}
                                <div className="flex items-center justify-between pb-6 border-b border-dashed border-navy-200">
                                    <span className="text-sm font-bold text-navy-600 uppercase tracking-wide">Monthly Gross</span>
                                    <span className="text-2xl font-black text-navy-950 tracking-tight">
                                        {formatKES(breakdown.grossSalary)}
                                    </span>
                                </div>

                                {/* Deductions Section */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <TrendingDown className="h-4 w-4" />
                                        Statutory Deductions
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between group py-1">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-navy-800">Standard PAYE</span>
                                                <span className="text-[10px] font-medium text-navy-400">After KES 2,400 Relief</span>
                                            </div>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.paye)}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm font-bold text-navy-800">SHIF (2.75%)</span>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.shif)}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm font-bold text-navy-800">NSSF Phase 4 (6%)</span>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.nssf)}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm font-bold text-navy-800">Housing Levy (1.5%)</span>
                                            <span className="font-bold text-rose-600">-{formatKES(breakdown.housingLevyEmployee)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Deductions */}
                                <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                                    <span className="text-xs font-black text-rose-900 uppercase tracking-wide">Total Retention</span>
                                    <span className="text-lg font-black text-rose-700">-{formatKES(breakdown.totalDeductions)}</span>
                                </div>

                                {/* Net Pay Footer */}
                                <div className="bg-navy-900 p-8 rounded-[24px] text-white shadow-2xl shadow-navy-200 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-500/20 transition-all duration-500" />

                                    <div className="relative z-10">
                                        <p className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-2">Final Net Take-Home</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-5xl font-black tracking-tighter">{formatKES(breakdown.netPay)}</h3>
                                        </div>
                                        <div className="mt-6 flex items-center gap-2 text-emerald-100/80 text-xs font-medium bg-white/5 p-3 rounded-lg border border-white/5">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                            Amount verified for immediate transfer
                                        </div>
                                    </div>
                                    <FileCheck className="absolute -right-6 -bottom-6 h-40 w-40 text-white/5 rotate-12" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Verification & Trust */}
                    <div className="space-y-6">
                        <Card className="glass-card border-none shadow-xl bg-white">
                            <CardHeader className="p-6 border-b border-navy-50">
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${report.status === 'Verified' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                            <ShieldCheck className={`h-6 w-6 ${report.status === 'Verified' ? 'text-emerald-600' : 'text-rose-600'}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-navy-900">Deterministic Seal</CardTitle>
                                            <p className="text-[10px] text-navy-400 font-mono mt-0.5">SHA-256: {report.auditHash.substring(0, 12)}...</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    {report.checks.map(check => (
                                        <div key={check.id} className="flex gap-4 p-3 rounded-xl hover:bg-navy-50 transition-colors">
                                            {check.status === 'Pass' ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-navy-900">{check.label}</p>
                                                <p className="text-xs text-navy-500 mt-1 leading-relaxed">{check.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-navy-50 space-y-4">
                                    <Button
                                        onClick={() => {
                                            const content = generatePayslip({
                                                employeeName: "Institutional Employee",
                                                businessName: profile?.business_name || "ComplyKe Entity",
                                                logoUrl: profile?.logo_url || "https://complyke.com/logo.png",
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
                                        className="w-full h-14 bg-navy-900 text-white rounded-xl shadow-lg shadow-navy-100 font-black uppercase tracking-widest text-xs hover:bg-navy-800 transition-all active:scale-[0.98]"
                                    >
                                        <FileCheck className="mr-2 h-4 w-4" />
                                        Generate Institutional Payslip
                                    </Button>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-navy-50 rounded-xl border border-navy-50 text-center">
                                            <p className="text-[9px] font-black text-navy-400 uppercase mb-2 tracking-widest">Audit Timestamp</p>
                                            <p className="text-xs font-mono font-bold text-navy-800">{new Date(report.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="p-4 bg-navy-50 rounded-xl border border-navy-50 text-center">
                                            <p className="text-[9px] font-black text-navy-400 uppercase mb-2 tracking-widest">KRA Specs Code</p>
                                            <p className="text-xs font-mono font-bold text-navy-800">LN-164-2024</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-navy-900 to-navy-950 text-white overflow-hidden relative border-none shadow-xl rounded-[24px]">
                            <CardHeader className="p-6 relative z-10">
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <Landmark className="h-5 w-5" />
                                    <CardTitle className="text-sm uppercase tracking-widest font-black">Employer Remittance Info</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 space-y-6 relative z-10">
                                <p className="text-xs text-navy-300 font-medium leading-relaxed">
                                    Total employer liability for this employee (including their own deductions):
                                </p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-3 border-b border-navy-800/50">
                                        <span className="text-sm font-bold text-navy-100">Total Employer Outlay</span>
                                        <span className="text-xl font-black text-emerald-400 tracking-tight">{formatKES(breakdown.grossSalary + breakdown.housingLevyEmployer + breakdown.nssf)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-navy-400">Employer NSSF Match</span>
                                        <span className="text-navy-200">{formatKES(breakdown.nssf)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-navy-400">Employer Housing Levy Match</span>
                                        <span className="text-navy-200">{formatKES(breakdown.housingLevyEmployer)}</span>
                                    </div>
                                </div>
                            </CardContent>

                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -ml-10 -mb-10" />
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
