"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, Printer, ShieldCheck, X, FileSearch } from "lucide-react"

interface DocumentPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    content: string
    onDownloadPDF?: () => void
    onDownloadWord?: () => void
    type?: 'contract' | 'policy'
}

export default function DocumentPreviewModal({
    isOpen,
    onClose,
    title,
    content,
    onDownloadPDF,
    onDownloadWord,
    type = 'contract'
}: DocumentPreviewModalProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            document.body.style.overflow = 'unset'
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isOpen && !isVisible) return null

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-navy-950/40 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-5xl h-[90vh] flex flex-col bg-white rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-navy-50 overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                {/* Statutory Top Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-navy-400 via-navy-900 to-navy-400 z-50" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-8 border-b border-navy-50 bg-white relative z-10 gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-2xl ${type === 'contract' ? 'bg-navy-950' : 'bg-blue-600'}`}>
                            <FileSearch className="h-7 w-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-navy-950 uppercase tracking-tighter italic">{title}</h2>
                            <p className="font-bold text-navy-400 text-[10px] uppercase tracking-widest flex items-center gap-2 mt-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                Institutional Statutory Instrument • Verified for 2026
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-full bg-navy-50 text-navy-400 hover:bg-navy-900 hover:text-white transition-all flex items-center justify-center shadow-inner"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area - Realistic Paper Simulation */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 md:p-20 bg-navy-50/20 custom-scrollbar">
                    <div className="max-w-3xl mx-auto bg-white shadow-[0_30px_90px_-15px_rgba(0,0,0,0.1)] p-12 sm:p-20 min-h-full relative border border-navy-50 rounded-lg">
                        {/* Realistic Institutional Header */}
                        <div className="mb-12 border-b-2 border-navy-950 pb-8 flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-navy-950 uppercase tracking-widest">Institution Protocol</h3>
                                <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest leading-none">Statutory Compliance Framework <br />Section 25/26 - Republic of Kenya</p>
                            </div>
                            <div className="text-right">
                                <div className="h-12 w-12 bg-navy-50 rounded-lg border border-navy-100 ml-auto flex items-center justify-center text-navy-200 font-black text-[10px]">LOGO</div>
                            </div>
                        </div>

                        {/* Document Content */}
                        <div className="prose prose-sm max-w-none text-navy-900 leading-[1.8] font-serif whitespace-pre-line text-sm sm:text-base border-l-4 border-navy-50 pl-10">
                            {content}
                        </div>

                        {/* Signatures Floor */}
                        <div className="mt-20 pt-12 border-t border-dotted border-navy-200 grid grid-cols-2 gap-20">
                            <div className="space-y-8">
                                <div className="h-1 bg-navy-100" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-navy-400 text-center">Employer Authorized Official</p>
                            </div>
                            <div className="space-y-8">
                                <div className="h-1 bg-navy-100" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-navy-400 text-center">Subject Consent Signature</p>
                            </div>
                        </div>

                        {/* Watermark Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none uppercase font-black text-8xl -rotate-12 border-4 border-navy-900 m-20">
                            OFFICIAL PREVIEW
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-navy-50 bg-white relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-navy-900 uppercase tracking-widest">
                            Statutory Engine v2.10
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">
                            Audit Trace: {Math.random().toString(36).substring(2, 12).toUpperCase()}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={onDownloadWord}
                            className="flex-1 md:flex-initial h-14 rounded-2xl border-navy-100 font-black text-[11px] uppercase tracking-widest text-navy-800 hover:bg-navy-50 transition-all"
                        >
                            <Download className="mr-3 h-5 w-5" /> Export Word
                        </Button>
                        <Button
                            onClick={onDownloadPDF}
                            className="flex-1 md:flex-initial h-14 px-10 rounded-2xl bg-navy-950 hover:bg-black text-white font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-navy-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Download className="mr-3 h-5 w-5" /> Export PDF
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => window.print()}
                            className="hidden sm:flex h-14 w-14 rounded-2xl text-navy-300 hover:text-navy-950 hover:bg-navy-50 border border-transparent hover:border-navy-50"
                        >
                            <Printer className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
