import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CryptoMind AI — Evidence-Driven Crypto Research & Market Analytics",
  description: "AI-powered cryptocurrency research, quantitative risk telemetry, and evidence-driven market intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050507] text-white antialiased">
        <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
          {/* Ambient background lighting */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="ambient-lime left-[-180px] top-[-180px]" />
            <div className="ambient-cyan bottom-[-220px] right-[-180px]" />
          </div>

          {/* Subtle grid */}
          <div className="pointer-events-none fixed inset-0 -z-20 grid-background opacity-40" />

          {/* Global Navbar Header */}
          <Navbar />

          {/* Main Content Area */}
          <div className="flex-1">
            {children}
          </div>

          {/* Global Footer */}
          <Footer />
        </div>
      </body>
    </html>
  );
}