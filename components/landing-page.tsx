"use client"

import { Button } from "@/components/ui/button"
import { Shield, Zap, Receipt, FileText, CheckCircle, ArrowRight, Star, Quote } from "lucide-react"

interface LandingPageProps {
    onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Navigation - Simple translucent */}
            <nav className="fixed top-0 w-full z-50 glass-card bg-white/70 border-b border-navy-50/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-navy-950 flex items-center justify-center shadow-lg shadow-navy-900/20">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-black text-navy-950 tracking-tighter uppercase">ComplyKe</span>
                </div>
                <Button onClick={onGetStarted} className="bg-navy-950 text-white rounded-full px-8 hover:scale-105 transition-transform">
                    Sign In
                </Button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent -z-10" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-4 transition-all hover:bg-emerald-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest leading-none">Updated for February 2026 Rates</span>
                        </div>

                        <h1 className="text-6xl lg:text-8xl font-black text-navy-950 leading-[0.9] tracking-tighter">
                            Compliance <br />
                            <span className="text-emerald-500 italic">Redefined</span> <br />
                            for Kenya.
                        </h1>

                        <p className="text-xl text-navy-600 font-medium max-w-lg leading-relaxed">
                            Protect your SME from KRA fines and legal risks. Simple, AI-powered compliance management built specifically for the Kenyan ecosystem.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button onClick={onGetStarted} size="lg" className="h-16 px-10 bg-navy-950 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-navy-300 transform hover:-translate-y-1 transition-all">
                                Start 7-Day Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <div className="flex -space-x-4 items-center">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-12 w-12 rounded-full border-4 border-white overflow-hidden bg-navy-100 ring-2 ring-emerald-50">
                                        <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
                                    </div>
                                ))}
                                <div className="pl-8">
                                    <p className="text-sm font-black text-navy-950 uppercase tracking-widest leading-none">500+ Businesses</p>
                                    <p className="text-[10px] font-bold text-navy-600 mt-1 uppercase tracking-[0.2em]">Already staying safe</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Visual content: Dashboard Mockup */}
                        <div className="relative z-10 rounded-[40px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-navy-50">
                            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" alt="Dashboard Preview" className="w-full grayscale hover:grayscale-0 transition-all duration-700" />
                        </div>
                        {/* Floating badges */}
                        <div className="absolute -top-10 -left-10 z-20 glass-card p-6 rounded-3xl shadow-xl animate-float">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <Receipt className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-navy-900 leading-none italic">KRA Verified</h4>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase mt-1 tracking-widest">eTIMS Ready</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 z-20 bg-white p-6 rounded-3xl shadow-2xl border border-navy-50 animate-float-delayed">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Compliance Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-32 bg-navy-50 rounded-full overflow-hidden">
                                        <div className="h-full w-[85%] bg-emerald-500" />
                                    </div>
                                    <span className="font-black text-navy-900 text-sm italic">85%</span>
                                </div>
                                <p className="text-[10px] font-bold text-emerald-600 leading-none">Statutory Liability Reduced</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 bg-navy-50/30">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">The Strategic Pillars</h2>
                        <h3 className="text-5xl font-black text-navy-950 tracking-tighter italic lg:text-6xl">Everything you need for Kenyan compliance.</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Receipt,
                                title: "Tax Lens OCR",
                                desc: "Scan receipts and instantly check if they are eTIMS compliant. Protect your tax deductions automatically.",
                                color: "emerald"
                            },
                            {
                                icon: () => <Zap className="h-6 w-6" />,
                                title: "Statutory Engine",
                                desc: "Real-time updates for PAYE, SHIF, Housing Levy, and NSSF. Accurate calculations for the 2026 fiscal year.",
                                color: "blue"
                            },
                            {
                                icon: FileText,
                                title: "Legal Wizard",
                                desc: "Generate professional Employment Contracts and Privacy Policies compliant with the Data Protection Act 2019.",
                                color: "navy"
                            }
                        ].map((f, i) => (
                            <div key={i} className="group p-8 rounded-[40px] bg-white border border-navy-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="h-14 w-14 rounded-2xl bg-navy-950 flex items-center justify-center text-white mb-6 transform group-hover:rotate-12 transition-transform shadow-xl shadow-navy-200">
                                    <f.icon className="h-7 w-7" />
                                </div>
                                <h4 className="text-2xl font-black text-navy-900 tracking-tight italic mb-4">{f.title}</h4>
                                <p className="text-navy-600 leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 space-y-6">
                        <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">Institutional Safety</h2>
                        <h3 className="text-5xl font-black text-navy-950 tracking-tighter italic">Trusted by SME owners across Nairobi.</h3>
                        <p className="text-navy-600 font-medium">We've helped hundreds of businesses avoid KRA penalties and navigate the complex legal environment of 2026.</p>
                        <div className="pt-8">
                            <div className="flex gap-1 text-emerald-500 mb-4">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                            </div>
                            <p className="text-lg font-black text-navy-950 italic whitespace-pre-line leading-tight uppercase font-mono">
                                "ComplyKe saved us from a <br /> 500k KRA penalty last month."
                            </p>
                            <div className="flex items-center gap-4 mt-6">
                                <div className="h-12 w-12 rounded-full border-2 border-emerald-500 overflow-hidden bg-navy-100">
                                    <img src="https://i.pravatar.cc/150?u=24" alt="CEO" />
                                </div>
                                <div>
                                    <h5 className="font-black text-navy-950 italic text-sm">Njeri Kamau</h5>
                                    <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mt-0.5">CEO, Mama Njeri's Salon</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-2 gap-6 relative">
                        <div className="space-y-6 pt-12">
                            {[1, 2].map(i => (
                                <div key={i} className="p-8 rounded-[40px] bg-navy-950 text-white shadow-2xl space-y-4">
                                    <Quote className="h-8 w-8 text-emerald-400 opacity-20" />
                                    <p className="text-sm font-medium leading-relaxed italic opacity-80">
                                        "The iTax automation plan is brilliant. We don't spend hours on filing anymore."
                                    </p>
                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Business Owner</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            {[3, 4].map(i => (
                                <div key={i} className="p-8 rounded-[40px] bg-white border-2 border-navy-50 shadow-xl space-y-4">
                                    <Quote className="h-8 w-8 text-navy-200" />
                                    <p className="text-sm font-semibold leading-relaxed italic text-navy-900">
                                        "Finally! A compliance app that actually understands Kenyan law."
                                    </p>
                                    <div className="pt-4 border-t border-navy-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-navy-400">Legal Advisor</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-navy-950 text-white rounded-t-[80px] mt-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-compliance-gradient opacity-10 blur-3xl" />
                <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
                    <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none italic uppercase">Ready to Bulletproof <br /> Your Business?</h2>
                    <p className="text-xl text-navy-300 font-medium max-w-2xl mx-auto leading-relaxed">
                        Join the elite circle of Kenyan SMEs who have automated their compliance. Start your free trial today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Button onClick={onGetStarted} size="lg" className="h-16 px-12 bg-white text-navy-950 hover:bg-emerald-50 rounded-2xl text-lg font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                            Get Started for Free
                        </Button>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-navy-300 italic">No Credit Card</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-navy-300 italic">7-Day Trial</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="bg-navy-950 text-white/50 py-12 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 mb-1" />
                        <span className="text-sm font-black tracking-tighter uppercase whitespace-nowrap">ComplyKe Institutional Safety</span>
                    </div>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 ComplyKe • All Rights Reserved</p>
                </div>
            </footer>
        </div>
    )
}
