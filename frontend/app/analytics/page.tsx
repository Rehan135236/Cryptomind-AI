"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowUpDown, HelpCircle, Layers, LineChart, RefreshCw, ShieldCheck } from "lucide-react";

import { API_BASE_URL as API_BASE } from "@/lib/api";

type MatrixData = {
    [key: string]: {
        [key: string]: number;
    };
};

function getCorrelationColor(value: number) {
    if (value === 1.0) return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    if (value >= 0.7) return "bg-[#C6FF00]/20 text-[#C6FF00] border-[#C6FF00]/40";
    if (value >= 0.4) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (value >= 0.0) return "bg-blue-500/10 text-blue-300 border-blue-500/20";
    if (value >= -0.4) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    return "bg-red-500/20 text-red-300 border-red-500/40";
}

function getStrengthDescription(value: number) {
    if (value >= 0.85) return "Very Strong Positive";
    if (value >= 0.6) return "Strong Positive";
    if (value >= 0.35) return "Moderate Positive";
    if (value >= 0.1) return "Weak Positive";
    if (value >= -0.1) return "Neutral / Uncorrelated";
    if (value >= -0.4) return "Moderate Negative";
    return "Strong Negative";
}

export default function AnalyticsPage() {
    const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
    const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["BTC", "ETH", "SOL", "BNB"]);
    const [matrix, setMatrix] = useState<MatrixData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [symbolSearch, setSymbolSearch] = useState<string>("");

    // Fetch available crypto symbols on mount
    useEffect(() => {
        async function fetchSymbols() {
            try {
                const res = await fetch(`${API_BASE}/crypto/symbols`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.symbols && Array.isArray(data.symbols)) {
                        setAvailableSymbols(data.symbols);
                    }
                }
            } catch (e) {
                console.warn("Could not fetch available symbols, using default set.", e);
                setAvailableSymbols(["BTC", "ETH", "SOL", "BNB"]);
            }
        }
        fetchSymbols();
    }, []);

    // Fetch correlation matrix
    const fetchCorrelation = async (symbolsToFetch: string[]) => {
        if (symbolsToFetch.length < 2) {
            setError("Select at least 2 cryptocurrencies to calculate correlation.");
            setMatrix(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const symString = symbolsToFetch.join(",");
            const res = await fetch(`${API_BASE}/correlation?symbols=${symString}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData?.detail || `API error ${res.status}`);
            }
            const data = await res.json();
            setMatrix(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load correlation data.");
            setMatrix(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCorrelation(selectedSymbols);
    }, [selectedSymbols]);

    const toggleSymbol = (sym: string) => {
        if (selectedSymbols.includes(sym)) {
            if (selectedSymbols.length <= 2) {
                setError("You must select at least 2 cryptocurrencies.");
                return;
            }
            setSelectedSymbols(selectedSymbols.filter((s) => s !== sym));
        } else {
            setSelectedSymbols([...selectedSymbols, sym]);
        }
    };

    // Filter available symbols for selector dropdown/search
    const filteredSymbols = useMemo(() => {
        if (!symbolSearch.trim()) return availableSymbols;
        return availableSymbols.filter((s) => s.toLowerCase().includes(symbolSearch.toLowerCase()));
    }, [availableSymbols, symbolSearch]);

    // Format matrix into flat pairwise table entries
    const pairTableEntries = useMemo(() => {
        if (!matrix) return [];
        const symbols = Object.keys(matrix);
        const pairs: { assetA: string; assetB: string; value: number; strength: string }[] = [];

        for (let i = 0; i < symbols.length; i++) {
            for (let j = i + 1; j < symbols.length; j++) {
                const a = symbols[i];
                const b = symbols[j];
                const val = matrix[a]?.[b] ?? matrix[b]?.[a] ?? 0;
                pairs.push({
                    assetA: a,
                    assetB: b,
                    value: val,
                    strength: getStrengthDescription(val),
                });
            }
        }
        return pairs.sort((x, y) => Math.abs(y.value) - Math.abs(x.value));
    }, [matrix]);

    const matrixSymbols = matrix ? Object.keys(matrix) : [];

    return (
        <main className="min-h-screen pb-24 text-white">
            <div className="mx-auto max-w-[1280px] px-5 pt-16 md:px-8 md:pt-20 space-y-10">

                {/* HEADER */}
                <section className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C6FF00]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C6FF00]" />
                        QUANTITATIVE ANALYTICS ENGINE
                    </div>

                    <h1 className="font-display text-4xl font-bold tracking-[-0.04em] md:text-6xl text-white">
                        Advanced <span className="text-gradient">Analytics</span>
                    </h1>

                    <p className="max-w-2xl text-base text-white/45 md:text-lg">
                        Cross-asset correlation matrix, price co-movement telemetry, and statistical relationship analytics computed directly from historical data.
                    </p>
                </section>

                {/* ASSET SELECTOR BAR */}
                <section className="glass rounded-3xl p-6 border border-white/10 space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                        <div>
                            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                                <Layers size={18} className="text-[#C6FF00]" />
                                Asset Selector
                            </h3>
                            <p className="text-xs text-white/40">Select cryptocurrencies to construct the correlation matrix.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={symbolSearch}
                                onChange={(e) => setSymbolSearch(e.target.value)}
                                placeholder="Filter symbols..."
                                className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-[#C6FF00]/40"
                            />
                            <button
                                type="button"
                                onClick={() => fetchCorrelation(selectedSymbols)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/10"
                                title="Recalculate matrix"
                            >
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* PILLS */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        {filteredSymbols.map((sym) => {
                            const isSelected = selectedSymbols.includes(sym);
                            return (
                                <button
                                    key={sym}
                                    type="button"
                                    onClick={() => toggleSymbol(sym)}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold font-mono transition flex items-center gap-1.5 ${isSelected
                                            ? "bg-[#C6FF00] text-black shadow-lg shadow-[#C6FF00]/10"
                                            : "border border-white/10 bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white"
                                        }`}
                                >
                                    <span>{sym}</span>
                                    {isSelected ? <span>✓</span> : <span>+</span>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ERROR STATE */}
                {error && (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center space-y-2">
                        <p className="text-sm font-semibold text-red-300">Correlation Calculation Error</p>
                        <p className="text-xs text-red-300/60">{error}</p>
                    </div>
                )}

                {/* LOADING STATE */}
                {loading && (
                    <div className="glass h-80 animate-pulse rounded-3xl flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <RefreshCw size={24} className="animate-spin text-[#C6FF00] mx-auto" />
                            <p className="text-xs text-white/40 font-mono">Calculating return correlation matrix...</p>
                        </div>
                    </div>
                )}

                {/* MAIN ANALYTICS DASHBOARD */}
                {!loading && matrix && matrixSymbols.length > 0 && (
                    <div className="space-y-10">

                        {/* MATRIX HEATMAP SECTION */}
                        <section className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-[#C6FF00]" />
                                    <div>
                                        <h2 className="font-display text-xl font-bold text-white">Correlation Matrix</h2>
                                        <p className="text-xs text-white/40">Pearson correlation of daily percentage returns</p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded bg-[#C6FF00]" /> Positive (+1.0)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded bg-blue-500" /> Neutral (0.0)
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded bg-red-500" /> Negative (-1.0)
                                    </span>
                                </div>
                            </div>

                            {/* HEATMAP GRID TABLE */}
                            <div className="overflow-x-auto pb-2">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-3 text-left font-mono text-xs text-white/30 border-b border-white/10">
                                                ASSET
                                            </th>
                                            {matrixSymbols.map((sym) => (
                                                <th
                                                    key={sym}
                                                    className="p-3 text-center font-mono text-xs font-bold text-[#C6FF00] border-b border-white/10 min-w-[90px]"
                                                >
                                                    {sym}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matrixSymbols.map((rowSym) => (
                                            <tr key={rowSym} className="hover:bg-white/[0.02]">
                                                <td className="p-3 font-mono text-xs font-bold text-white border-b border-white/5">
                                                    {rowSym}
                                                </td>
                                                {matrixSymbols.map((colSym) => {
                                                    const rawVal = matrix[rowSym]?.[colSym] ?? matrix[colSym]?.[rowSym] ?? 0;
                                                    const colorClass = getCorrelationColor(rawVal);
                                                    return (
                                                        <td key={colSym} className="p-2 text-center border-b border-white/5">
                                                            <div
                                                                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition duration-200 hover:scale-105 ${colorClass}`}
                                                                title={`${rowSym} vs ${colSym}: ${rawVal.toFixed(4)}`}
                                                            >
                                                                {rawVal >= 0 ? `+${rawVal.toFixed(2)}` : rawVal.toFixed(2)}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* PAIRWISE CORRELATION TABLE */}
                        <section className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-6">
                            <div className="flex items-center gap-3">
                                <ArrowUpDown size={20} className="text-cyan-400" />
                                <div>
                                    <h2 className="font-display text-xl font-bold text-white">Pairwise Breakdown</h2>
                                    <p className="text-xs text-white/40">Detailed directional relationship metrics</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 font-mono text-white/35 uppercase text-[10px]">
                                            <th className="py-3 px-4">Asset A</th>
                                            <th className="py-3 px-4">Asset B</th>
                                            <th className="py-3 px-4">Correlation</th>
                                            <th className="py-3 px-4">Relationship Strength</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pairTableEntries.map((pair, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02]">
                                                <td className="py-3.5 px-4 font-mono font-bold text-white">{pair.assetA}</td>
                                                <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{pair.assetB}</td>
                                                <td className="py-3.5 px-4 font-mono font-bold text-[#C6FF00]">
                                                    {pair.value >= 0 ? `+${pair.value.toFixed(3)}` : pair.value.toFixed(3)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold border ${getCorrelationColor(pair.value)}`}>
                                                        {pair.strength}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* EXPLANATION & METHODOLOGY PANELS */}
                        <div className="grid gap-6 md:grid-cols-2">

                            {/* Correlation Science */}
                            <section className="glass rounded-3xl p-7 border border-white/10 space-y-3">
                                <div className="flex items-center gap-2 text-[#C6FF00] font-mono text-xs">
                                    <HelpCircle size={16} />
                                    UNDERSTANDING CORRELATION
                                </div>
                                <h3 className="font-display text-lg font-bold text-white">Pearson Correlation Coefficient</h3>
                                <p className="text-xs leading-6 text-white/55">
                                    Correlation measures the strength and statistical direction of linear co-movement between two price return series over time. Values range from <strong>-1.0</strong> (perfect inverse relationship) to <strong>+1.0</strong> (perfect synchronized movement).
                                </p>
                                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-[11px] leading-5 text-amber-200/80 flex gap-3">
                                    <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                                    <div>
                                        <strong>Statistical Caution:</strong> Correlation measures historical price co-movement and does <em>not</em> imply direct causation or future persistence.
                                    </div>
                                </div>
                            </section>

                            {/* Portfolio Context */}
                            <section className="glass rounded-3xl p-7 border border-white/10 space-y-3">
                                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                                    <ShieldCheck size={16} />
                                    PORTFOLIO DIVERSIFICATION
                                </div>
                                <h3 className="font-display text-lg font-bold text-white">Diversification Intelligence</h3>
                                <p className="text-xs leading-6 text-white/55">
                                    Assets with low or negative correlation (+0.2 or lower) historically reduce aggregate portfolio variance during market drawdowns. Highly correlated assets (+0.80+) tend to move together in standard market cycles.
                                </p>
                                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[11px] leading-5 text-white/40">
                                    CryptoMind provides objective quantitative metrics. This information is intended for analysis only and does not constitute financial advice.
                                </div>
                            </section>

                        </div>

                    </div>
                )}

            </div>
        </main>
    );
}
