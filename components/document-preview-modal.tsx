"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Printer, ShieldCheck, X, FileSearch } from "lucide-react"

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
            const frame = requestAnimationFrame(() => setIsVisible(true))
            document.body.classList.add('overflow-hidden')
            return () => cancelAnimationFrame(frame)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            document.body.classList.remove('overflow-hidden')
            return () => {
                clearTimeout(timer)
                document.body.classList.remove('overflow-hidden')
            }
        }
    }, [isOpen])

    if (!isOpen && !isVisible) return null

    return (
        <div className={`fixed inset-0 w-full h-full z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 w-full h-full bg-navy-950/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-5xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] flex flex-col bg-white rounded-none sm:rounded-[40px] shadow-2xl border-none sm:border sm:border-navy-50 overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                {/* Statutory Top Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-navy-400 via-navy-900 to-navy-400 z-50" />

                {/* Header */}
                <div className="flex flex-row items-center justify-between p-4 sm:p-8 border-b border-navy-50 bg-white relative z-10 gap-4">
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                        <div className={`h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-xl ${type === 'contract' ? 'bg-navy-950' : 'bg-blue-600'}`}>
                            <FileSearch className="h-5 w-5 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-2xl font-black text-navy-950 uppercase tracking-tighter italic truncate">{title}</h2>
                            <p className="font-bold text-navy-400 text-[8px] sm:text-[10px] uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                                <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500" />
                                Statutory Instrument • 2026
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-full bg-navy-50 text-navy-400 hover:bg-navy-900 hover:text-white transition-all flex items-center justify-center shadow-inner flex-shrink-0"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content Area - Realistic Paper Simulation */}
                <div className="flex-grow min-h-0 overflow-y-auto p-4 sm:p-8 md:p-12 bg-navy-50/20 custom-scrollbar-premium touch-pan-y scroll-smooth">
                    <div className="max-w-3xl mx-auto bg-white shadow-[0_30px_90px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-12 md:p-16 lg:p-20 min-h-full relative border border-navy-50 rounded-lg overflow-hidden">
                        {/* Realistic Institutional Header */}
                        <div className="mb-8 sm:mb-12 border-b-2 border-navy-950 pb-6 sm:pb-8 flex justify-between items-start gap-4">
                            <div className="space-y-1">
                                <h3 className="text-sm sm:text-xl font-black text-navy-950 uppercase tracking-widest">ComplyKe Protocol</h3>
                                <p className="text-[7px] sm:text-[9px] font-black text-navy-400 uppercase tracking-widest leading-normal sm:leading-none">
                                    Statutory Compliance Framework <br className="hidden sm:block" />
                                    Section 25/26 - Republic of Kenya
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="h-10 w-10 sm:h-16 sm:w-16 bg-navy-900 p-2 sm:p-3 rounded-xl border border-navy-950 shadow-xl flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-current">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                                    </svg>
                                </div>
                                <p className="mt-2 text-[6px] sm:text-[8px] font-black text-navy-900 uppercase tracking-[0.2em] hidden sm:block">Institutional</p>
                            </div>
                        </div>

                        {/* Document Content */}
                        <div className="prose prose-sm max-w-none text-navy-900 leading-[1.6] sm:leading-[1.8] font-serif whitespace-pre-line text-[12px] sm:text-sm md:text-base border-l-2 sm:border-l-4 border-navy-50 pl-4 sm:pl-10">
                            {content}
                        </div>

                        {/* Signatures Floor */}
                        <div className="mt-12 sm:mt-20 pt-8 sm:pt-12 border-t border-dotted border-navy-200 grid grid-cols-2 gap-8 sm:gap-20">
                            <div className="space-y-4">
                                <div className="h-px bg-navy-100" />
                                <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-navy-400 text-center">Employer Authorized Official</p>
                            </div>
                            <div className="space-y-4">
                                <div className="h-px bg-navy-100" />
                                <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-navy-400 text-center">Subject Consent Signature</p>
                            </div>
                        </div>

                        {/* Watermark Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none uppercase font-black text-2xl sm:text-8xl -rotate-12 border-2 sm:border-4 border-navy-900 m-8 sm:m-20">
                            OFFICIAL PREVIEW
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-8 border-t border-navy-50 bg-white relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pb-6 sm:pb-8">
                    <div className="hidden sm:flex flex-col gap-1 w-full sm:w-auto text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] font-black text-navy-900 uppercase tracking-widest">
                            Statutory Engine v2.10
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">
                            Verified Protocol • {new Date().toLocaleDateString('en-KE')}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={onDownloadWord}
                            className="flex-1 sm:flex-initial h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-navy-100 font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-navy-800 hover:bg-navy-50 transition-all"
                        >
                            <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Word
                        </Button>
                        <Button
                            onClick={onDownloadPDF}
                            className="flex-1 sm:flex-initial h-12 sm:h-14 px-6 sm:px-10 rounded-xl sm:rounded-2xl bg-navy-950 hover:bg-black text-white font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl transition-all"
                        >
                            <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> PDF
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => window.print()}
                            className="hidden md:flex h-14 w-14 rounded-2xl text-navy-300 hover:text-navy-950 hover:bg-navy-50 border border-transparent hover:border-navy-50"
                        >
                            <Printer className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
