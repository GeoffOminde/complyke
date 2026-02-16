"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, X, ShieldCheck, Sparkles, User, Bot } from "lucide-react"

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function WakiliChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Jambo! I'm Wakili AI, your institutional legal expert for Kenyan business compliance. I have comprehensive knowledge of all Kenyan statutory law from inception through February 2026, including:\n\n- Employment Act 2007 (all amendments)\n- Data Protection Act 2019 and ODPC regulations\n- Tax Procedures Act and KRA compliance history\n- NSSF evolution (Tier I/II through Phase 4)\n- NHIF -> SHIF transition (2023-2026)\n- Housing Levy implementation (2023-2026)\n- All PAYE tax bands and historical rates\n- eTIMS requirements and enforcement\n- Minimum wage regulations (historical and current)\n\nHow can I assist your business with compliance today?"
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: input }]
                })
            })

            const data = await response.json()

            if (!response.ok) {
                const errorMessage = data.error || 'Institutional Gateway timeout'
                const errorDetail = data.detail || 'Handshake failed'
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Vault Auth Error: ${errorMessage}\n\nDetail: ${errorDetail}`
                }])
                return
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.message
            }])
        } catch (error: unknown) {
            console.error('Handshake Failed:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Communication Protocol Failed. Please verify your institutional connection."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const quickPrompts = [
        "Draft Employee Contract",
        "Calculate Housing Levy",
        "Explain SHIF Rates",
        "Data Protection Policy",
        "PAYE Calculator 2026",
        "NSSF Tier II Rules"
    ]

    const handleClearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Jambo! I'm Wakili AI, your institutional legal expert for Kenyan business compliance. I have comprehensive knowledge of all Kenyan statutory law from inception through February 2026.\n\nHow can I assist your business with compliance today?"
            }
        ])
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-2xl hover:bg-navy-950 hover:scale-110 active:scale-95 transition-all duration-300 group"
                aria-label="Open Wakili AI Chat"
            >
                <div className="absolute inset-0 bg-blue-500 rounded-2xl animate-pulse blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <MessageCircle className="h-7 w-7 relative z-10" />
            </button>
        )
    }

    return (
        <div className="fixed bottom-4 right-2 left-2 sm:left-auto sm:bottom-8 sm:right-8 z-40 w-auto sm:w-[400px] sm:max-w-[calc(100vw-2rem)] animate-slide-in">
            <Card className="shadow-2xl border-none overflow-hidden glass-card flex flex-col max-h-[85vh]">
                <div className="h-1.5 bg-compliance-gradient flex-shrink-0" />
                <CardHeader className="bg-navy-950 text-white p-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600/20 p-2 rounded-xl">
                                <Bot className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    Wakili AI
                                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                </CardTitle>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <p className="text-[10px] text-navy-400 font-bold uppercase tracking-widest">Full Statutory Archive - 2007-2026</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClearChat}
                                className="rounded-xl p-2 hover:bg-white/10 transition-colors text-navy-400 hover:text-white"
                                title="Clear Conversation"
                            >
                                <Sparkles className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl p-2 hover:bg-white/10 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-navy-50/30 custom-scrollbar">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${message.role === 'user' ? 'bg-navy-800' : 'bg-white shadow-sm border border-navy-100'
                                    }`}>
                                    {message.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-navy-800" />}
                                </div>
                                <div
                                    className={`max-w-[85%] px-4 py-3 shadow-sm ${message.role === 'user'
                                        ? 'bg-navy-900 text-white rounded-2xl rounded-tr-none'
                                        : 'bg-white text-navy-950 border border-navy-100 rounded-2xl rounded-tl-none'
                                        }`}
                                >
                                    <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start gap-3">
                                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-white shadow-sm border border-navy-100 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-navy-800" />
                                </div>
                                <div className="bg-white border border-navy-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="h-1.5 w-1.5 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="h-1.5 w-1.5 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="h-1.5 w-1.5 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs font-bold text-navy-400 uppercase tracking-widest">Consulting Statutes...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts */}
                    <div className="px-4 pt-4 pb-4 bg-white border-t border-navy-50 overflow-x-auto custom-scrollbar">
                        <div className="flex gap-2">
                            {quickPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(prompt)}
                                    className="flex-shrink-0 px-3 py-1.5 rounded-full bg-navy-50 border border-navy-100 text-[10px] font-bold text-navy-600 uppercase tracking-wide hover:bg-navy-100 hover:text-navy-900 transition-colors whitespace-nowrap"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 pb-6 bg-white">
                        <div className="flex gap-2 p-1.5 border-2 border-navy-50 rounded-2xl bg-navy-50 focus-within:border-navy-200 transition-all shadow-inner">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Message Wakili AI..."
                                disabled={isLoading}
                                className="flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none h-10 px-3 font-medium text-navy-900 placeholder:text-navy-400"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                size="icon"
                                className="h-10 w-10 rounded-xl bg-navy-900 shadow-xl hover:bg-navy-800 transition-colors"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between mt-3 px-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                <p className="text-[10px] text-navy-400 font-bold uppercase tracking-wider">Statutory Intelligence</p>
                            </div>
                            <p className="text-[10px] text-navy-300 font-bold uppercase tracking-wider">AI May Make Errors</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
