"use client";

import { useEffect, useState } from "react";
import { Check, Database, Gauge, Monitor, Palette, RefreshCcw, RotateCcw, Settings, ShieldCheck, Sparkles, Sliders } from "lucide-react";

import { API_BASE_URL as API_BASE } from "@/lib/api";

type UserSettings = {
    themeAccent: "lime" | "cyan";
    defaultAsset: string;
    autoOpenReport: boolean;
    animationsEnabled: boolean;
    density: "comfortable" | "compact";
};

const DEFAULT_SETTINGS: UserSettings = {
    themeAccent: "lime",
    defaultAsset: "BTC",
    autoOpenReport: false,
    animationsEnabled: true,
    density: "comfortable",
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [savedNotice, setSavedNotice] = useState<boolean>(false);
    const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
    const [apiLatency, setApiLatency] = useState<number | null>(null);

    // Load settings from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem("cryptomind_user_settings");
            if (raw) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }, []);

    // Check API status
    const checkApiHealth = async () => {
        setApiStatus("checking");
        const start = performance.now();
        try {
            const res = await fetch(`${API_BASE}/`, { method: "GET" });
            const elapsed = Math.round(performance.now() - start);
            if (res.ok) {
                setApiStatus("online");
                setApiLatency(elapsed);
            } else {
                setApiStatus("offline");
                setApiLatency(null);
            }
        } catch (e) {
            setApiStatus("offline");
            setApiLatency(null);
        }
    };

    useEffect(() => {
        checkApiHealth();
    }, []);

    const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            localStorage.setItem("cryptomind_user_settings", JSON.stringify(newSettings));
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2000);
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        try {
            localStorage.removeItem("cryptomind_user_settings");
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2000);
        } catch (e) {
            console.error("Failed to reset settings", e);
        }
    };

    return (
        <main className="min-h-screen pb-24 text-white">
            <div className="mx-auto max-w-[1000px] px-5 pt-16 md:px-8 md:pt-20 space-y-10">

                {/* HEADER */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                            <Settings size={14} className="text-[#C6FF00]" />
                            SYSTEM & INTERFACE PREFERENCES
                        </div>

                        {savedNotice && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C6FF00] font-mono animate-pulse">
                                <Check size={14} /> Preferences Saved
                            </span>
                        )}
                    </div>

                    <h1 className="font-display text-4xl font-bold tracking-[-0.04em] md:text-5xl text-white">
                        Settings & <span className="text-gradient">Telemetry</span>
                    </h1>

                    <p className="max-w-xl text-base text-white/45">
                        Configure client interface preferences, research defaults, and inspect backend connection telemetry.
                    </p>
                </section>

                {/* 01. APPEARANCE & STYLING */}
                <section className="glass rounded-3xl p-7 md:p-8 border border-white/10 space-y-6">
                    <div className="flex items-center gap-3">
                        <Palette size={20} className="text-[#C6FF00]" />
                        <div>
                            <h2 className="font-display text-xl font-bold text-white">01. Visual Styling & Themes</h2>
                            <p className="text-xs text-white/40">Interface color palette and display aesthetics</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 pt-2">
                        {/* Dark Theme Base */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                            <div className="text-xs font-mono text-white/40 uppercase">COLOR SCHEME</div>
                            <div className="font-display text-base font-bold text-white flex items-center justify-between">
                                <span>Deep Obsidian Dark (#050507)</span>
                                <span className="rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/20 px-2.5 py-0.5 text-[10px] text-[#C6FF00] font-mono">
                                    Active
                                </span>
                            </div>
                            <p className="text-xs text-white/40 leading-5">
                                High-contrast dark mode tailored for fintech & AI research environments.
                            </p>
                        </div>

                        {/* Accent Preference */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                            <div className="text-xs font-mono text-white/40 uppercase">ACCENT COLOR FOCUS</div>
                            <div className="flex items-center gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => updateSetting("themeAccent", "lime")}
                                    className={`flex-1 rounded-xl p-3 text-xs font-bold border transition flex items-center justify-center gap-2 ${settings.themeAccent === "lime"
                                            ? "border-[#C6FF00] bg-[#C6FF00]/10 text-[#C6FF00]"
                                            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                        }`}
                                >
                                    <span className="h-3 w-3 rounded-full bg-[#C6FF00]" />
                                    Lime Accent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateSetting("themeAccent", "cyan")}
                                    className={`flex-1 rounded-xl p-3 text-xs font-bold border transition flex items-center justify-center gap-2 ${settings.themeAccent === "cyan"
                                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                                            : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                        }`}
                                >
                                    <span className="h-3 w-3 rounded-full bg-cyan-400" />
                                    Cyan Accent
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 02. RESEARCH PREFERENCES */}
                <section className="glass rounded-3xl p-7 md:p-8 border border-white/10 space-y-6">
                    <div className="flex items-center gap-3">
                        <Sliders size={20} className="text-cyan-400" />
                        <div>
                            <h2 className="font-display text-xl font-bold text-white">02. AI Research Defaults</h2>
                            <p className="text-xs text-white/40">Configure research prompt execution behavior</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        {/* Default Asset Focus */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                            <div>
                                <h3 className="font-display text-sm font-bold text-white">Default Target Cryptocurrency</h3>
                                <p className="text-xs text-white/40">Primary asset highlighted in research and analytics filters.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {["BTC", "ETH", "SOL", "BNB"].map((asset) => (
                                    <button
                                        key={asset}
                                        type="button"
                                        onClick={() => updateSetting("defaultAsset", asset)}
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold font-mono transition ${settings.defaultAsset === asset
                                                ? "bg-[#C6FF00] text-black"
                                                : "border border-white/10 bg-white/5 text-white/50 hover:text-white"
                                            }`}
                                    >
                                        {asset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Auto Open Report Toggle */}
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                            <div>
                                <h3 className="font-display text-sm font-bold text-white">Auto-Navigate to Full Report</h3>
                                <p className="text-xs text-white/40">Automatically open `/research/report` when an AI research query completes.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateSetting("autoOpenReport", !settings.autoOpenReport)}
                                className={`h-7 w-12 rounded-full p-1 transition duration-200 ease-in-out ${settings.autoOpenReport ? "bg-[#C6FF00]" : "bg-white/15"
                                    }`}
                            >
                                <div
                                    className={`h-5 w-5 rounded-full bg-black transition duration-200 ease-in-out transform ${settings.autoOpenReport ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </section>

                {/* 03. BACKEND API TELEMETRY */}
                <section className="glass rounded-3xl p-7 md:p-8 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database size={20} className="text-[#C6FF00]" />
                            <div>
                                <h2 className="font-display text-xl font-bold text-white">03. Backend API Connectivity Telemetry</h2>
                                <p className="text-xs text-white/40">Live health check for FastAPI server at {API_BASE}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={checkApiHealth}
                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                        >
                            <RefreshCcw size={14} className={apiStatus === "checking" ? "animate-spin" : ""} />
                            Re-check
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 pt-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                            <div className="text-[10px] font-mono uppercase text-white/40">CONNECTION STATUS</div>
                            <div className="font-display text-lg font-bold flex items-center gap-2">
                                {apiStatus === "checking" && <span className="text-amber-400">Checking...</span>}
                                {apiStatus === "online" && (
                                    <span className="text-[#C6FF00] flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#C6FF00] animate-pulse" />
                                        FastAPI Connected
                                    </span>
                                )}
                                {apiStatus === "offline" && <span className="text-red-400">API Offline / Unreachable</span>}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                            <div className="text-[10px] font-mono uppercase text-white/40">LATENCY RESPONSE</div>
                            <div className="font-display text-lg font-bold font-mono text-cyan-400">
                                {apiLatency !== null ? `${apiLatency} ms` : "—"}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                            <div className="text-[10px] font-mono uppercase text-white/40">TARGET ENDPOINT</div>
                            <div className="font-mono text-xs text-white/70 truncate">
                                {API_BASE}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 04. INTERFACE DENSITY & MOTION */}
                <section className="glass rounded-3xl p-7 md:p-8 border border-white/10 space-y-6">
                    <div className="flex items-center gap-3">
                        <Monitor size={20} className="text-cyan-400" />
                        <div>
                            <h2 className="font-display text-xl font-bold text-white">04. Motion & Density</h2>
                            <p className="text-xs text-white/40">UI density and micro-animation preferences</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        {/* Animations Toggle */}
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                            <div>
                                <h3 className="font-display text-sm font-bold text-white">Interface Micro-Animations</h3>
                                <p className="text-xs text-white/40">Enable smooth card hover elevations, ambient pulses, and subtle glass glows.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateSetting("animationsEnabled", !settings.animationsEnabled)}
                                className={`h-7 w-12 rounded-full p-1 transition duration-200 ease-in-out ${settings.animationsEnabled ? "bg-[#C6FF00]" : "bg-white/15"
                                    }`}
                            >
                                <div
                                    className={`h-5 w-5 rounded-full bg-black transition duration-200 ease-in-out transform ${settings.animationsEnabled ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Layout Density */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                            <div>
                                <h3 className="font-display text-sm font-bold text-white">Layout Spacing Density</h3>
                                <p className="text-xs text-white/40">Adjust card padding and grid spacing.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => updateSetting("density", "comfortable")}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${settings.density === "comfortable"
                                            ? "bg-cyan-400 text-black"
                                            : "border border-white/10 bg-white/5 text-white/50 hover:text-white"
                                        }`}
                                >
                                    Comfortable
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateSetting("density", "compact")}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${settings.density === "compact"
                                            ? "bg-cyan-400 text-black"
                                            : "border border-white/10 bg-white/5 text-white/50 hover:text-white"
                                        }`}
                                >
                                    Compact
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 05. SYSTEM INFORMATION & RESET */}
                <section className="glass rounded-3xl p-7 md:p-8 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Gauge size={20} className="text-[#C6FF00]" />
                            <div>
                                <h2 className="font-display text-xl font-bold text-white">05. Platform Information</h2>
                                <p className="text-xs text-white/40">Software version build numbers</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={resetSettings}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-400/20 transition"
                        >
                            <RotateCcw size={14} />
                            Reset All Preferences
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 pt-2 font-mono text-xs">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="text-white/30 text-[10px]">PLATFORM VERSION</div>
                            <div className="text-white font-bold mt-1">CryptoMind v1.0.0</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="text-white/30 text-[10px]">FRONTEND FRAMEWORK</div>
                            <div className="text-white font-bold mt-1">Next.js 16 (App Router)</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="text-white/30 text-[10px]">BACKEND ENGINE</div>
                            <div className="text-white font-bold mt-1">Python FastAPI + LangGraph</div>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
