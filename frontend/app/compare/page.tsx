"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type CryptoComparison = {
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

import { API_BASE_URL } from "@/lib/api";

function formatPrice(value: number | null) {
    if (value === null || value === undefined) {
        return "—";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatPercent(value: number | null | undefined) {
    if (value === null || value === undefined || typeof value !== "number" || Number.isNaN(value)) {
        return "—";
    }

    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatRatio(value: number | null | undefined) {
    if (value === null || value === undefined || typeof value !== "number" || Number.isNaN(value)) {
        return "—";
    }

    return value.toFixed(3);
}

function MetricValue({
    value,
    positiveColor = false,
}: {
    value: string;
    positiveColor?: boolean;
}) {
    return (
        <span
            className={
                positiveColor
                    ? "font-semibold text-[#C6FF00]"
                    : "font-semibold text-white"
            }
        >
            {value}
        </span>
    );
}

export default function ComparePage() {
    const [symbols, setSymbols] = useState<string[]>([]);

    const [selectedSymbols, setSelectedSymbols] =
        useState<string[]>(["BTC", "ETH"]);

    const [searchQuery, setSearchQuery] =
        useState("");

    const [comparison, setComparison] =
        useState<CryptoComparison[]>([]);

    const [loadingSymbols, setLoadingSymbols] =
        useState(true);

    const [loadingComparison, setLoadingComparison] =
        useState(false);

    const [error, setError] = useState("");

    // ==========================================================
    // LOAD AVAILABLE ASSETS
    // ==========================================================

    useEffect(() => {
        async function loadSymbols() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/crypto/symbols`,
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

                const available: string[] =
                    data.symbols || [];

                setSymbols(available);

                setSelectedSymbols((current) => {
                    const validCurrent = current.filter(
                        (symbol) =>
                            available.includes(symbol)
                    );

                    if (validCurrent.length >= 2) {
                        return validCurrent;
                    }

                    return available.slice(0, 2);
                });
            } catch (error) {
                console.error(error);

                setError(
                    "Unable to load available cryptocurrencies."
                );
            } finally {
                setLoadingSymbols(false);
            }
        }

        loadSymbols();
    }, []);

    // ==========================================================
    // FILTER ASSETS
    // ==========================================================

    const filteredSymbols = useMemo(() => {
        const query = searchQuery
            .trim()
            .toUpperCase();

        if (!query) {
            return symbols;
        }

        return symbols.filter((symbol) =>
            symbol.includes(query)
        );
    }, [symbols, searchQuery]);

    // ==========================================================
    // SELECT / UNSELECT ASSET
    // ==========================================================

    function toggleSymbol(symbol: string) {
        setSelectedSymbols((current) => {
            if (current.includes(symbol)) {
                if (current.length <= 2) {
                    return current;
                }

                return current.filter(
                    (item) => item !== symbol
                );
            }

            return [...current, symbol];
        });
    }

    // ==========================================================
    // LOAD COMPARISON
    // ==========================================================

    async function runComparison() {
        if (selectedSymbols.length < 2) {
            setError(
                "Select at least two cryptocurrencies to compare."
            );

            return;
        }

        setLoadingComparison(true);
        setError("");

        try {
            const query = selectedSymbols.join(",");

            const response = await fetch(
                `${API_BASE_URL}/compare?symbols=${encodeURIComponent(
                    query
                )}`,
                {
                    cache: "no-store",
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load comparison data"
                );
            }

            const data =
                await response.json();

            setComparison(data);
        } catch (error) {
            console.error(error);

            setComparison([]);

            setError(
                "Unable to load comparison data from CryptoMind API."
            );
        } finally {
            setLoadingComparison(false);
        }
    }

    // ==========================================================
    // INITIAL COMPARISON
    // ==========================================================

    useEffect(() => {
        if (selectedSymbols.length >= 2) {
            runComparison();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbols.length]);

    // ==========================================================
    // CHART DATA
    // ==========================================================

    const returnChartData = comparison.map(
        (crypto) => ({
            symbol: crypto.symbol,
            return7d: crypto.return_7d,
            periodReturn: crypto.return_period,
        })
    );

    const volatilityChartData =
        comparison.map((crypto) => ({
            symbol: crypto.symbol,
            volatility: crypto.daily_volatility,
            drawdown: Math.abs(
                crypto.maximum_drawdown
            ),
        }));

    const sharpeChartData =
        comparison.map((crypto) => ({
            symbol: crypto.symbol,
            sharpe: crypto.daily_sharpe_ratio,
        }));

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-10">

                {/* =====================================================
            HEADER
        ====================================================== */}

                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />

                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">
                                Multi-Asset Research
                            </span>
                        </div>

                        <h1 className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
                            Crypto Comparison
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                            Compare market performance, volatility,
                            drawdown and risk-adjusted returns using
                            CryptoMind&apos;s analytics engine.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 md:self-auto">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#C6FF00]" />

                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
                            Live API
                        </span>
                    </div>

                </div>

                {/* =====================================================
            ASSET SELECTOR
        ====================================================== */}

                <section className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                                Comparison Universe
                            </p>

                            <p className="mt-1 text-sm text-white/45">
                                Select two or more assets
                            </p>
                        </div>

                        <span className="font-mono text-[10px] text-white/25">
                            {selectedSymbols.length} selected
                        </span>

                    </div>

                    {/* SEARCH */}

                    <div className="relative mt-5 max-w-md">
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

                    {/* ASSETS */}

                    <div className="mt-4 flex max-h-36 flex-wrap gap-2 overflow-y-auto">

                        {loadingSymbols ? (
                            <div className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/30">
                                Loading assets...
                            </div>
                        ) : filteredSymbols.length === 0 ? (
                            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm text-white/30">
                                No matching assets.
                            </div>
                        ) : (
                            filteredSymbols.map((symbol) => {
                                const selected =
                                    selectedSymbols.includes(
                                        symbol
                                    );

                                return (
                                    <button
                                        key={symbol}
                                        onClick={() =>
                                            toggleSymbol(symbol)
                                        }
                                        className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${selected
                                            ? "border-[#C6FF00]/40 bg-[#C6FF00] text-black"
                                            : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
                                            }`}
                                    >
                                        {selected && (
                                            <span className="mr-1">
                                                ✓
                                            </span>
                                        )}

                                        {symbol}
                                    </button>
                                );
                            })
                        )}

                    </div>

                    {/* SELECTED ASSETS */}

                    <div className="mt-5 flex flex-wrap items-center gap-2">

                        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
                            Selected:
                        </span>

                        {selectedSymbols.map((symbol) => (
                            <span
                                key={symbol}
                                className="rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 px-3 py-1.5 font-mono text-[10px] text-[#C6FF00]"
                            >
                                {symbol}
                            </span>
                        ))}

                    </div>

                    {/* RUN BUTTON */}

                    <button
                        onClick={runComparison}
                        disabled={
                            selectedSymbols.length < 2 ||
                            loadingComparison
                        }
                        className="mt-6 rounded-full bg-[#C6FF00] px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loadingComparison
                            ? "Analyzing..."
                            : "Run comparison →"}
                    </button>

                </section>

                {/* =====================================================
            ERROR
        ====================================================== */}

                {error && (
                    <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* =====================================================
            LOADING
        ====================================================== */}

                {loadingComparison ? (
                    <div className="mt-8 flex h-64 items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.025]">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C6FF00]" />
                    </div>
                ) : comparison.length > 0 ? (
                    <>
                        {/* =================================================
                COMPARISON TABLE
            ================================================== */}

                        <section className="mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl">

                            <div className="border-b border-white/[0.06] p-6">
                                <h2 className="font-display text-xl font-semibold text-white">
                                    Performance Overview
                                </h2>

                                <p className="mt-1 text-sm text-white/35">
                                    Real-time metrics from the
                                    CryptoMind analytics engine.
                                </p>
                            </div>

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[850px] text-left">

                                    <thead>
                                        <tr className="border-b border-white/[0.06]">

                                            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                                Asset
                                            </th>

                                            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                                Price
                                            </th>

                                            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                                7D Return
                                            </th>

                                            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                                Period Return
                                            </th>

                                            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                                Volatility
                                            </th>

                                            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                                Drawdown
                                            </th>

                                            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                                                Sharpe
                                            </th>

                                        </tr>
                                    </thead>

                                    <tbody>

                                        {comparison.map((crypto) => (

                                            <tr
                                                key={crypto.symbol}
                                                className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                                            >

                                                <td className="px-6 py-5">
                                                    <span className="font-semibold text-white">
                                                        {crypto.symbol}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-white/75">
                                                    {formatPrice(
                                                        crypto.current_price
                                                    )}
                                                </td>

                                                <td className="px-6 py-5 text-sm">
                                                    <MetricValue
                                                        value={formatPercent(
                                                            crypto.return_7d
                                                        )}
                                                        positiveColor={
                                                            crypto.return_7d >=
                                                            0
                                                        }
                                                    />
                                                </td>

                                                <td className="px-6 py-5 text-sm">
                                                    <MetricValue
                                                        value={formatPercent(
                                                            crypto.return_period
                                                        )}
                                                        positiveColor={
                                                            crypto.return_period >=
                                                            0
                                                        }
                                                    />
                                                </td>

                                                <td className="px-6 py-5 text-sm text-white/70">
                                                    {typeof crypto.daily_volatility === "number" && !Number.isNaN(crypto.daily_volatility)
                                                        ? `${crypto.daily_volatility.toFixed(2)}%`
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-5 text-sm text-red-300">
                                                    {typeof crypto.maximum_drawdown === "number" && !Number.isNaN(crypto.maximum_drawdown)
                                                        ? `${crypto.maximum_drawdown.toFixed(2)}%`
                                                        : "—"}
                                                </td>

                                                <td className="px-6 py-5 text-sm text-white/80">
                                                    {formatRatio(
                                                        crypto.daily_sharpe_ratio
                                                    )}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>
                        </section>

                        {/* =================================================
                CHARTS
            ================================================== */}

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">

                            {/* RETURNS */}

                            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">

                                <h2 className="font-display text-xl font-semibold text-white">
                                    Returns
                                </h2>

                                <p className="mt-1 text-sm text-white/35">
                                    7-day and full-period performance.
                                </p>

                                <div className="mt-8 h-[320px]">

                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={returnChartData}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                left: -15,
                                                bottom: 0,
                                            }}
                                        >

                                            <CartesianGrid
                                                stroke="rgba(255,255,255,0.05)"
                                                vertical={false}
                                            />

                                            <XAxis
                                                dataKey="symbol"
                                                tick={{
                                                    fill:
                                                        "rgba(255,255,255,0.4)",
                                                    fontSize: 10,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />

                                            <YAxis
                                                tick={{
                                                    fill:
                                                        "rgba(255,255,255,0.3)",
                                                    fontSize: 10,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) =>
                                                    `${value}%`
                                                }
                                            />

                                            <Tooltip
                                                contentStyle={{
                                                    background:
                                                        "rgba(5,5,7,0.95)",
                                                    border:
                                                        "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius:
                                                        "12px",
                                                }}
                                                formatter={(value) =>
                                                    `${Number(
                                                        value
                                                    ).toFixed(2)}%`
                                                }
                                            />

                                            <Bar
                                                dataKey="return7d"
                                                name="7D Return"
                                                fill="#C6FF00"
                                                radius={[
                                                    5,
                                                    5,
                                                    0,
                                                    0,
                                                ]}
                                            />

                                            <Bar
                                                dataKey="periodReturn"
                                                name="Period Return"
                                                fill="#00E5FF"
                                                radius={[
                                                    5,
                                                    5,
                                                    0,
                                                    0,
                                                ]}
                                            />

                                        </BarChart>
                                    </ResponsiveContainer>

                                </div>
                            </section>

                            {/* RISK */}

                            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">

                                <h2 className="font-display text-xl font-semibold text-white">
                                    Risk Profile
                                </h2>

                                <p className="mt-1 text-sm text-white/35">
                                    Volatility versus maximum drawdown.
                                </p>

                                <div className="mt-8 h-[320px]">

                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={volatilityChartData}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                left: -15,
                                                bottom: 0,
                                            }}
                                        >

                                            <CartesianGrid
                                                stroke="rgba(255,255,255,0.05)"
                                                vertical={false}
                                            />

                                            <XAxis
                                                dataKey="symbol"
                                                tick={{
                                                    fill:
                                                        "rgba(255,255,255,0.4)",
                                                    fontSize: 10,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />

                                            <YAxis
                                                tick={{
                                                    fill:
                                                        "rgba(255,255,255,0.3)",
                                                    fontSize: 10,
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) =>
                                                    `${value}%`
                                                }
                                            />

                                            <Tooltip
                                                contentStyle={{
                                                    background:
                                                        "rgba(5,5,7,0.95)",
                                                    border:
                                                        "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius:
                                                        "12px",
                                                }}
                                                formatter={(value) =>
                                                    `${Number(
                                                        value
                                                    ).toFixed(2)}%`
                                                }
                                            />

                                            <Bar
                                                dataKey="volatility"
                                                name="Volatility"
                                                fill="#00E5FF"
                                                radius={[
                                                    5,
                                                    5,
                                                    0,
                                                    0,
                                                ]}
                                            />

                                            <Bar
                                                dataKey="drawdown"
                                                name="Max Drawdown"
                                                fill="#C6FF00"
                                                radius={[
                                                    5,
                                                    5,
                                                    0,
                                                    0,
                                                ]}
                                            />

                                        </BarChart>
                                    </ResponsiveContainer>

                                </div>
                            </section>

                        </div>

                        {/* =================================================
                SHARPE
            ================================================== */}

                        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">

                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                                <div>
                                    <h2 className="font-display text-xl font-semibold text-white">
                                        Risk-Adjusted Performance
                                    </h2>

                                    <p className="mt-1 text-sm text-white/35">
                                        Daily Sharpe ratio comparison.
                                    </p>
                                </div>

                                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
                                    CryptoMind Analytics
                                </span>

                            </div>

                            <div className="mt-8 h-[300px]">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={sharpeChartData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -15,
                                            bottom: 0,
                                        }}
                                    >

                                        <CartesianGrid
                                            stroke="rgba(255,255,255,0.05)"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="symbol"
                                            tick={{
                                                fill:
                                                    "rgba(255,255,255,0.4)",
                                                fontSize: 10,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            tick={{
                                                fill:
                                                    "rgba(255,255,255,0.3)",
                                                fontSize: 10,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                background:
                                                    "rgba(5,5,7,0.95)",
                                                border:
                                                    "1px solid rgba(255,255,255,0.1)",
                                                borderRadius:
                                                    "12px",
                                            }}
                                            formatter={(value) =>
                                                Number(value).toFixed(3)
                                            }
                                        />

                                        <Bar
                                            dataKey="sharpe"
                                            name="Sharpe Ratio"
                                            fill="#C6FF00"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0,
                                            ]}
                                        />

                                    </BarChart>
                                </ResponsiveContainer>

                            </div>
                        </section>
                    </>
                ) : (
                    !loadingComparison && (
                        <div className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-12 text-center">
                            <p className="text-sm text-white/35">
                                Select assets and run a comparison
                                to view the analysis.
                            </p>
                        </div>
                    )
                )}

            </div>
        </main>
    );
}