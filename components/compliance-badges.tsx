"use client"

import Image from "next/image"

export default function ComplianceBadges() {
    return (
        <div className="w-full py-12 bg-gradient-to-br from-navy-50 to-emerald-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">
                        Trusted & Compliant
                    </h2>
                    <p className="text-slate-600">
                        ComplyKe meets all Kenya compliance standards
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center">
                    {/* KRA Compliant Badge */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="relative w-40 h-40 hover:scale-110 transition-transform duration-300">
                            <Image
                                src="/kra-compliant-badge.svg"
                                alt="KRA Compliant 2026"
                                width={160}
                                height={160}
                                className="drop-shadow-lg"
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-navy-900">KRA Compliant</h3>
                            <p className="text-sm text-slate-600">
                                2026 Tax Calculations Verified
                            </p>
                        </div>
                    </div>

                    {/* ODPC Certified Badge */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="relative w-40 h-40 hover:scale-110 transition-transform duration-300">
                            <Image
                                src="/odpc-certified-badge.svg"
                                alt="ODPC Certified - Data Protection Act 2019"
                                width={160}
                                height={160}
                                className="drop-shadow-lg"
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-navy-900">ODPC Certified</h3>
                            <p className="text-sm text-slate-600">
                                Data Protection Act 2019
                            </p>
                        </div>
                    </div>

                    {/* eTIMS Ready Badge */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="relative w-40 h-40 hover:scale-110 transition-transform duration-300">
                            <Image
                                src="/etims-ready-badge.svg"
                                alt="eTIMS Ready - Electronic Tax Invoice"
                                width={160}
                                height={160}
                                className="drop-shadow-lg"
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-navy-900">eTIMS Ready</h3>
                            <p className="text-sm text-slate-600">
                                Electronic Tax Invoice System
                            </p>
                        </div>
                    </div>
                </div>

                {/* Compliance Details */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-6 border-2 border-navy-200 shadow-sm">
                        <h4 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Tax Compliance
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li>✓ PAYE (Income Tax) - 2025 Rates</li>
                            <li>✓ SHIF (Social Health Insurance) - 2.75%</li>
                            <li>✓ Housing Levy - 1.5%</li>
                            <li>✓ NSSF Phase 4 - February 2026</li>
                            <li>✓ Minimum Wage 2026 - Updated</li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-lg p-6 border-2 border-navy-200 shadow-sm">
                        <h4 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Data Protection
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li>✓ Data Protection Act 2019 Compliant</li>
                            <li>✓ ODPC Requirements Met</li>
                            <li>✓ Privacy Policy Generator</li>
                            <li>✓ Data Subject Rights Protected</li>
                            <li>✓ Secure Data Handling</li>
                        </ul>
                    </div>
                </div>

                {/* Last Updated */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500">
                        Last Verified: February 10, 2026 | Next Review: May 10, 2026
                    </p>
                </div>
            </div>
        </div>
    )
}
