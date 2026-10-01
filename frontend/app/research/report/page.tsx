"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, RotateCcw, ShieldAlert, Sparkles, Database, FileText, Newspaper, TrendingUp, BarChart2, CheckCircle2 } from "lucide-react";

type LiveMarket = {
    coin_id?: string;
    current_price?: number;
    change_24h?: number;
    source?: string;
};

type MarketSnapshot = {
    current_price?: number;
    average_price?: number;
    min_price?: number;
    max_price?: number;
    moving_average_7d?: number;
    moving_average_30d?: number;
    period_start?: string;
    period_end?: string;
    period_days?: number;
};

type Performance = {
    return_7d?: number;
    return_period?: number;
};

type RiskMetrics = {
    daily_volatility?: number;
    maximum_drawdown?: number;
    daily_sharpe_ratio?: number;
};

type Source = {
    type?: string;
    source?: string;
    description?: string;
    url?: string;
};

type NewsItem = {
    title?: string;
    description?: string;
    url?: string;
    published_at?: string;
    source?: string;
};

type ResearchReport = {
    live_market?: LiveMarket | null;
    historical_market?: MarketSnapshot | null;
    performance?: Performance | null;
    risk_metrics?: RiskMetrics | null;
    interpretation?: string | null;
    sources?: Source[];
    news?: NewsItem[];
    documents?: unknown[];
};

type StoredReportData = {
    query: string;
    result: {
        report?: ResearchReport;
        final_report?: string;
    };
    timestamp: string;
};

