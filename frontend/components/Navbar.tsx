"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Bot,
    ChevronDown,
    FileText,
    GitCompare,
    Info,
    LineChart,
    Menu,
    Newspaper,
    Settings,
    Sparkles,
    X,
} from "lucide-react";

const navSections = [
    {
        category: "Markets",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
            { label: "Compare", href: "/compare", icon: GitCompare },
        ],
    },
    {
        category: "Research",
        items: [
            { label: "AI Research", href: "/research", icon: Bot },
            { label: "Full Report", href: "/research/report", icon: FileText },
        ],
    },
    {
        category: "Intelligence",
        items: [
            { label: "News Signals", href: "/news", icon: Newspaper },
            { label: "Analytics", href: "/analytics", icon: LineChart },
        ],
    },
    {
        category: "Platform",
        items: [
            { label: "About", href: "/about", icon: Info },
            { label: "Settings", href: "/settings", icon: Settings },
        ],
    },
];

const flatNavItems = navSections.flatMap((s) => s.items);

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050507]/90 backdrop-blur-xl">
            <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 lg:px-8">

                {/* LOGO */}
                <Link href="/" className="group flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c6ff00]/30 bg-[#c6ff00]/10 shadow-lg shadow-[#c6ff00]/5">
                        <Sparkles
                            size={18}
                            className="text-[#c6ff00] transition-transform group-hover:rotate-12"
                        />
                    </div>

                    <div>
                        <div className="font-display text-[17px] font-semibold tracking-tight text-white">
                            Crypto<span className="text-[#c6ff00]">Mind</span>
                        </div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">
                            AI RESEARCH PLATFORM
                        </div>
                    </div>
                </Link>

                {/* DESKTOP NAVIGATION */}
                <nav className="hidden items-center gap-1 lg:flex">
                    {flatNavItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-medium transition-all ${active
                                        ? "bg-white/[0.08] text-white border border-white/10"
                                        : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                                    }`}
                            >
                                <Icon
                                    size={14}
                                    className={
                                        active
                                            ? "text-[#c6ff00]"
                                            : "text-white/35 group-hover:text-white/70"
                                    }
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* RIGHT ACTION BUTTONS */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/research"
                        className="hidden h-9 items-center gap-2 rounded-full bg-[#c6ff00] px-4 text-xs font-bold text-black transition hover:brightness-110 sm:flex shadow-md shadow-[#c6ff00]/10"
                    >
                        Start Research →
                    </Link>

                    {/* MOBILE HAMBURGER BUTTON */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle Navigation Menu"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 lg:hidden"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU OVERLAY DRAWER */}
            {mobileOpen && (
                <div className="fixed inset-x-0 top-[72px] bottom-0 z-50 bg-[#050507]/95 backdrop-blur-2xl p-6 overflow-y-auto lg:hidden space-y-6 animate-fadeIn">
                    <div className="grid gap-6 sm:grid-cols-2">
                        {navSections.map((sec) => (
                            <div key={sec.category} className="space-y-3">
                                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c6ff00]">
                                    {sec.category}
                                </div>
                                <div className="space-y-1">
                                    {sec.items.map((item) => {
                                        const Icon = item.icon;
                                        const active = pathname === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${active
                                                        ? "bg-[#c6ff00]/10 border border-[#c6ff00]/30 text-[#c6ff00]"
                                                        : "bg-white/[0.02] border border-white/5 text-white/70 hover:bg-white/5 hover:text-white"
                                                    }`}
                                            >
                                                <Icon size={18} className={active ? "text-[#c6ff00]" : "text-white/40"} />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 flex gap-3">
                        <Link
                            href="/research"
                            onClick={() => setMobileOpen(false)}
                            className="flex-1 text-center rounded-2xl bg-[#c6ff00] py-3 text-xs font-bold text-black"
                        >
                            Start Research
                        </Link>
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="flex-1 text-center rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white"
                        >
                            Explore Dashboard
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}