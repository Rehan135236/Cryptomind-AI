"use client";

import Link from "next/link";
import { Bot, CheckCircle2, Database, ShieldAlert, Sparkles } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-white/10 bg-[#030305] text-white pt-16 pb-12 print:hidden">
            <div className="mx-auto max-w-[1280px] px-5 lg:px-8 space-y-12">
                {/* TOP GRID */}
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">

                    {/* BRAND COL */}
                    <div className="lg:col-span-1 space-y-4">
                        <Link href="/" className="group inline-flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#c6ff00]/30 bg-[#c6ff00]/10">
                                <Sparkles size={16} className="text-[#c6ff00]" />
                            </div>
                            <span className="font-display text-lg font-bold tracking-tight text-white">
                                Crypto<span className="text-[#c6ff00]">Mind</span>
                            </span>
                        </Link>
                        <p className="text-xs text-white/45 leading-6">
                            AI-powered cryptocurrency research, quantitative risk analytics, and evidence-driven market intelligence platform.
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#c6ff00]">
                            <span className="h-2 w-2 rounded-full bg-[#c6ff00] animate-pulse" />
                            FastAPI Engine Connected
                        </div>
                    </div>

                    {/* COL 1: PRODUCT */}
                    <div className="space-y-3">
                        <h4 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c6ff00]">
                            PRODUCT
                        </h4>
                        <ul className="space-y-2 text-xs text-white/50 font-medium">
                            <li>
                                <Link href="/dashboard" className="hover:text-white transition">
                                    Crypto Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/compare" className="hover:text-white transition">
                                    Asset Comparison
                                </Link>
                            </li>
                            <li>
                                <Link href="/research" className="hover:text-white transition">
                                    AI Research Workspace
                                </Link>
                            </li>
                            <li>
                                <Link href="/research/report" className="hover:text-white transition">
                                    Full Research Report
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* COL 2: INTELLIGENCE */}
                    <div className="space-y-3">
                        <h4 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                            INTELLIGENCE
                        </h4>
                        <ul className="space-y-2 text-xs text-white/50 font-medium">
                            <li>
                                <Link href="/news" className="hover:text-white transition">
                                    Crypto News Signals
                                </Link>
                            </li>
                            <li>
                                <Link href="/analytics" className="hover:text-white transition">
                                    Advanced Analytics
                                </Link>
                            </li>
                            <li>
                                <Link href="/analytics" className="hover:text-white transition">
                                    Correlation Matrix
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* COL 3: PLATFORM & RESOURCES */}
                    <div className="space-y-3">
                        <h4 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400">
                            PLATFORM
                        </h4>
                        <ul className="space-y-2 text-xs text-white/50 font-medium">
                            <li>
                                <Link href="/about" className="hover:text-white transition">
                                    About CryptoMind
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-white transition">
                                    Research Methodology
                                </Link>
                            </li>
                            <li>
                                <Link href="/settings" className="hover:text-white transition">
                                    Settings & Telemetry
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* COL 4: SYSTEM STATUS */}
                    <div className="space-y-3">
                        <h4 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                            SYSTEM STATUS
                        </h4>
                        <div className="glass rounded-2xl p-4 space-y-2 text-[11px] font-mono border border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-white/40">API Status:</span>
                                <span className="text-[#c6ff00] font-bold">Online</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/40">Data Engine:</span>
                                <span className="text-cyan-400 font-bold">PostgreSQL</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/40">AI Model:</span>
                                <span className="text-purple-400 font-bold">Groq LLM</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* BOTTOM DISCLAIMER & COPYRIGHT */}
                <div className="border-t border-white/10 pt-8 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                        <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                        <span>Research Disclaimer: Market data, quantitative risk metrics, and AI agent output are provided strictly for research and educational purposes. Not financial or investment advice.</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30 pt-2 font-mono">
                        <div>
                            © {new Date().getFullYear()} CryptoMind AI. Built for evidence-based research.
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/about" className="hover:text-white transition">Methodology</Link>
                            <Link href="/settings" className="hover:text-white transition">Settings</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