function formatPrice(value?: number | null) {
    if (value === undefined || value === null || typeof value !== "number" || Number.isNaN(value)) return "—";
    return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatPercent(value?: number | null) {
    if (value === undefined || value === null || typeof value !== "number" || Number.isNaN(value)) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function cleanHtml(html?: string) {
    if (!html) return "";
    return html
        .replace(/<img[^>]*>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeSourceName(source: Source, index: number) {
    const type = (source.type || "").toLowerCase();
    const name = source.source || "";

    if (name && name !== "Unknown source" && name !== "Unknown") {
        return name;
    }

    if (type.includes("live")) return "CoinGecko API";
    if (type.includes("historical")) return "CryptoMind Analytics Engine";
    if (type.includes("news")) return "Crypto RSS Feeds";
    if (type.includes("document")) return "Research Knowledge Base";
    return `Source #${index + 1}`;
}

export default function ResearchReportPage() {
    const [reportData, setReportData] = useState<StoredReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("cryptomind_latest_report");
            if (raw) {
                const parsed = JSON.parse(raw);
                setReportData(parsed);
            }
        } catch (e) {
            console.error("Failed to read report data from sessionStorage", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C6FF00] border-t-transparent mx-auto" />
                    <p className="text-sm text-white/50">Loading research report...</p>
                </div>
            </div>
        );
    }

    if (!reportData || !reportData.result) {
        return (
            <main className="min-h-screen py-20 px-5 max-w-[1280px] mx-auto">
                <div className="glass rounded-3xl p-10 text-center max-w-xl mx-auto space-y-6">
                    <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-white">No active research report</h1>
                        <p className="mt-2 text-sm text-white/45">
                            Run an AI research query first to generate a structured research report.
                        </p>
                    </div>
                    <Link
                        href="/research"
                        className="inline-flex items-center gap-2 rounded-full bg-[#C6FF00] px-6 py-3 text-xs font-bold text-black transition hover:brightness-110"
                    >
                        <ArrowLeft size={16} />
                        Go to AI Research Workspace
                    </Link>
                </div>
            </main>
        );
    }

    const { query, result, timestamp } = reportData;
    const report = result.report;
    const liveMarket = report?.live_market;
    const historical = report?.historical_market;
    const performance = report?.performance;
    const risk = report?.risk_metrics;
    const interpretation = report?.interpretation;
    const news = report?.news ?? [];
    const sources = report?.sources ?? [];

    // Data-driven executive summary if interpretation is absent
    const dataDrivenSummary = interpretation || (
        `Research evaluation for "${query}". ` +
        (liveMarket?.current_price
            ? `Live trading price recorded at ${formatPrice(liveMarket.current_price)} (${formatPercent(liveMarket.change_24h)} 24h change). `
            : "") +
        (typeof historical?.period_days === "number" && !Number.isNaN(historical.period_days)
            ? `Historical dataset spans ${historical.period_days.toFixed(0)} days with an average price of ${formatPrice(historical.average_price)} (Range: ${formatPrice(historical.min_price)} to ${formatPrice(historical.max_price)}). `
            : "") +
        (typeof risk?.daily_volatility === "number" && !Number.isNaN(risk.daily_volatility)
            ? `Historical daily volatility is measured at ${risk.daily_volatility.toFixed(2)}% with a peak drawdown of ${formatPercent(risk.maximum_drawdown)}.`
            : "No quantitative metrics were retrieved for this specific prompt.")
    );

    return (
        <main className="min-h-screen pb-24 text-white print:bg-white print:text-black print:pb-0">
            {/* PRINT STYLES */}
            <style jsx global>{`
                @media print {
                    header, footer, .no-print {
                        display: none !important;
                    }
                    body, main {
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                    .glass {
                        background: #ffffff !important;
                        border: 1px solid #e2e8f0 !important;
                        box-shadow: none !important;
                        color: #000000 !important;
                    }
                    .text-white {
                        color: #0f172a !important;
                    }
                    .text-white\\/45, .text-white\\/35, .text-white\\/65, .text-white\\/50 {
                        color: #475569 !important;
                    }
                    .text-\\[\\#C6FF00\\] {
                        color: #0f766e !important;
                    }
                    .bg-\\[\\#C6FF00\\] {
                        background: #0f766e !important;
                        color: #ffffff !important;
                    }
                }
            `}</style>

            <div className="mx-auto max-w-[1100px] px-5 pt-10 md:px-8 md:pt-14 space-y-10">

                {/* ACTION BAR (NO PRINT) */}
                <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                    <Link
                        href="/research"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft size={14} />
                        Back to Research Workspace
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                        >
                            <Printer size={14} />
                            Print / Save PDF
                        </button>

                        <Link
                            href="/research"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#C6FF00] px-4 py-2 text-xs font-bold text-black transition hover:brightness-110"
                        >
                            <RotateCcw size={14} />
                            New Research Query
                        </Link>
                    </div>
                </div>

                {/* REPORT HEADER */}
                <header className="glass rounded-3xl p-8 md:p-10 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Sparkles size={120} className="text-[#C6FF00]" />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="flex h-7 items-center gap-1.5 rounded-full border border-[#C6FF00]/30 bg-[#C6FF00]/10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6FF00]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF00] animate-pulse" />
                            CryptoMind AI Intelligence
                        </span>
                        <span className="text-xs text-white/30 font-mono">
                            INSTITUTIONAL RESEARCH REPORT
                        </span>
                    </div>

                    <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl text-white">
                        {query}
                    </h1>

                    <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-xs text-white/45 font-mono">
                        <div>
                            <span className="text-white/25">REPORT TYPE:</span>{" "}
                            <span className="text-white/70">Structured AI Market Synthesis</span>
                        </div>
                        <div>
                            <span className="text-white/25">GENERATED AT:</span>{" "}
                            <span className="text-white/70">{formatDate(timestamp)}</span>
                        </div>
                        <div>
                            <span className="text-white/25">VERIFICATION:</span>{" "}
                            <span className="text-[#C6FF00] inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Verified Evidence
                            </span>
                        </div>
                    </div>
                </header>

                {/* EXECUTIVE SUMMARY */}
                <section className="glass rounded-3xl p-8 md:p-9 border border-cyan-400/20 bg-gradient-to-b from-cyan-950/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-bold text-white">Executive Summary</h2>
                            <p className="text-xs text-cyan-400/80 font-mono">AI-SYNTHESIZED INSIGHT & MARKET SNAPSHOT</p>
                        </div>
                    </div>

                    <div className="mt-5 text-sm leading-8 text-white/85 bg-black/20 p-6 rounded-2xl border border-white/5">
                        <p>{dataDrivenSummary}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-[11px] text-white/35 font-mono">
                        <span>Notice:</span>
                        <span>Quantitative data sourced directly from on-chain/market telemetry; AI interpretation synthesized by CryptoMind agent.</span>
                    </div>
                </section>

                {/* LIVE MARKET SNAPSHOT */}
                {liveMarket && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Database size={18} className="text-[#C6FF00]" />
                            <h2 className="font-display text-xl font-bold text-white">01. Live Market Telemetry</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">ASSET TICKER</div>
                                <div className="mt-2 font-display text-2xl font-bold text-[#C6FF00]">
                                    {liveMarket.coin_id ? liveMarket.coin_id.toUpperCase() : "GENERIC"}
                                </div>
                                <div className="mt-1 text-[11px] text-white/30">Target Cryptocurrency</div>
                            </div>

                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">CURRENT SPOT PRICE</div>
                                <div className="mt-2 font-display text-2xl font-bold text-white">
                                    {formatPrice(liveMarket.current_price)}
                                </div>
                                <div className="mt-1 text-[11px] text-white/30">Live CoinGecko Data</div>
                            </div>

                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">24H PRICE CHANGE</div>
                                <div className={`mt-2 font-display text-2xl font-bold ${(liveMarket.change_24h ?? 0) >= 0 ? "text-[#C6FF00]" : "text-red-400"}`}>
                                    {formatPercent(liveMarket.change_24h)}
                                </div>
                                <div className="mt-1 text-[11px] text-white/30">24h Net Movement</div>
                            </div>

                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">DATA SOURCE</div>
                                <div className="mt-2 font-display text-lg font-semibold text-cyan-400">
                                    {liveMarket.source || "CoinGecko API"}
                                </div>
                                <div className="mt-1 text-[11px] text-white/30">Real-Time Feed</div>
                            </div>
                        </div>
                    </section>
                )}

                {/* HISTORICAL PERFORMANCE */}
                {historical && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp size={18} className="text-cyan-400" />
                            <h2 className="font-display text-xl font-bold text-white">02. Historical Performance & Moving Averages</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">7-DAY RETURN</div>
                                <div className={`mt-2 font-display text-2xl font-bold ${(performance?.return_7d ?? 0) >= 0 ? "text-[#C6FF00]" : "text-red-400"}`}>
                                    {formatPercent(performance?.return_7d)}
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">PERIOD RETURN</div>
                                <div className={`mt-2 font-display text-2xl font-bold ${(performance?.return_period ?? 0) >= 0 ? "text-[#C6FF00]" : "text-red-400"}`}>
                                    {formatPercent(performance?.return_period)}
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">7D MOVING AVERAGE</div>
                                <div className="mt-2 font-display text-2xl font-bold text-white">
                                    {formatPrice(historical.moving_average_7d)}
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-5 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">30D MOVING AVERAGE</div>
                                <div className="mt-2 font-display text-2xl font-bold text-white">
                                    {formatPrice(historical.moving_average_30d)}
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-6 border border-white/10 grid gap-4 md:grid-cols-3">
                            <div>
                                <span className="text-xs text-white/40 font-mono">PERIOD AVERAGE:</span>{" "}
                                <span className="text-sm font-bold text-white">{formatPrice(historical.average_price)}</span>
                            </div>
                            <div>
                                <span className="text-xs text-white/40 font-mono">PERIOD MIN:</span>{" "}
                                <span className="text-sm font-bold text-white">{formatPrice(historical.min_price)}</span>
                            </div>
                            <div>
                                <span className="text-xs text-white/40 font-mono">PERIOD MAX:</span>{" "}
                                <span className="text-sm font-bold text-white">{formatPrice(historical.max_price)}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* RISK PROFILE */}
                {risk && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <BarChart2 size={18} className="text-[#C6FF00]" />
                            <h2 className="font-display text-xl font-bold text-white">03. Quantitative Risk Profile</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="glass rounded-2xl p-6 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">DAILY VOLATILITY</div>
                                <div className="mt-2 font-display text-3xl font-bold text-white">
                                    {typeof risk.daily_volatility === "number" && !Number.isNaN(risk.daily_volatility) ? `${risk.daily_volatility.toFixed(2)}%` : "—"}
                                </div>
                                <div className="mt-2 text-xs text-white/45">
                                    Standard deviation of daily percentage price returns.
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">MAXIMUM DRAWDOWN</div>
                                <div className="mt-2 font-display text-3xl font-bold text-red-400">
                                    {formatPercent(risk.maximum_drawdown)}
                                </div>
                                <div className="mt-2 text-xs text-white/45">
                                    Peak-to-trough decline over the observed historical window.
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 border border-white/10">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">DAILY SHARPE RATIO</div>
                                <div className="mt-2 font-display text-3xl font-bold text-[#C6FF00]">
                                    {typeof risk.daily_sharpe_ratio === "number" && !Number.isNaN(risk.daily_sharpe_ratio) ? risk.daily_sharpe_ratio.toFixed(3) : "—"}
                                </div>
                                <div className="mt-2 text-xs text-white/45">
                                    Risk-adjusted return ratio (mean daily return / daily volatility).
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* AI INTERPRETATION SECTION */}
                {interpretation && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className="text-[#C6FF00]" />
                            <h2 className="font-display text-xl font-bold text-white">04. AI Agent Structural Analysis</h2>
                        </div>

                        <div className="glass rounded-3xl p-8 border border-[#C6FF00]/20 bg-[#C6FF00]/[0.02]">
                            <p className="text-sm leading-8 text-white/80 whitespace-pre-line">
                                {interpretation}
                            </p>
                        </div>
                    </section>
                )}

                {/* RECENT NEWS INTELLIGENCE */}
                {news.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Newspaper size={18} className="text-cyan-400" />
                            <h2 className="font-display text-xl font-bold text-white">05. Recent News Signals</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {news.map((item, idx) => {
                                const sourceName = item.source && item.source !== "Unknown source" && item.source !== "Unknown"
                                    ? item.source
                                    : "Crypto RSS Feed";
                                const desc = cleanHtml(item.description);

                                return (
                                    <div key={idx} className="glass rounded-2xl p-6 border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                                                {sourceName}
                                            </span>
                                            {item.published_at && (
                                                <span className="text-white/30 font-mono text-[11px]">
                                                    {formatDate(item.published_at)}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-display text-base font-semibold text-white">
                                            {item.title || "Market Article"}
                                        </h3>

                                        {desc && (
                                            <p className="text-xs text-white/45 leading-5 line-clamp-3">
                                                {desc}
                                            </p>
                                        )}

                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-[#C6FF00] hover:underline pt-2 font-mono"
                                            >
                                                Read full story ↗
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* EVIDENCE & SOURCES */}
                {sources.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-[#C6FF00]" />
                            <h2 className="font-display text-xl font-bold text-white">06. Grounding Sources & Evidence</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {sources.map((src, idx) => {
                                const name = normalizeSourceName(src, idx);
                                return (
                                    <div key={idx} className="glass rounded-2xl p-5 border border-white/10 space-y-2">
                                        <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                                            {src.type || "Data Telemetry"}
                                        </div>
                                        <div className="font-display text-sm font-bold text-white">
                                            {name}
                                        </div>
                                        <p className="text-xs text-white/40 leading-5">
                                            {src.description || "Grounding data source used during agent reasoning phase."}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* METHODOLOGY */}
                <section className="glass rounded-3xl p-8 border border-white/10 space-y-4">
                    <h2 className="font-display text-lg font-bold text-white">07. Research Methodology</h2>
                    <div className="grid gap-6 text-xs text-white/50 leading-6 md:grid-cols-2">
                        <div>
                            <h4 className="font-semibold text-white font-mono uppercase tracking-wider text-[11px] mb-1">DATA AGGREGATION</h4>
                            <p>
                                Live market spot prices and 24h movements are retrieved in real-time from CoinGecko API. Historical price series are analyzed directly from CryptoMind&apos;s PostgreSQL database using Pandas analytics engines.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white font-mono uppercase tracking-wider text-[11px] mb-1">AI AGENT REASONING</h4>
                            <p>
                                The research agent utilizes a stateful LangGraph / LangChain framework powered by Groq LLM inference to synthesize raw statistical metrics, RAG document vectors, and verified RSS feeds into structured intelligence.
                            </p>
                        </div>
                    </div>
                </section>

                {/* DISCLAIMER */}
                <footer className="border-t border-white/10 pt-6 text-xs text-white/30 space-y-2">
                    <div className="flex items-center gap-2 text-white/50 font-semibold font-mono text-[11px]">
                        <ShieldAlert size={14} />
                        DISCLAIMER
                    </div>
                    <p>
                        CryptoMind is an automated AI research tool designed for informational and educational purposes only. Nothing contained in this research report constitutes investment advice, financial recommendations, or price predictions. Cryptocurrency trading involves substantial risk of loss. Always perform independent due diligence.
                    </p>
                </footer>

            </div>
        </main>
    );
}
