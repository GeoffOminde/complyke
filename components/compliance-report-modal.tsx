"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, AlertTriangle, FileCheck2, Download, X } from "lucide-react"

interface AuditResult {
    id: string
    label: string
    status: 'pass' | 'fail' | 'warn'
    detail: string
    impact: number
}

interface ComplianceReportModalProps {
    isOpen: boolean
    onClose: () => void
    score: number
    results: AuditResult[]
    timestamp: Date | null
}

export default function ComplianceReportModal({ isOpen, onClose, score, results, timestamp }: ComplianceReportModalProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = () => {
        setIsExporting(true)
        setTimeout(() => setIsExporting(false), 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[32px] md:rounded-[40px] w-[95vw] md:w-full max-h-[90vh] md:max-h-[85vh] flex flex-col md:block">
                <div className="flex flex-col lg:grid lg:grid-cols-3 h-full overflow-hidden">
                    {/* Sidebar / Score Area */}
                    <div className="lg:col-span-1 bg-navy-950 text-white p-6 md:p-8 relative overflow-hidden flex flex-col shrink-0">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-600" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20" />

                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center space-y-6 py-4 lg:py-0">
                            <div className="relative h-32 w-32 md:h-48 md:w-48 mx-auto">
                                <svg className="h-full w-full -rotate-90">
                                    <circle
                                        cx="50%" cy="50%" r="45%"
                                        className="fill-none stroke-white/10 stroke-[6] md:stroke-[8]"
                                    />
                                    <circle
                                        cx="50%" cy="50%" r="45%"
                                        className="fill-none stroke-emerald-400 stroke-[6] md:stroke-[8] transition-all duration-1000 ease-out"
                                        style={{
                                            strokeDasharray: '283',
                                            strokeDashoffset: (283 - (283 * score) / 100).toString()
                                        }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl md:text-5xl font-black">{score}%</span>
                                    <span className="text-[8px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Safety Score</span>
                                </div>
                            </div>

                            <div className="space-y-1 md:space-y-2">
                                <h3 className="font-bold text-lg md:text-xl">Institutional Audit</h3>
                                {timestamp && (
                                    <p className="text-[10px] md:text-xs text-navy-300 font-mono">
                                        Verified: {timestamp.toLocaleTimeString()}
                                    </p>
                                )}
                            </div>

                            <div className="w-full pt-4 md:pt-8 space-y-2 md:space-y-3 hidden sm:block">
                                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                                    <p className="text-[8px] md:text-[10px] font-black uppercase text-navy-400">Statutory Risk</p>
                                    <p className="text-xs md:text-sm font-bold text-white">Minimal Exposure</p>
                                </div>
                                <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                                    <p className="text-[8px] md:text-[10px] font-black uppercase text-navy-400">Audit Readiness</p>
                                    <p className="text-xs md:text-sm font-bold text-emerald-400">Review Complete</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 pt-4 md:pt-8 mt-auto hidden lg:block">
                            <Button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full h-14 bg-white text-navy-950 font-black uppercase tracking-widest text-xs hover:bg-navy-100 transition-colors shadow-lg shadow-black/20"
                            >
                                {isExporting ? 'Generating PDF...' : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Certificate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 bg-white flex flex-col relative h-full overflow-hidden">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-navy-50 text-navy-400 hover:bg-navy-900 hover:text-white transition-all z-20"
                        >
                            <X className="h-4 w-4 md:h-5 md:w-5" />
                        </button>

                        <div className="p-6 md:p-8 border-b border-navy-50 bg-white sticky top-0 z-10 shrink-0">
                            <h2 className="text-xl md:text-2xl font-black text-navy-950 uppercase tracking-tight flex items-center gap-3">
                                <FileCheck2 className="h-5 w-5 md:h-6 md:w-6 text-navy-400" />
                                Protocol Findings
                            </h2>
                            <p className="text-xs md:text-sm text-navy-500 font-medium mt-1">Detailed breakdown of statutory compliance checks.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 md:space-y-4 custom-scrollbar">
                            {results.map((check) => (
                                <div key={check.id} className="p-4 md:p-5 rounded-2xl md:rounded-[24px] border border-navy-50 hover:bg-navy-50/50 transition-colors group">
                                    <div className="flex items-start gap-3 md:gap-4">
                                        <div className={`mt-1 h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${check.status === 'pass' ? 'bg-emerald-100 text-emerald-600' :
                                            check.status === 'warn' ? 'bg-amber-100 text-amber-600' :
                                                'bg-rose-100 text-rose-600'
                                            }`}>
                                            {check.status === 'pass' ? <ShieldCheck className="h-3 w-3 md:h-4 md:w-4" /> : <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                <h4 className="font-bold text-navy-900 text-sm md:text-base truncate mr-2">{check.label}</h4>
                                                <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 md:py-1 rounded-md shrink-0 ${check.status === 'pass' ? 'bg-emerald-50 text-emerald-600' :
                                                    check.status === 'warn' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-rose-50 text-rose-600'
                                                    }`}>
                                                    +{check.impact} Points
                                                </span>
                                            </div>
                                            <p className="text-xs md:text-sm text-navy-500 font-medium leading-relaxed">{check.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 md:p-6 bg-navy-50/50 border-t border-navy-50 text-center shrink-0 hidden md:block">
                            <p className="text-[8px] md:text-[10px] font-bold text-navy-400 uppercase tracking-widest">
                                Generated via ComplyKe Institutional Engine • {new Date().getFullYear()}
                            </p>
                        </div>

                        {/* Mobile Export Button (Fixed at bottom) */}
                        <div className="p-4 bg-white border-t border-navy-50 lg:hidden shrink-0 pb-safe">
                            <Button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full h-12 bg-navy-900 text-white font-black uppercase tracking-widest text-xs shadow-lg rounded-xl"
                            >
                                {isExporting ? 'Generating...' : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Certificate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
