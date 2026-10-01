"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type CryptoData = {
    symbol: string;
    current_price: number;
    average_price: number;
    minimum_price: number;
    maximum_price: number;
    moving_average_7d: number;
    moving_average_30d: number;
    return_7d: number;
    return_period: number;
    period_start: string;
    period_end: string;
    period_days: number;
    daily_volatility: number;
    maximum_drawdown: number;
    daily_sharpe_ratio: number;
};

type HistoryPoint = {
    date: string;
    price: number;
};

import { API_BASE_URL as API_URL } from "@/lib/api";

function formatPrice(value: number | null) {
    if (value === null) return "—";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatPercent(value: number | null) {
    if (value === null) return "—";

    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatNumber(value: number | null) {
    if (value === null) return "—";

    return value.toFixed(3);
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function MetricCard({
    label,
    value,
    subtext,
    accent = false,
}: {
    label: string;
    value: string;
    subtext?: string;
    accent?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl transition hover:border-white/[0.14]">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                {label}
            </p>

            <p
                className={`mt-3 text-2xl font-semibold tracking-tight ${accent ? "text-[#C6FF00]" : "text-white"
                    }`}
            >
                {value}
            </p>

            {subtext && (
                <p className="mt-1 text-xs text-white/35">
                    {subtext}
                </p>
            )}
        </div>
    );
}

export default function DashboardPage() {
    // ==========================================================
    // STATE
    // ==========================================================

    const [symbols, setSymbols] = useState<string[]>([]);

    const [selectedSymbol, setSelectedSymbol] =
        useState("BTC");

    const [searchQuery, setSearchQuery] =
        useState("");

    const [crypto, setCrypto] =
        useState<CryptoData | null>(null);

    const [history, setHistory] =
        useState<HistoryPoint[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    // ==========================================================
    // LOAD AVAILABLE CRYPTOCURRENCIES
    // ==========================================================

    useEffect(() => {
        async function loadSymbols() {
            try {
                const response = await fetch(
                    `${API_URL}/crypto/symbols`,
                    {
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load cryptocurrency symbols"
                    );
                }

                const data = await response.json();

                const availableSymbols: string[] =
                    data.symbols || [];

                setSymbols(availableSymbols);

                setSelectedSymbol((current) => {
                    if (
                        availableSymbols.includes(current)
                    ) {
                        return current;
                    }

                    return availableSymbols[0] || "BTC";
                });
            } catch (error) {
                console.error(
                    "Failed to load cryptocurrency symbols:",
                    error
                );

                setError(
                    "Unable to load available cryptocurrencies."
                );
            }
        }

        loadSymbols();
    }, []);

    // ==========================================================
    // FILTER SYMBOLS
    // ==========================================================

    const filteredSymbols = useMemo(() => {
        const query = searchQuery
            .trim()
            .toUpperCase();

        if (!query) {
            return symbols;
        }

        return symbols.filter((symbol) =>
            symbol.toUpperCase().includes(query)
        );
    }, [symbols, searchQuery]);

    // ==========================================================
    // LOAD SELECTED CRYPTO DATA
    // ==========================================================

    useEffect(() => {
        async function loadDashboard() {
            if (!selectedSymbol) return;

            setLoading(true);
            setError("");

            try {
                const [
                    cryptoResponse,
                    historyResponse,
                ] = await Promise.all([
                    fetch(
                        `${API_URL}/crypto/${selectedSymbol}`,
                        {
                            cache: "no-store",
                        }
                    ),

                    fetch(
                        `${API_URL}/crypto/${selectedSymbol}/history`,
                        {
                            cache: "no-store",
                        }
                    ),
                ]);

                if (!cryptoResponse.ok) {
                    throw new Error(
                        `Failed to load ${selectedSymbol} analytics`
                    );
                }

                if (!historyResponse.ok) {
                    throw new Error(
                        `Failed to load ${selectedSymbol} history`
                    );
                }

                const cryptoData =
                    await cryptoResponse.json();

                const historyData =
                    await historyResponse.json();

                setCrypto(cryptoData);

                setHistory(
                    historyData.data || []
                );
            } catch (error) {
                console.error(error);

                setCrypto(null);
                setHistory([]);

                setError(
                    "Unable to connect to CryptoMind API. Make sure FastAPI is running."
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [selectedSymbol]);

    // ==========================================================
    // CHART DATA
    // ==========================================================

    const chartData = useMemo(() => {
        return history.map((item) => ({
            date: formatDate(item.date),
            price: item.price,
        }));
    }, [history]);

    const priceChangePositive =
        (crypto?.return_7d ?? 0) >= 0;

    // ==========================================================
    // UI
    // ==========================================================

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-10">

                {/* =====================================================
            HEADER
        ====================================================== */}

                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF00] shadow-[0_0_10px_#C6FF00]" />

                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C6FF00]">
                                Live Market Intelligence
                            </span>
                        </div>

                        <h1 className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
                            Crypto Dashboard
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
                            Real-time crypto analytics powered by
                            CryptoMind&apos;s market data and risk
                            engine.
                        </p>
                    </div>

                    {/* API STATUS */}

                    <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 md:self-auto">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#C6FF00]" />

                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
                            API Connected
                        </span>
                    </div>
                </div>

                {/* =====================================================
            ASSET SELECTOR
        ====================================================== */}

                <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur-xl">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                                Asset Universe
                            </p>

                            <p className="mt-1 text-sm text-white/45">
                                Select a cryptocurrency to analyze
                            </p>
                        </div>

                        <p className="font-mono text-[10px] text-white/25">
                            {symbols.length} assets available
                        </p>
                    </div>

                    {/* SEARCH */}

                    <div className="relative mt-4 max-w-md">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                            ⌕
                        </span>

                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(
                                    event.target.value
                                )
                            }
                            placeholder="Search cryptocurrency..."
                            className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#C6FF00]/30 focus:ring-1 focus:ring-[#C6FF00]/10"
                        />
                    </div>

                    {/* ASSET BUTTONS */}

                    <div className="mt-4 flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">

                        {symbols.length === 0 ? (
                            <div className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/30">
                                Loading assets...
                            </div>
                        ) : filteredSymbols.length === 0 ? (
                            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm text-white/30">
                                No assets match &quot;
                                {searchQuery}
                                &quot;
                            </div>
                        ) : (
                            filteredSymbols.map((symbol) => (
                                <button
                                    key={symbol}
                                    onClick={() => {
                                        setSelectedSymbol(symbol);
                                        setSearchQuery("");
                                    }}
                                    className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${selectedSymbol === symbol
                                            ? "border-[#C6FF00]/40 bg-[#C6FF00] text-black shadow-[0_0_25px_rgba(198,255,0,0.12)]"
                                            : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                                        }`}
                                >
                                    {symbol}
                                </button>
                            ))
                        )}

                    </div>
                </div>

                {/* =====================================================
            ERROR
        ====================================================== */}

                {error && (
                    <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* =====================================================
            MAIN MARKET CARD
        ====================================================== */}

                <div className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl md:p-8">

                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                                {selectedSymbol} / USD
                            </p>

                            <div className="mt-3 flex items-baseline gap-4">
                                <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                                    {loading
                                        ? "Loading..."
                                        : formatPrice(
                                            crypto?.current_price ??
                                            null
                                        )}
                                </h2>

                                {!loading && crypto && (
                                    <span
                                        className={`text-sm font-medium ${priceChangePositive
                                                ? "text-[#C6FF00]"
                                                : "text-red-400"
                                            }`}
                                    >
                                        {formatPercent(
                                            crypto.return_7d
                                        )}{" "}
                                        7D
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-xs text-white/30">
                                Analysis period:{" "}
                                {crypto?.period_days ?? "—"} days
                            </p>
                        </div>

                        {/* MOVING AVERAGES */}

                        <div className="grid grid-cols-2 gap-6 text-right">

                            <div>
                                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                    7D MA
                                </p>

                                <p className="mt-1 text-sm font-semibold text-white">
                                    {loading
                                        ? "—"
                                        : formatPrice(
                                            crypto?.moving_average_7d ??
                                            null
                                        )}
                                </p>
                            </div>

                            <div>
                                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                    30D MA
                                </p>

                                <p className="mt-1 text-sm font-semibold text-white">
                                    {loading
                                        ? "—"
                                        : formatPrice(
                                            crypto?.moving_average_30d ??
                                            null
                                        )}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* ===================================================
              PRICE CHART
          ==================================================== */}

                    <div className="mt-10 h-[360px] w-full">

                        {loading ? (
                            <div className="flex h-full items-center justify-center rounded-2xl bg-white/[0.015]">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C6FF00]" />
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <AreaChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >

                                    <defs>
                                        <linearGradient
                                            id="cryptoGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#C6FF00"
                                                stopOpacity={0.25}
                                            />

                                            <stop
                                                offset="100%"
                                                stopColor="#C6FF00"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        stroke="rgba(255,255,255,0.05)"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="date"
                                        tick={{
                                            fill: "rgba(255,255,255,0.3)",
                                            fontSize: 10,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        minTickGap={35}
                                    />

                                    <YAxis
                                        tick={{
                                            fill: "rgba(255,255,255,0.3)",
                                            fontSize: 10,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={65}
                                        tickFormatter={(value) =>
                                            `$${Number(
                                                value
                                            ).toLocaleString()}`
                                        }
                                    />

                                    <Tooltip
                                        contentStyle={{
                                            background:
                                                "rgba(5,5,7,0.95)",
                                            border:
                                                "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "12px",
                                            color: "white",
                                        }}
                                        labelStyle={{
                                            color:
                                                "rgba(255,255,255,0.45)",
                                            fontSize: 10,
                                        }}
                                        formatter={(value) => [
                                            formatPrice(
                                                Number(value)
                                            ),
                                            selectedSymbol,
                                        ]}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#C6FF00"
                                        strokeWidth={2}
                                        fill="url(#cryptoGradient)"
                                        dot={false}
                                        activeDot={{
                                            r: 4,
                                            fill: "#C6FF00",
                                            stroke: "#050507",
                                            strokeWidth: 2,
                                        }}
                                    />

                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-white/30">
                                No historical data available.
                            </div>
                        )}

                    </div>
                </div>

                {/* =====================================================
            MAIN METRICS
        ====================================================== */}

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <MetricCard
                        label="7D Return"
                        value={
                            loading
                                ? "—"
                                : formatPercent(
                                    crypto?.return_7d ?? null
                                )
                        }
                        subtext="Price performance"
                        accent={
                            (crypto?.return_7d ?? 0) >= 0
                        }
                    />

                    <MetricCard
                        label="Period Return"
                        value={
                            loading
                                ? "—"
                                : formatPercent(
                                    crypto?.return_period ?? null
                                )
                        }
                        subtext="Full analysis period"
                        accent={
                            (crypto?.return_period ?? 0) >= 0
                        }
                    />

                    <MetricCard
                        label="Volatility"
                        value={
                            loading
                                ? "—"
                                : `${(
                                    crypto?.daily_volatility ?? 0
                                ).toFixed(2)}%`
                        }
                        subtext="Daily volatility"
                    />

                    <MetricCard
                        label="Max Drawdown"
                        value={
                            loading
                                ? "—"
                                : `${(
                                    crypto?.maximum_drawdown ?? 0
                                ).toFixed(2)}%`
                        }
                        subtext="Peak-to-trough decline"
                    />

                </div>

                {/* =====================================================
            ADVANCED METRICS
        ====================================================== */}

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                    <MetricCard
                        label="Sharpe Ratio"
                        value={
                            loading
                                ? "—"
                                : formatNumber(
                                    crypto?.daily_sharpe_ratio ??
                                    null
                                )
                        }
                        subtext="Risk-adjusted return"
                    />

                    <MetricCard
                        label="Minimum Price"
                        value={
                            loading
                                ? "—"
                                : formatPrice(
                                    crypto?.minimum_price ??
                                    null
                                )
                        }
                        subtext="Analysis period low"
                    />

                    <MetricCard
                        label="Maximum Price"
                        value={
                            loading
                                ? "—"
                                : formatPrice(
                                    crypto?.maximum_price ??
                                    null
                                )
                        }
                        subtext="Analysis period high"
                    />

                </div>

                {/* =====================================================
            MARKET SUMMARY
        ====================================================== */}

                <div className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                        <div>
                            <h3 className="font-display text-xl font-semibold text-white">
                                Market Summary
                            </h3>

                            <p className="mt-1 text-sm text-white/35">
                                Statistical overview for{" "}
                                {selectedSymbol}.
                            </p>
                        </div>

                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
                            CryptoMind Analytics Engine
                        </span>

                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">

                        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                Average Price
                            </p>

                            <p className="mt-2 text-lg font-semibold text-white">
                                {loading
                                    ? "—"
                                    : formatPrice(
                                        crypto?.average_price ??
                                        null
                                    )}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                Period Start
                            </p>

                            <p className="mt-2 text-lg font-semibold text-white">
                                {crypto?.period_start
                                    ? formatDate(
                                        crypto.period_start
                                    )
                                    : "—"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                Period End
                            </p>

                            <p className="mt-2 text-lg font-semibold text-white">
                                {crypto?.period_end
                                    ? formatDate(
                                        crypto.period_end
                                    )
                                    : "—"}
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}