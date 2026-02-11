"use client"

import { MessageCircle } from "lucide-react"
import { useState } from "react"

export default function WhatsAppButton() {
    const [isHovered, setIsHovered] = useState(false)

    const handleWhatsAppClick = () => {
        const phoneNumber = "254700123456" // Replace with actual WhatsApp Business number
        const message = encodeURIComponent(
            "Hi ComplyKe! I need help with compliance for my business."
        )
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

        window.open(whatsappUrl, "_blank")
    }

    return (
        <>
            {/* WhatsApp Floating Button */}
            <button
                onClick={handleWhatsAppClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="fixed bottom-28 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 group"
                aria-label="Chat on WhatsApp"
            >
                <MessageCircle className="h-6 w-6" />
                <span
                    className={`overflow-hidden transition-all duration-300 whitespace-nowrap font-semibold ${isHovered ? "max-w-xs opacity-100" : "max-w-0 opacity-0"
                        }`}
                >
                    Need Help? Chat on WhatsApp
                </span>
            </button>

            {/* Pulsing Ring Animation */}
            <div className="fixed bottom-28 right-6 z-40 pointer-events-none">
                <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20"></div>
            </div>
        </>
    )
}
