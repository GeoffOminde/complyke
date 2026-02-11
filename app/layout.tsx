import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { InstitutionalUIProvider } from "@/contexts/ui-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ComplyKe - Compliance-as-a-Service for Kenyan SMEs",
  description: "Protect your business from fines. Manage legal and tax compliance easily with ComplyKe - the smart compliance platform for Kenyan small businesses.",
  keywords: ["Kenya compliance", "SME compliance", "KRA", "SHIF", "Housing Levy", "NSSF", "employment contracts", "data protection"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <InstitutionalUIProvider>
            {children}
          </InstitutionalUIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
