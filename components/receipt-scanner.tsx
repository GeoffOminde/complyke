"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInstitutionalUI } from "@/contexts/ui-context"
import { useAuth } from "@/contexts/auth-context"
import { canAccessFeature } from "@/lib/entitlements"
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
    Info,
    BadgeCheck,
    History
} from "lucide-react"

interface ReceiptData {
    merchantName: string | null
    kraPin: string | null
    totalAmount: number | null
    date: string | null
    items: string[]
    isDeductible: boolean
    category: string
    verificationStatus: 'verified' | 'unverified' | 'failed'
    etimsSignature: string | null
    auditHash: string
}

type StepState = 'idle' | 'active' | 'success' | 'fail'

export default function ReceiptScanner() {
    const { profile } = useAuth()
    const { showAlert, showToast } = useInstitutionalUI()
    const [isScanning, setIsScanning] = useState(false)
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [isLedgerSubmitting, setIsLedgerSubmitting] = useState(false)
    const [isVendorsLoading, setIsVendorsLoading] = useState(false)
    const [workflowState, setWorkflowState] = useState<{
        ocr: StepState
        pin: StepState
        ledger: StepState
    }>({
        ocr: 'idle',
        pin: 'idle',
        ledger: 'idle',
    })
    const [scanCredits, setScanCredits] = useState(0)
    const [scanMode, setScanMode] = useState<'standard' | 'fuel'>('standard')

    const loadCredits = async () => {
        try {
            const res = await fetch('/api/credits')
            if (!res.ok) return
            const data = await res.json()
            setScanCredits(Number(data?.credits?.scan || 0))
        } catch {
            // no-op
        }
    }

    useEffect(() => {
        void loadCredits()
    }, [])

    const handleFileUpload = async (file: File) => {
        if (!file) return
        const hasPlanAccess = canAccessFeature(profile?.subscription_plan, 'receipts', profile?.subscription_end_date)
        if (!hasPlanAccess) {
            if (scanCredits <= 0) {
                showAlert('Tier Restricted', 'Tax Lens requires Micro-Entity+ plan or a Scan pay-per-use credit.')
                return
            }
        }

        setWorkflowState({
            ocr: 'active',
            pin: 'idle',
            ledger: 'idle',
        })
        setIsScanning(true)
        setError(null)
        setReceiptData(null)

        try {
            const formData = new FormData()
            formData.append('image', file)
            formData.append('mode', scanMode) // Pass mode to API

            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setReceiptData(data.data)
            const verificationStatus = data.data?.verificationStatus as ReceiptData['verificationStatus'] | undefined
            const isDeductible = Boolean(data.data?.isDeductible)
            setWorkflowState({
                ocr: 'success',
                pin: verificationStatus === 'verified' ? 'success' : 'fail',
                ledger: verificationStatus === 'verified' && isDeductible ? 'active' : 'fail',
            })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to scan receipt'
            console.error('Scan error:', message)
            setError(message || 'Failed to scan receipt. Please ensure your cloud services are correctly configured.')
            setWorkflowState({
                ocr: 'fail',
                pin: 'fail',
                ledger: 'fail',
            })
        } finally {
            setIsScanning(false)
            if (!hasPlanAccess) {
                void loadCredits()
            }
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

    const handleViewCompliantVendors = async () => {
        try {
            setIsVendorsLoading(true)
            const res = await fetch('/api/vendors/compliant')
            const data = await res.json()
            if (!res.ok) {
                showAlert('Vendor Registry Error', data.error || 'Failed to load compliant vendors.')
                return
            }
            const lines = (data.vendors || [])
                .map((v: { name: string; category: string; location: string }) => `${v.name} • ${v.category} • ${v.location}`)
                .join('\n')
            showAlert('Compliant Vendor Registry', lines || 'No verified vendors found.')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch vendor registry'
            showAlert('Vendor Registry Error', message)
        } finally {
            setIsVendorsLoading(false)
        }
    }

    const handlePushToItaxLedger = async () => {
        if (!receiptData) return
        try {
            setWorkflowState(prev => ({ ...prev, ledger: 'active' }))
            setIsLedgerSubmitting(true)
            const res = await fetch('/api/itax/ledger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchantName: receiptData.merchantName,
                    kraPin: receiptData.kraPin,
                    totalAmount: receiptData.totalAmount,
                    date: receiptData.date,
                    category: receiptData.category,
                    auditHash: receiptData.auditHash,
                    etimsSignature: receiptData.etimsSignature,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                showAlert('iTax Queue Error', data.error || 'Failed to queue receipt for iTax sync.')
                setWorkflowState(prev => ({ ...prev, ledger: 'fail' }))
                return
            }
            setWorkflowState(prev => ({ ...prev, ledger: 'success' }))
            showToast('Receipt queued for iTax ledger sync.', 'success')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to push receipt to iTax'
            showAlert('iTax Queue Error', message)
            setWorkflowState(prev => ({ ...prev, ledger: 'fail' }))
        } finally {
            setIsLedgerSubmitting(false)
        }
    }

    const stepChipClasses = (state: StepState) => {
        if (state === 'success') return 'bg-emerald-50 border-emerald-200 text-emerald-700'
        if (state === 'fail') return 'bg-rose-50 border-rose-200 text-rose-700'
        if (state === 'active') return 'bg-navy-100 border-navy-200 text-navy-900'
        return 'bg-white border-navy-50 text-navy-500'
    }

    const stepIcon = (state: StepState, index: number) => {
        if (state === 'success') return <CheckCircle2 className="h-4 w-4" />
        if (state === 'fail') return <XCircle className="h-4 w-4" />
        if (state === 'active') return <Loader2 className="h-4 w-4 animate-spin" />
        return <span className="text-xs font-bold">{index}</span>
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
                {receiptData && receiptData.verificationStatus === 'verified' && (
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Last Ledger Entry</p>
                        <p className="text-sm font-black text-navy-900 flex items-center gap-2">
                            {receiptData.merchantName} <span className="text-emerald-500">•</span> KES {receiptData.totalAmount?.toLocaleString()}
                        </p>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScanMode('standard')}
                        className={`px-4 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${scanMode === 'standard' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-400 border-navy-100 hover:bg-navy-50'}`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => setScanMode('fuel')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${scanMode === 'fuel' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200' : 'bg-white text-navy-400 border-navy-100 hover:bg-navy-50'}`}
                    >
                        <ScanLine className="h-3 w-3" />
                        Fuel Protocol
                    </button>
                </div>
            </div>

            <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32 transition-colors duration-500 ${scanMode === 'fuel' ? 'bg-rose-600' : 'bg-navy-600'}`} />
                <CardHeader className="relative z-10 border-b border-navy-100/50 pb-8">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-colors duration-500 ${scanMode === 'fuel' ? 'bg-rose-600 shadow-rose-200' : 'bg-navy-900 shadow-navy-200'}`}>
                            {scanMode === 'fuel' ? <ScanLine className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-navy-950">
                                {scanMode === 'fuel' ? 'Fuel Levy Audit' : 'Institutional Asset Scan'}
                            </CardTitle>
                            <CardDescription className="text-navy-500 font-medium">
                                {scanMode === 'fuel' ? 'Validate Petrol Station eTIMS Signatures (Mandatory)' : 'Verify deductible expenses against 2026 KRA regulations'}
                            </CardDescription>
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
                            className={`relative transition-all duration-500 rounded-[32px] border-2 border-dashed p-8 md:p-12 flex flex-col items-center justify-center text-center ${dragActive
                                ? 'border-navy-900 bg-navy-50 scale-[0.99]'
                                : 'border-navy-200 bg-white hover:border-navy-300'
                                }`}
                        >
                            <div className={`p-4 rounded-3xl mb-4 transition-all duration-500 ${dragActive ? 'bg-navy-900 text-white rotate-12' : 'bg-navy-50 text-navy-600'}`}>
                                {isScanning ? (
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                ) : (
                                    <Receipt className="h-10 w-10" />
                                )}
                            </div>

                            <div className="space-y-1 mb-8">
                                <h3 className="text-lg font-black text-navy-950 uppercase tracking-tight">
                                    {isScanning ? 'Processing Statutory Data...' : 'Submit Institutional Receipt'}
                                </h3>
                                <p className="text-sm text-navy-500 font-medium max-w-xs mx-auto">
                                    Our model identifies KRA PINs and eTIMS signatures automatically.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md z-20">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        document.getElementById('receipt-upload')?.click()
                                    }}
                                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-navy-100 bg-white text-navy-900 font-bold hover:bg-navy-50 hover:border-navy-200 transition-all group"
                                    disabled={isScanning}
                                >
                                    <div className="bg-navy-100 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <Upload className="h-5 w-5 text-navy-600" />
                                    </div>
                                    <span>Upload File</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        document.getElementById('receipt-camera')?.click()
                                    }}
                                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition-all shadow-xl shadow-navy-200 group"
                                    disabled={isScanning}
                                >
                                    <div className="bg-white/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                        <Camera className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <span>Scan with Camera</span>
                                </button>
                            </div>

                            <input
                                id="receipt-upload"
                                name="receipt_binary"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={onFileChange}
                                className="hidden"
                                disabled={isScanning}
                            />
                            <input
                                id="receipt-camera"
                                name="receipt_camera"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={onFileChange}
                                className="hidden"
                                disabled={isScanning}
                            />

                            {/* Decorative Corner Accents */}
                            <div className="absolute top-6 left-6 h-6 w-6 border-t-2 border-l-2 border-navy-200 rounded-tl" />
                            <div className="absolute top-6 right-6 h-6 w-6 border-t-2 border-r-2 border-navy-200 rounded-tr" />
                            <div className="absolute bottom-6 left-6 h-6 w-6 border-b-2 border-l-2 border-navy-200 rounded-bl" />
                            <div className="absolute bottom-6 right-6 h-6 w-6 border-b-2 border-r-2 border-navy-200 rounded-br" />
                        </div>

                        {/* Legal Note */}
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-navy-50 border border-navy-100">
                            <Info className="h-5 w-5 text-navy-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-navy-600 font-medium leading-relaxed">
                                <span className="font-black text-navy-900 uppercase">Attention:</span> Section 23A of the Tax Procedures Act. Only eTIMS-validated receipts are deductible for Corporate Tax. Non-compliant receipts will be flagged as &quot;High Liability&quot;.
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
                                                {receiptData.verificationStatus === 'verified' ? 'Statutory Verified' :
                                                    receiptData.verificationStatus === 'failed' ? 'PIN format Failed' :
                                                        'Awaiting E-TIMS Handshake'}
                                            </h3>
                                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">
                                                Audit Hash: {receiptData.auditHash}
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
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-black ${receiptData.verificationStatus === 'failed' ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                            {receiptData.kraPin || 'MISSING_PIN'}
                                                        </p>
                                                        {receiptData.verificationStatus === 'verified' && (
                                                            <BadgeCheck className="h-3 w-3 text-emerald-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-800 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-navy-400 uppercase">eTIMS Control Unit (CUSN)</p>
                                                    <p className={`text-[11px] font-mono font-bold ${receiptData.etimsSignature ? 'text-navy-900' : 'text-rose-500'}`}>
                                                        {receiptData.etimsSignature || 'SIGNATURE_NOT_DETECTED'}
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
                                                <button
                                                    onClick={handleViewCompliantVendors}
                                                    disabled={isVendorsLoading}
                                                    className="mt-4 w-full py-2.5 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors shadow-lg disabled:opacity-60"
                                                >
                                                    {isVendorsLoading ? 'Loading Vendors...' : 'View Compliant Vendors'}
                                                </button>
                                            </div>
                                        )}

                                        {receiptData.isDeductible && (
                                            <Button
                                                onClick={handlePushToItaxLedger}
                                                disabled={isLedgerSubmitting}
                                                variant="outline"
                                                className="w-full h-12 rounded-2xl border-navy-200 font-bold text-navy-800 hover:bg-navy-900 hover:text-white transition-all disabled:opacity-60"
                                            >
                                                {isLedgerSubmitting ? 'Queueing...' : 'Push to iTax Ledger'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Verification Workflow Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm transition-colors ${stepChipClasses(workflowState.ocr)}`}>
                    <div className="h-8 w-8 rounded-lg bg-white/70 border border-current/20 flex items-center justify-center">
                        {stepIcon(workflowState.ocr, 1)}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Phase 1: OCR</p>
                        <p className="text-[8px] text-navy-400 font-bold uppercase mt-1">Vision Extraction</p>
                    </div>
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm transition-colors ${stepChipClasses(workflowState.pin)}`}>
                    <div className="h-8 w-8 rounded-lg bg-white/70 border border-current/20 flex items-center justify-center">
                        {stepIcon(workflowState.pin, 2)}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Phase 2: PIN</p>
                        <p className="text-[8px] text-navy-400 font-bold uppercase mt-1">Statutory Match</p>
                    </div>
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm transition-colors ${stepChipClasses(workflowState.ledger)}`}>
                    <div className="h-8 w-8 rounded-lg bg-white/70 border border-current/20 flex items-center justify-center">
                        {stepIcon(workflowState.ledger, 3)}
                    </div>
                    <div>
                    </div>
                </div>

                {/* Recent Scans Log (Simulated Persistence) */}
                {receiptData && (
                    <Card className="border-navy-50 shadow-lg rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="py-6 px-8 bg-navy-50/30 border-b border-navy-50">
                            <CardTitle className="text-sm font-black text-navy-900 uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-navy-400" />
                                Recent Statutory Scans
                            </CardTitle>
                        </CardHeader>
                        <div className="divide-y divide-navy-50">
                            <div className="p-6 flex items-center justify-between hover:bg-navy-50/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${receiptData.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {receiptData.verificationStatus === 'verified' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-navy-950 uppercase">{receiptData.merchantName || 'Unknown Entity'}</p>
                                        <p className="text-[10px] font-mono text-navy-400 uppercase tracking-widest mt-0.5">
                                            Ref: {receiptData.auditHash.substring(0, 8)}... • {new Date().toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-navy-900">KES {receiptData.totalAmount?.toLocaleString()}</p>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${receiptData.verificationStatus === 'verified' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {receiptData.verificationStatus === 'verified' ? 'Ledger Synced' : 'Audit Failed'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

