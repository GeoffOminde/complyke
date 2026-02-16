"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, AlertCircle, Fingerprint, ExternalLink } from "lucide-react"
interface KRAResult {
    valid?: boolean
    formatValid?: boolean
    authentic?: boolean
    message?: string
    pinType?: string
    status?: string
    auditId?: string
    grounding?: {
        citations: Array<{
            title: string
            uri?: string
            detail?: string
        }>
    }
}

export default function KRAPINChecker() {
    const [pin, setPin] = useState("")
    const [result, setResult] = useState<KRAResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleCheck = async () => {
        if (!pin) return
        setIsLoading(true)
        setResult(null)

        try {
            const response = await fetch('/api/kra/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin.toUpperCase() })
            })
            const data = await response.json()
            setResult(data)
        } catch (err: unknown) {
            console.error('Handshake failed:', err)
            setResult({ valid: false, message: 'Institutional handshake failed. Please check network protocols.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="glass-card shadow-lg border-none overflow-hidden group">
            <div className={`h-1 w-full transition-colors duration-500 ${result ? (result.authentic ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-navy-200'}`} />
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-navy-950 p-2 rounded-lg group-hover:bg-navy-900 transition-colors shadow-lg">
                        <Fingerprint className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-black text-navy-950 uppercase tracking-tight">
                        Statutory PIN Audit
                    </CardTitle>
                </div>
                <CardDescription className="text-navy-500 font-medium text-[10px] uppercase tracking-widest mt-1">
                    Database Handshake • 2026 iTax Ledger
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2 p-1.5 bg-navy-50 rounded-2xl border border-navy-100 focus-within:border-navy-200 transition-all">
                        <Input
                            placeholder="P051234567X"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="border-none bg-transparent font-mono focus-visible:ring-0 uppercase h-11 shadow-none"
                        />
                        <Button
                            onClick={handleCheck}
                            disabled={isLoading}
                            className="h-11 px-8 bg-navy-950 text-white rounded-xl shadow-xl hover:bg-navy-900 transition-all font-black uppercase text-[10px] tracking-widest"
                        >
                            {isLoading ? 'Verifying...' : 'Audit PIN'}
                        </Button>
                    </div>

                    {result && (
                        <div className={`p-5 rounded-[24px] flex items-start gap-4 animate-slide-in-up ${result.authentic
                            ? 'bg-emerald-50 border border-emerald-100'
                            : result.formatValid ? 'bg-amber-50 border border-amber-100' : 'bg-rose-50 border border-rose-100'
                            }`}>
                            <div className={`p-2.5 rounded-xl shrink-0 ${result.authentic ? 'bg-emerald-100 text-emerald-600' : result.formatValid ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                {result.authentic ? (
                                    <CheckCircle2 className="h-6 w-6" />
                                ) : (
                                    <AlertCircle className="h-6 w-6" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-4">
                                    <p className={`text-sm font-black uppercase tracking-tight ${result.authentic ? 'text-emerald-900' : result.formatValid ? 'text-amber-900' : 'text-rose-900'}`}>
                                        {result.authentic ? 'Statutory Verified' : result.formatValid ? 'Handshake Unverified' : 'Validation Failed'}
                                    </p>
                                    {result.auditId && (
                                        <span className="text-[9px] font-black text-navy-400 font-mono tracking-tighter">{result.auditId}</span>
                                    )}
                                </div>
                                <p className={`text-xs font-semibold leading-relaxed mt-1 ${result.authentic ? 'text-emerald-700' : result.formatValid ? 'text-amber-700' : 'text-rose-700'}`}>
                                    {result.message}
                                </p>

                                {result.valid && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <div className="px-3 py-1 rounded-full bg-navy-900/5 text-[9px] font-black text-navy-600 uppercase tracking-widest border border-navy-100">
                                            TYPE: {result.pinType || 'N/A'}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${result.authentic ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-amber-500/10 text-amber-700 border-amber-200'}`}>
                                            LEDGER: {result.status || 'UNRANKED'}
                                        </div>
                                    </div>
                                )}

                                {result.grounding && (
                                    <div className="mt-5 pt-4 border-t border-navy-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Search className="h-3 w-3 text-navy-400" />
                                            <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Grounding Citations via Vertex AI</p>
                                        </div>
                                        <div className="space-y-2">
                                            {result.grounding.citations.map((cite, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-navy-50 hover:border-navy-200 transition-colors cursor-pointer group/cite">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-navy-300 group-hover/cite:bg-navy-600 transition-colors" />
                                                        <p className="text-[10px] font-bold text-navy-800">{cite.title}</p>
                                                    </div>
                                                    <ExternalLink className="h-3 w-3 text-navy-300 group-hover/cite:text-navy-900 transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
