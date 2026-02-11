"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, AlertCircle, Fingerprint } from "lucide-react"
import { validateKRAPINFormat } from "@/lib/kra-validation"

export default function KRAPINChecker() {
    const [pin, setPin] = useState("")
    const [result, setResult] = useState<ReturnType<typeof validateKRAPINFormat> | null>(null)

    const handleCheck = () => {
        const validation = validateKRAPINFormat(pin)
        setResult(validation)
    }

    return (
        <Card className="glass-card shadow-lg border-none overflow-hidden group">
            <div className={`h-1 w-full transition-colors duration-500 ${result ? (result.valid ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-navy-200'}`} />
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-navy-50 p-2 rounded-lg group-hover:bg-navy-100 transition-colors">
                        <Fingerprint className="h-5 w-5 text-navy-800" />
                    </div>
                    <CardTitle className="text-lg font-bold text-navy-900">
                        KRA PIN Validator
                    </CardTitle>
                </div>
                <CardDescription className="text-navy-500 font-medium text-xs">
                    Institutional verification of Individual & Business PIN formats
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., P051234567X"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="bg-white border-navy-100 font-mono focus:ring-navy-500 uppercase h-11"
                        />
                        <Button onClick={handleCheck} className="h-11 px-6 bg-navy-900 shadow-sm hover:shadow-md transition-all">
                            Check
                        </Button>
                    </div>

                    {result && (
                        <div className={`p-4 rounded-2xl flex items-start gap-3 animate-fade-in ${result.valid
                                ? 'bg-emerald-50/50 border border-emerald-100 shadow-sm'
                                : 'bg-rose-50/50 border border-rose-100'
                            }`}>
                            <div className={`p-2 rounded-xl scale-90 ${result.valid ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}`}>
                                {result.valid ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-black uppercase tracking-tight ${result.valid ? 'text-emerald-900' : 'text-rose-900'}`}>
                                    {result.valid ? 'Format Verified' : 'Validation Failed'}
                                </p>
                                <p className={`text-xs font-medium leading-relaxed mt-0.5 ${result.valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {result.message}
                                </p>
                                {result.valid && result.pinType && (
                                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-emerald-600/10 text-[10px] font-black text-emerald-700 uppercase tracking-tighter border border-emerald-200">
                                        PIN TYPE: {result.pinType}
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
