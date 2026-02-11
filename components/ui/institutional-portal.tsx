"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle2, AlertTriangle, Info, X, ChevronRight, Scale } from "lucide-react"
import { Button } from "./button"

interface ToastProps {
    message: string
    type: 'success' | 'warning' | 'error' | 'info'
    onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        error: <X className="h-5 w-5 text-rose-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />
    }

    return (
        <div className="fixed top-24 right-6 z-[200] animate-slide-in-right">
            <div className="bg-white border border-navy-100 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 min-w-[300px]">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-navy-950">{message}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-navy-50 rounded-lg transition-colors">
                    <X className="h-4 w-4 text-navy-400" />
                </button>
            </div>
            <div className="h-1 bg-navy-50 absolute bottom-0 left-0 right-0 rounded-b-2xl overflow-hidden">
                <div className="h-full bg-navy-900 animate-progress-shrink" style={{ animationDuration: '5s' }} />
            </div>
        </div>
    )
}

interface ActionModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm?: (input?: string) => void
    onCancel: () => void
    showInput?: boolean
    inputPlaceholder?: string
    type?: 'confirm' | 'alert' | 'prompt' | 'institutional'
}

export function ActionModal({
    isOpen,
    title,
    message,
    confirmText = "Proceed",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    showInput = false,
    inputPlaceholder = "",
    type = 'confirm'
}: ActionModalProps) {
    const [inputValue, setInputValue] = useState("")

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
            <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in-up">
                {/* Institutional Header */}
                <div className="bg-navy-950 p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Scale className="h-24 w-24" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                            <Shield className="h-5 w-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-300">Statutory Protocol</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight leading-tight">{title}</h2>
                </div>

                {/* Content */}
                <div className="p-10 space-y-6">
                    <p className="text-navy-600 font-medium leading-relaxed">{message}</p>

                    {showInput && (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-navy-400">Parameter Input</label>
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={inputPlaceholder}
                                className="w-full h-16 px-6 bg-navy-50 rounded-2xl border-2 border-navy-50 focus:border-navy-900 focus:bg-white outline-none font-bold text-navy-950 transition-all placeholder:text-navy-300"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 pb-10 flex gap-4">
                    {type !== 'alert' && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1 h-14 rounded-2xl border-navy-100 text-navy-600 font-bold hover:bg-navy-50 transition-all"
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        onClick={() => onConfirm?.(showInput ? inputValue : undefined)}
                        className="flex-[1.5] h-14 rounded-2xl bg-navy-900 text-white font-black uppercase tracking-widest text-xs hover:bg-navy-800 transition-all shadow-xl shadow-navy-100 flex items-center justify-center gap-2 group"
                    >
                        {confirmText}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
