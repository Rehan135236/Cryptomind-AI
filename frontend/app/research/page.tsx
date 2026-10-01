"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { API_BASE_URL as API_BASE } from "@/lib/api";

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

type ResearchResponse = {
    messages?: unknown[];
    report?: ResearchReport;
    final_report?: string;
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

function metricColor(value?: number) {
    if (value === undefined || value === null) {
        return "text-white";
    }

    if (value > 0) {
        return "text-[#C6FF00]";
    }

    if (value < 0) {
        return "text-red-400";
    }

    return "text-white";
}

function normalizeSource(
    source: Source,
    index: number
): {
    name: string;
    type: string;
    description: string;
    url?: string;
} {
    const type = (source.type || "").toLowerCase();

    if (type.includes("live")) {
        return {
            name: "CoinGecko",
            type: "Live market data",
            description:
                "Current cryptocurrency price and 24-hour market movement.",
            url: source.url,
        };
    }

    if (type.includes("historical")) {
        return {
            name: "CryptoMind Analytics",
            type: "Historical market data",
            description:
                "Historical prices, moving averages, performance and risk metrics.",
            url: source.url,
        };
    }

    if (type.includes("news")) {
        return {
            name: "Crypto RSS Feeds",
            type: "Market news",
            description:
                "Recent cryptocurrency news collected from connected RSS feeds.",
            url: source.url,
        };
    }

    if (type.includes("document")) {
        return {
            name: "Research Documents",
            type: "Document context",
            description:
                "Supporting documents supplied to the research agent.",
            url: source.url,
        };
    }

    return {
        name: source.source || `Research source ${index + 1}`,
        type: source.type || "Research data",
        description:
            source.description || "Supporting evidence used by CryptoMind.",
        url: source.url,
    };
}

export default function ResearchPage() {
    const [query, setQuery] = useState("");
    const [result, setResult] =
        useState<ResearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const examples = [
        "What is the current Bitcoin price?",
        "Analyze Bitcoin performance and risk over the available historical period.",
        "Compare Bitcoin and Ethereum performance and risk.",
        "What is happening in the crypto market recently?",
    ];

    async function submitResearch(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setError("Please enter a research question.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch(`${API_BASE}/research`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: trimmedQuery,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.detail || "Research request failed."
                );
            }

            setResult(data);

            if (typeof window !== "undefined") {
                sessionStorage.setItem(
                    "cryptomind_latest_report",
                    JSON.stringify({
                        query: trimmedQuery,
                        result: data,
                        timestamp: new Date().toISOString(),
                    })
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to CryptoMind API."
            );
        } finally {
            setLoading(false);
        }
    }

    const report = result?.report;

    const liveMarket = report?.live_market;
    const historical = report?.historical_market;
    const performance = report?.performance;
    const risk = report?.risk_metrics;

    const news = useMemo(
        () => report?.news ?? [],
        [report]
    );

    const sources = useMemo(
        () => report?.sources ?? [],
        [report]
    );

    const normalizedSources = useMemo(
        () =>
            sources.map((source, index) =>
                normalizeSource(source, index)
            ),
        [sources]
    );

    return (
        <main className="min-h-screen pb-24">
            <div className="mx-auto max-w-[1280px] px-5 pt-16 md:px-8 md:pt-24">
                {/* HERO */}
                <section>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 px-4 py-2 text-[10px] font-semibold tracking-[0.22em] text-[#C6FF00]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C6FF00]" />
                        AI-POWERED CRYPTO RESEARCH
                    </div>

                    <h1 className="mt-6 max-w-4xl font-[var(--font-space)] text-4xl font-bold tracking-[-0.05em] text-white md:text-6xl">
                        Ask the market.
                        <br />
                        <span className="text-gradient">
                            Get the evidence.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-7 text-white/45 md:text-lg">
                        Investigate crypto markets using live prices,
                        historical analytics, risk metrics and recent
                        market intelligence.
                    </p>
                </section>

                {/* SEARCH */}
                <section className="mt-10 max-w-5xl">
                    <form onSubmit={submitResearch}>
                        <div className="glass rounded-3xl p-2">
                            <div className="flex flex-col gap-2 md:flex-row">
                                <div className="flex flex-1 items-center">
                                    <div className="px-4 text-cyan-400">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                        >
                                            <circle
                                                cx="11"
                                                cy="11"
                                                r="7"
                                            />
                                            <path d="m20 20-4-4" />
                                        </svg>
                                    </div>

                                    <input
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="Ask about Bitcoin, Ethereum, risk, performance or news..."
                                        className="h-14 w-full bg-transparent pr-3 text-sm text-white outline-none placeholder:text-white/25"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-14 rounded-2xl bg-[#C6FF00] px-8 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? "Researching..."
                                        : "Run research →"}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {examples.map((example) => (
                            <button
                                key={example}
                                type="button"
                                onClick={() => setQuery(example)}
                                className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-xs text-white/40 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-white/75"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ERROR */}
                {error && (
                    <div className="mt-8 max-w-5xl rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4">
                        <div className="text-sm font-semibold text-red-300">
                            Research failed
                        </div>

                        <div className="mt-1 text-xs text-red-300/60">
                            {error}
                        </div>
                    </div>
                )}

                {/* LOADING */}
                {loading && <ResearchLoading />}

                {/* EMPTY STATE */}
                {!loading && !result && !error && (
                    <EmptyResearch />
                )}

                {/* RESULTS */}
                {!loading && result && (
                    <section className="mt-14 space-y-12">
                        {/* QUERY HEADER */}
                        <div className="glass rounded-3xl p-6 md:p-8">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                                        Research complete
                                    </div>

                                    <h2 className="mt-2 font-[var(--font-space)] text-2xl font-bold text-white">
                                        Market intelligence
                                    </h2>

                                    <p className="mt-3 max-w-4xl text-sm leading-7 text-white/45">
                                        {query}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 px-4 py-2 text-xs text-[#C6FF00]">
                                        <span className="h-2 w-2 rounded-full bg-[#C6FF00]" />
                                        Agent complete
                                    </div>

                                    <Link
                                        href="/research/report"
                                        className="inline-flex items-center gap-2 rounded-full bg-[#C6FF00] px-5 py-2 text-xs font-bold text-black transition hover:brightness-110 shadow-lg shadow-[#C6FF00]/10"
                                    >
                                        View Full Report →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* LIVE MARKET */}
                        {liveMarket && (
                            <section>
                                <SectionHeader
                                    eyebrow="01"
                                    title="Live market"
                                    description="Current market conditions from the live market API."
                                />

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    <MetricCard
                                        label="Current price"
                                        value={formatPrice(
                                            liveMarket.current_price
                                        )}
                                        accent={true}
                                    />

                                    <MetricCard
                                        label="24h change"
                                        value={formatPercent(
                                            liveMarket.change_24h
                                        )}
                                        valueClass={metricColor(
                                            liveMarket.change_24h
                                        )}
                                    />

                                    <MetricCard
                                        label="Asset"
                                        value={
                                            liveMarket.coin_id
                                                ? liveMarket.coin_id.toUpperCase()
                                                : "—"
                                        }
                                    />
                                </div>
                            </section>
                        )}

                        {/* HISTORICAL */}
                        {historical && (
                            <section>
                                <SectionHeader
                                    eyebrow="02"
                                    title="Historical market"
                                    description="Statistics calculated from the CryptoMind historical database."
                                />

                                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <MetricCard
                                        label="Average price"
                                        value={formatPrice(
                                            historical.average_price
                                        )}
                                    />

                                    <MetricCard
                                        label="Period low"
                                        value={formatPrice(
                                            historical.min_price
                                        )}
                                    />

                                    <MetricCard
                                        label="Period high"
                                        value={formatPrice(
                                            historical.max_price
                                        )}
                                    />

                                    <MetricCard
                                        label="Period"
                                        value={
                                            typeof historical.period_days === "number" && !Number.isNaN(historical.period_days)
                                                ? `${historical.period_days.toFixed(
                                                    1
                                                )} days`
                                                : "—"
                                        }
                                    />
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <MetricCard
                                        label="7-day moving average"
                                        value={formatPrice(
                                            historical.moving_average_7d
                                        )}
                                    />

                                    <MetricCard
                                        label="30-day moving average"
                                        value={formatPrice(
                                            historical.moving_average_30d
                                        )}
                                    />
                                </div>

                                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-xs text-white/35">
                                    Historical period:
                                    <span className="ml-2 text-white/65">
                                        {formatDate(historical.period_start)}
                                    </span>
                                    <span className="mx-2 text-white/20">
                                        →
                                    </span>
                                    <span className="text-white/65">
                                        {formatDate(historical.period_end)}
                                    </span>
                                </div>
                            </section>
                        )}

                        {/* PERFORMANCE */}
                        {performance && (
                            <section>
                                <SectionHeader
                                    eyebrow="03"
                                    title="Performance"
                                    description="Observed returns over the available historical period."
                                />

                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <MetricCard
                                        label="7-day return"
                                        value={formatPercent(
                                            performance.return_7d
                                        )}
                                        valueClass={metricColor(
                                            performance.return_7d
                                        )}
                                    />

                                    <MetricCard
                                        label="Period return"
                                        value={formatPercent(
                                            performance.return_period
                                        )}
                                        valueClass={metricColor(
                                            performance.return_period
                                        )}
                                    />
                                </div>
                            </section>
                        )}

                        {/* RISK */}
                        {risk && (
                            <section>
                                <SectionHeader
                                    eyebrow="04"
                                    title="Risk profile"
                                    description="Historical risk measurements calculated by CryptoMind analytics."
                                />

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    <MetricCard
                                        label="Daily volatility"
                                        value={
                                            typeof risk.daily_volatility === "number" && !Number.isNaN(risk.daily_volatility)
                                                ? `${risk.daily_volatility.toFixed(
                                                    2
                                                )}%`
                                                : "—"
                                        }
                                    />

                                    <MetricCard
                                        label="Maximum drawdown"
                                        value={formatPercent(
                                            risk.maximum_drawdown
                                        )}
                                        valueClass={metricColor(
                                            risk.maximum_drawdown ?? undefined
                                        )}
                                    />

                                    <MetricCard
                                        label="Daily Sharpe ratio"
                                        value={
                                            typeof risk.daily_sharpe_ratio === "number" && !Number.isNaN(risk.daily_sharpe_ratio)
                                                ? risk.daily_sharpe_ratio.toFixed(
                                                    3
                                                )
                                                : "—"
                                        }
                                        valueClass={metricColor(
                                            risk.daily_sharpe_ratio ?? undefined
                                        )}
                                    />
                                </div>
                            </section>
                        )}

                        {/* INTERPRETATION */}
                        {report?.interpretation && (
                            <section>
                                <SectionHeader
                                    eyebrow="05"
                                    title="AI interpretation"
                                    description="The research agent's interpretation of the collected evidence."
                                />

                                <div className="relative mt-5 overflow-hidden rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.025]">
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                                    <div className="p-7 md:p-9">
                                        <div className="flex gap-5">
                                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 md:flex">
                                                ✦
                                            </div>

                                            <p className="text-sm leading-8 text-white/65">
                                                {report.interpretation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* NEWS */}
                        {news.length > 0 && (
                            <section>
                                <SectionHeader
                                    eyebrow="06"
                                    title="Latest news"
                                    description="Recent articles relevant to the research query."
                                />

                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                    {news.map((item, index) => {
                                        const description = cleanHtml(
                                            item.description
                                        );

                                        return (
                                            <NewsCard
                                                key={`${item.title}-${index}`}
                                                item={item}
                                                description={description}
                                            />
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* DOCUMENTS */}
                        <section>
                            <SectionHeader
                                eyebrow="07"
                                title="Document context"
                                description="Supporting documents supplied to the research agent."
                            />

                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                {report?.documents &&
                                    report.documents.length > 0 ? (
                                    <div className="text-sm text-white/60">
                                        {report.documents.length} document
                                        {report.documents.length === 1
                                            ? ""
                                            : "s"} supplied to the agent.
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-sm text-white/35">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10">
                                            —
                                        </span>

                                        No document context was provided for
                                        this research request.
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* SOURCES */}
                        {normalizedSources.length > 0 && (
                            <section>
                                <SectionHeader
                                    eyebrow="08"
                                    title="Evidence & sources"
                                    description="Data sources used by the research agent."
                                />

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    {normalizedSources.map(
                                        (source, index) => (
                                            <SourceCard
                                                key={`${source.name}-${index}`}
                                                source={source}
                                            />
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        {/* DISCLAIMER */}
                        <div className="border-t border-white/10 pt-8">
                            <p className="text-xs leading-6 text-white/25">
                                CryptoMind provides research and analytical
                                information for informational purposes only.
                                Historical performance does not guarantee
                                future results. No investment advice or future
                                price prediction is provided.
                            </p>
                        </div>

                        {/* NEW RESEARCH */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setResult(null);
                                    setQuery("");
                                    setError("");

                                    window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                    });
                                }}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-7 py-3 text-xs font-semibold text-white/55 transition hover:border-[#C6FF00]/30 hover:text-[#C6FF00]"
                            >
                                ← Start new research
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

/* -------------------------------------------------------
   SECTION HEADER
------------------------------------------------------- */

function SectionHeader({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div>
            <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#C6FF00]">
                    {eyebrow}
                </span>

                <span className="h-px w-8 bg-[#C6FF00]/30" />
            </div>

            <h2 className="mt-2 font-[var(--font-space)] text-2xl font-bold tracking-tight text-white">
                {title}
            </h2>

            <p className="mt-2 text-sm text-white/35">
                {description}
            </p>
        </div>
    );
}

/* -------------------------------------------------------
   METRIC CARD
------------------------------------------------------- */

function MetricCard({
    label,
    value,
    valueClass = "text-white",
    accent = false,
}: {
    label: string;
    value: string;
    valueClass?: string;
    accent?: boolean;
}) {
    return (
        <div className="glass group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-white/20">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                {label}
            </div>

            <div
                className={`mt-3 font-[var(--font-space)] text-2xl font-bold tracking-tight ${accent ? "text-[#C6FF00]" : valueClass
                    }`}
            >
                {value}
            </div>
        </div>
    );
}

/* -------------------------------------------------------
   NEWS CARD
------------------------------------------------------- */

function NewsCard({
    item,
    description,
}: {
    item: NewsItem;
    description: string;
}) {
    return (
        <article className="glass group rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20">
            <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-[#C6FF00]/15 bg-[#C6FF00]/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#C6FF00]">
                    {item.source || "Crypto News"}
                </span>

                {item.published_at && (
                    <span className="text-[10px] text-white/25">
                        {formatDate(item.published_at)}
                    </span>
                )}
            </div>

            <h3 className="mt-5 font-[var(--font-space)] text-lg font-semibold leading-7 text-white transition group-hover:text-[#C6FF00]">
                {item.title || "Untitled article"}
            </h3>

            {description && (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/40">
                    {description}
                </p>
            )}

            {item.url && (
                <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 transition hover:text-[#C6FF00]"
                >
                    Read article
                    <span>↗</span>
                </a>
            )}
        </article>
    );
}

/* -------------------------------------------------------
   SOURCE CARD
------------------------------------------------------- */

function SourceCard({
    source,
}: {
    source: {
        name: string;
        type: string;
        description: string;
        url?: string;
    };
}) {
    return (
        <div className="glass rounded-2xl p-5">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/5 text-cyan-400">
                    <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="8"
                        />
                        <path d="M12 8v8" />
                        <path d="M8 12h8" />
                    </svg>
                </div>

                <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                        {source.type}
                    </div>

                    <h3 className="mt-1 font-[var(--font-space)] text-sm font-semibold text-white">
                        {source.name}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-white/35">
                        {source.description}
                    </p>

                    {source.url && (
                        <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block text-[11px] text-[#C6FF00] hover:underline"
                        >
                            Open source →
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------
   EMPTY STATE
------------------------------------------------------- */

function EmptyResearch() {
    return (
        <section className="mt-20 grid max-w-6xl gap-4 md:grid-cols-3">
            <CapabilityCard
                number="01"
                title="Live intelligence"
                description="Get current cryptocurrency prices and market movement directly from live market data."
            />

            <CapabilityCard
                number="02"
                title="Risk analytics"
                description="Analyze returns, volatility, drawdowns, moving averages and Sharpe ratios."
            />

            <CapabilityCard
                number="03"
                title="Market evidence"
                description="Combine quantitative analytics with recent crypto news and supporting sources."
            />
        </section>
    );
}

function CapabilityCard({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="glass group rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20">
            <div className="font-mono text-xs text-[#C6FF00]/70">
                {number}
            </div>

            <h3 className="mt-5 font-[var(--font-space)] text-lg font-semibold text-white">
                {title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/35">
                {description}
            </p>

            <div className="mt-6 h-px w-10 bg-gradient-to-r from-[#C6FF00] to-transparent transition-all group-hover:w-20" />
        </div>
    );
}

/* -------------------------------------------------------
   LOADING
------------------------------------------------------- */

function ResearchLoading() {
    return (
        <section className="mt-14 max-w-6xl space-y-10">
            <div className="glass animate-pulse rounded-3xl p-8">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="mt-5 h-7 w-72 rounded bg-white/10" />
                <div className="mt-4 h-4 w-full max-w-2xl rounded bg-white/5" />
            </div>

            <div>
                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="glass h-32 animate-pulse rounded-2xl" />
                    <div className="glass h-32 animate-pulse rounded-2xl" />
                    <div className="glass h-32 animate-pulse rounded-2xl" />
                </div>
            </div>

            <div>
                <div className="h-3 w-28 animate-pulse rounded bg-white/10" />

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="glass h-32 animate-pulse rounded-2xl" />
                    <div className="glass h-32 animate-pulse rounded-2xl" />
                    <div className="glass h-32 animate-pulse rounded-2xl" />
                </div>
            </div>
        </section>
    );
}