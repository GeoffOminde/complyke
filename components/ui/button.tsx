import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-lg text-base font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-manipulation",
                    {
                        "bg-navy-900 text-white hover:bg-navy-800 shadow-md": variant === "default",
                        "border-2 border-navy-900 bg-white text-navy-900 hover:bg-navy-50": variant === "outline",
                        "hover:bg-navy-50 text-navy-900": variant === "ghost",
                        "bg-rose-600 text-white hover:bg-rose-700 shadow-md": variant === "destructive",
                    },
                    {
                        "h-12 px-6 py-3": size === "default",
                        "h-10 px-4 py-2 text-sm": size === "sm",
                        "h-14 px-8 py-4 text-lg": size === "lg",
                        "h-10 w-10 p-0": size === "icon",
                    },
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
