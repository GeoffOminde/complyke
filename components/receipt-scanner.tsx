"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Camera,
    Upload,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ShieldCheck,
    Receipt,
    FileSearch,
    ScanLine,
    Info
} from "lucide-react"

interface ReceiptData {
    merchantName: string | null
    kraPin: string | null
    totalAmount: number | null
    date: string | null
    items: string[]
    isDeductible: boolean
    category: string
}

export default function ReceiptScanner() {
    const [isScanning, setIsScanning] = useState(false)
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFileUpload = async (file: File) => {
        if (!file) return

        setIsScanning(true)
        setError(null)
        setReceiptData(null)

        try {
            const formData = new FormData()
            formData.append('image', file)

            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setReceiptData(data.data)
        } catch (err: any) {
            console.error('Scan error:', err)
            setError(err.message || 'Failed to scan receipt. Please ensure your cloud services are correctly configured.')
        } finally {
            setIsScanning(false)
        }
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileUpload(file)
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0])
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-navy-950 tracking-tight flex items-center gap-3">
                        The Tax Lens
                        <span className="text-[10px] bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Beta v2.1</span>
                    </h1>
                    <p className="text-navy-600 font-medium">Deterministic OCR for Statutory Audit Compliance</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-navy-100 shadow-sm">
                    <ScanLine className="h-4 w-4 text-navy-400" />
                    <span className="text-[10px] font-bold text-navy-800 uppercase tracking-widest">eTIMS Validated</span>
                </div>
            </div>

            <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-navy-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32" />
                <CardHeader className="relative z-10 border-b border-navy-100/50 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-navy-900 flex items-center justify-center text-white shadow-xl shadow-navy-200">
                            <Camera className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-navy-950">Institutional Asset Scan</CardTitle>
                            <CardDescription className="text-navy-500 font-medium">Verify deductible expenses against 2026 KRA regulations</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 relative z-10">
                    <div className="space-y-8">
                        {/* Advanced Upload Area */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`relative group transition-all duration-500 rounded-[32px] border-2 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-pointer ${dragActive
                                    ? 'border-navy-900 bg-navy-50 scale-[0.99]'
                                    : 'border-navy-200 bg-white hover:border-navy-400 hover:bg-navy-50/50'
                                }`}
                            onClick={() => document.getElementById('receipt-upload')?.click()}
                        >
                            <div className={`p-6 rounded-3xl mb-6 transition-all duration-500 ${dragActive ? 'bg-navy-900 text-white rotate-12' : 'bg-navy-50 text-navy-400'}`}>
                                {isScanning ? (
                                    <Loader2 className="h-12 w-12 animate-spin" />
                                ) : (
                                    <Upload className="h-12 w-12 group-hover:scale-110 transition-transform" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">
                                    {isScanning ? 'Processing Statutory Data...' : 'Submit Institutional Receipt'}
                                </h3>
                                <p className="text-sm text-navy-500 font-medium max-w-xs mx-auto">
                                    Drop file here or click to scan. Our model identifies KRA PINs and eTIMS signatures automatically.
                                </p>
                            </div>

                            <input
                                id="receipt-upload"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={onFileChange}
                                className="hidden"
                                disabled={isScanning}
                            />

                            {/* Decorative Corner Accents */}
                            <div className="absolute top-4 left-4 h-4 w-4 border-t-2 border-l-2 border-navy-300 rounded-tl" />
                            <div className="absolute top-4 right-4 h-4 w-4 border-t-2 border-r-2 border-navy-300 rounded-tr" />
                            <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-navy-300 rounded-bl" />
                            <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-navy-300 rounded-br" />
                        </div>

                        {/* Legal Note */}
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-navy-50 border border-navy-100">
                            <Info className="h-5 w-5 text-navy-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-navy-600 font-medium leading-relaxed">
                                <span className="font-black text-navy-900 uppercase">Attention:</span> Section 23A of the Tax Procedures Act. Only eTIMS-validated receipts are deductible for Corporate Tax. Non-compliant receipts will be flagged as "High Liability".
                            </p>
                        </div>

                        {/* Error Handling */}
                        {error && (
                            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 animate-fade-in">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Audit Failure</p>
                                        <p className="text-xs text-rose-700 font-medium mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Extracted Data Surface */}
                        {receiptData && (
                            <div className="space-y-6 animate-slide-in">
                                {/* Verdict Banner */}
                                <div className={`p-6 rounded-3xl border shadow-xl flex items-center justify-between gap-4 ${receiptData.isDeductible
                                        ? 'bg-success-gradient border-emerald-400 text-white'
                                        : 'bg-alert-gradient border-rose-400 text-white'
                                    }`}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            {receiptData.isDeductible ? <ShieldCheck className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight italic uppercase">
                                                {receiptData.isDeductible ? 'Verified Deductible' : 'Liability Risk Flagged'}
                                            </h3>
                                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">
                                                Audit Hash: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest">
                                            {new Date().toLocaleDateString('en-KE')}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Data Visual Grid */}
                                    <Card className="border-navy-100 bg-white rounded-3xl p-6 shadow-sm">
                                        <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-6">Extracted Metadata</h4>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-800 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-navy-400 uppercase">Merchant Entity</p>
                                                    <p className="text-sm font-black text-navy-900">{receiptData.merchantName || 'ENTITY_NOT_FOUND'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-800 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                                                    <ScanLine className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-navy-400 uppercase">Statutory KRA PIN</p>
                                                    <p className={`text-sm font-black ${receiptData.kraPin ? 'text-emerald-700' : 'text-rose-600'}`}>
                                                        {receiptData.kraPin || 'MISSING_PIN'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-800 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                                                    <FileSearch className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-navy-400 uppercase">Category Allocation</p>
                                                    <p className="text-sm font-black text-navy-900">{receiptData.category}</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-navy-50 flex items-baseline justify-between">
                                                <span className="text-xs font-bold text-navy-500 uppercase">Total Liquid Value</span>
                                                <span className="text-2xl font-black text-navy-950">
                                                    {receiptData.totalAmount ? `KES ${receiptData.totalAmount.toLocaleString()}` : '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Action items & Items list */}
                                    <div className="space-y-6">
                                        <Card className="border-navy-100 bg-white rounded-3xl p-6 shadow-sm overflow-hidden relative">
                                            <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.2em] mb-4">Itemized Breakdown</h4>
                                            <div className="space-y-3 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                                                {receiptData.items.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/50 border border-navy-50 hover:bg-navy-50 transition-colors">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-navy-300" />
                                                        <p className="text-xs font-bold text-navy-800">{item}</p>
                                                    </div>
                                                ))}
                                                {receiptData.items.length === 0 && (
                                                    <p className="text-xs text-navy-400 italic">No line items identified</p>
                                                )}
                                            </div>
                                        </Card>

                                        {!receiptData.isDeductible && (
                                            <div className="p-6 rounded-3xl bg-rose-600 border border-rose-500 shadow-xl shadow-rose-200">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Tax Optimization Warning
                                                </h4>
                                                <p className="text-xs text-rose-100 leading-relaxed font-medium">
                                                    This expense is non-deductible for Corporate Tax reporting. To unlock savings, ensure all future procurement is sourced from vendors with verified eTIMS compliance.
                                                </p>
                                                <button className="mt-4 w-full py-2.5 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors shadow-lg">
                                                    View Compliant Vendors
                                                </button>
                                            </div>
                                        )}

                                        {receiptData.isDeductible && (
                                            <Button variant="outline" className="w-full h-12 rounded-2xl border-navy-200 font-bold text-navy-800 hover:bg-navy-900 hover:text-white transition-all">
                                                Push to iTax Ledger
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Verification Steps Overlay (Optional Visual) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-navy-50 shadow-sm opacity-60">
                    <div className="h-8 w-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-400">1</div>
                    <p className="text-[10px] font-bold text-navy-800 uppercase tracking-widest">OCR Extraction</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-navy-50 shadow-sm opacity-60">
                    <div className="h-8 w-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-400">2</div>
                    <p className="text-[10px] font-bold text-navy-800 uppercase tracking-widest">PIN Verification</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-navy-50 shadow-sm opacity-60">
                    <div className="h-8 w-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-400">3</div>
                    <p className="text-[10px] font-bold text-navy-800 uppercase tracking-widest">ledger Entry</p>
                </div>
            </div>
        </div>
    )
}

