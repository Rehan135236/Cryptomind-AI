"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CryptoGlobe from "@/components/CryptoGlobe";
import { API_BASE_URL } from "@/lib/api";
import { ArrowRight, BarChart3, Bot, CheckCircle2, Database, GitCompare, LineChart, Newspaper, ShieldAlert, Sparkles, TrendingUp, Workflow } from "lucide-react";

type CryptoMetric = {
  symbol: string;
  current_price: number;
  return_7d?: number;
  change_24h?: number;
};

function formatPrice(price?: number | null) {
  if (price === undefined || price === null || typeof price !== "number") return "—";
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || typeof value !== "number") return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function Home() {
  const [marketSnapshot, setMarketSnapshot] = useState<CryptoMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketSnapshot() {
      try {
        const symRes = await fetch(`${API_BASE_URL}/crypto/symbols`);
        if (!symRes.ok) throw new Error("Failed to fetch symbols");
        const symData = await symRes.json();
        const symbols: string[] = symData.symbols ? symData.symbols.slice(0, 6) : ["BTC", "ETH", "SOL", "BNB", "XRP"];

        const metrics = await Promise.all(
          symbols.map(async (sym) => {
            const res = await fetch(`${API_BASE_URL}/crypto/${sym}`);
            if (res.ok) {
              return res.json();
            }
            return null;
          })
        );

        setMarketSnapshot(metrics.filter(Boolean));
      } catch (err) {
        console.warn("Could not load market snapshot", err);
      } finally {
        setLoading(false);
      }
    }
    loadMarketSnapshot();
  }, []);

  return (
    <main className="relative min-h-screen pb-24 text-white">

      {/* HERO SECTION */}
      <section className="relative mx-auto flex max-w-[1280px] flex-col items-center px-5 pt-12 md:pt-20 text-center">

        {/* Badge */}
        <div className="relative z-20 inline-flex items-center gap-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF00] animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C6FF00]">
            AI-POWERED CRYPTO RESEARCH PLATFORM
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display relative z-20 mt-6 max-w-4xl text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[84px]">
          Research <br />
          <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
            not rumors.
          </span>
        </h1>

        <p className="relative z-20 mt-6 max-w-2xl text-base leading-8 text-white/50 sm:text-lg">
          Deterministic quantitative analytics, historical risk telemetry, vector RAG documents, and real-time news intelligence powering smarter crypto decisions.
        </p>

        {/* CTAs */}
        <div className="relative z-30 mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/research"
            className="group flex items-center gap-3 rounded-full bg-[#C6FF00] px-7 py-3.5 text-sm font-bold text-black transition hover:brightness-110 shadow-lg shadow-[#C6FF00]/10"
          >
            Start Research
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-white/80 backdrop-blur transition hover:border-white/20 hover:text-white hover:bg-white/5"
          >
            Explore Dashboard
          </Link>

          <Link
            href="/analytics"
            className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-6 py-3.5 text-sm font-semibold text-cyan-400 backdrop-blur transition hover:bg-cyan-400/10"
          >
            View Analytics
          </Link>
        </div>

        {/* GLOBE CANVAS CONTAINER (100% VISIBLE ON MOBILE) */}
        <div className="relative mt-8 h-[340px] sm:h-[480px] lg:h-[620px] w-full max-w-[900px] overflow-hidden rounded-3xl">
          <CryptoGlobe />
        </div>
      </section>

      {/* LIVE MARKET SNAPSHOT BANNER */}
      <section className="mx-auto max-w-[1280px] px-5 pt-12">
        <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#C6FF00]" />
              <h2 className="font-display text-lg font-bold text-white">Live Market Telemetry</h2>
            </div>
            <span className="text-xs font-mono text-white/35">Real PostgreSQL & API Data</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 pt-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass h-24 animate-pulse rounded-2xl" />
              ))
            ) : (
              marketSnapshot.map((coin) => {
                const isPositive = (coin.return_7d ?? coin.change_24h ?? 0) >= 0;
                return (
                  <Link
                    key={coin.symbol}
                    href="/dashboard"
                    className="glass rounded-2xl p-4 border border-white/10 transition duration-200 hover:-translate-y-1 hover:border-[#C6FF00]/30 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#C6FF00]">{coin.symbol}</span>
                      <span className={`font-mono text-[11px] font-semibold ${isPositive ? "text-[#C6FF00]" : "text-red-400"}`}>
                        {formatPercent(coin.return_7d ?? coin.change_24h)}
                      </span>
                    </div>

                    <div className="mt-3 font-display text-xl font-bold text-white group-hover:text-[#C6FF00] transition">
                      {formatPrice(coin.current_price)}
                    </div>

                    <div className="mt-1 text-[10px] text-white/30 font-mono">Spot Price</div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* WHY CRYPTOMIND */}
      <section className="mx-auto max-w-[1280px] px-5 pt-20 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-bold md:text-4xl text-white">
            Built for <span className="text-gradient">Evidence</span>
          </h2>
          <p className="text-sm text-white/45">
            CryptoMind combines quantitative precision with multi-agent reasoning to eliminate financial rumors.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="glass rounded-3xl p-7 border border-white/10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/20">
              <Database size={20} />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Deterministic On-Chain Data</h3>
            <p className="text-xs leading-6 text-white/45">
              Live spot prices, moving averages, daily volatility, drawdown, and Sharpe ratios are computed deterministically from PostgreSQL records.
            </p>
          </div>

          <div className="glass rounded-3xl p-7 border border-white/10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <Bot size={20} />
            </div>
            <h3 className="font-display text-lg font-bold text-white">LangGraph AI Research Agent</h3>
            <p className="text-xs leading-6 text-white/45">
              Stateful multi-agent execution pipeline orchestrates tools to analyze quantitative metrics, vector documents, and market news simultaneously.
            </p>
          </div>

          <div className="glass rounded-3xl p-7 border border-white/10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400 border border-purple-400/20">
              <Newspaper size={20} />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Verified RSS News RAG</h3>
            <p className="text-xs leading-6 text-white/45">
              Real-time news stories gathered from CoinDesk, CoinTelegraph, Decrypt, and Bitcoin Magazine parsed cleanly without unknown citations.
            </p>
          </div>

          <div className="glass rounded-3xl p-7 border border-white/10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
              <LineChart size={20} />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Pearson Correlation Matrix</h3>
            <p className="text-xs leading-6 text-white/45">
              N x N cross-asset correlation matrix calculation computed dynamically over daily percentage price returns.
            </p>
          </div>

          <div className="glass rounded-3xl p-7 border border-white/10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Structured Report Generation</h3>
            <p className="text-xs leading-6 text-white/45">
              Export institutional PDF reports (`/research/report`) containing executive summaries, risk profiles, and methodology disclaimers.
            </p>
          </div>

          <div className="glass rounded-3xl p-7 border border-white/10 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-400/10 text-pink-400 border border-pink-400/20">
              <GitCompare size={20} />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Multi-Asset Comparison</h3>
            <p className="text-xs leading-6 text-white/45">
              Side-by-side performance tables and visual risk comparison bar charts across the entire expanded cryptocurrency universe.
            </p>
          </div>
        </div>
      </section>

      {/* EXPLORE THE PLATFORM NAVIGATION GRID */}
      <section className="mx-auto max-w-[1280px] px-5 pt-20 space-y-8">
        <div className="flex items-center gap-3">
          <Workflow size={20} className="text-[#C6FF00]" />
          <h2 className="font-display text-2xl font-bold text-white">Explore CryptoMind Platform</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard" className="glass rounded-2xl p-6 border border-white/10 hover:border-[#C6FF00]/40 transition group">
            <BarChart3 className="text-[#C6FF00]" size={24} />
            <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-[#C6FF00]">Dashboard →</h3>
            <p className="mt-2 text-xs text-white/45">Spot prices, moving averages, returns, and historical charts.</p>
          </Link>

          <Link href="/compare" className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-400/40 transition group">
            <GitCompare className="text-cyan-400" size={24} />
            <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-cyan-400">Compare →</h3>
            <p className="mt-2 text-xs text-white/45">Side-by-side asset comparison tables and visual return profiles.</p>
          </Link>

          <Link href="/research" className="glass rounded-2xl p-6 border border-white/10 hover:border-[#C6FF00]/40 transition group">
            <Bot className="text-[#C6FF00]" size={24} />
            <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-[#C6FF00]">AI Research →</h3>
            <p className="mt-2 text-xs text-white/45">Ask market questions and get agentic structured reports.</p>
          </Link>

          <Link href="/news" className="glass rounded-2xl p-6 border border-white/10 hover:border-purple-400/40 transition group">
            <Newspaper className="text-purple-400" size={24} />
            <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-purple-400">Crypto News →</h3>
            <p className="mt-2 text-xs text-white/45">Real-time RSS news intelligence with asset and source filtering.</p>
          </Link>

          <Link href="/analytics" className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-400/40 transition group">
            <LineChart className="text-cyan-400" size={24} />
            <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-cyan-400">Analytics →</h3>
            <p className="mt-2 text-xs text-white/45">Cross-asset correlation matrix heatmap and pairwise breakdown.</p>
          </Link>

          <Link href="/about" className="glass rounded-2xl p-6 border border-white/10 hover:border-[#C6FF00]/40 transition group">
            <Workflow className="text-[#C6FF00]" size={24} />
            <h3 className="mt-4 font-display text-lg font-bold text-white group-hover:text-[#C6FF00]">About & Stack →</h3>
            <p className="mt-2 text-xs text-white/45">Data pipeline architecture, technology stack, and philosophy.</p>
          </Link>
        </div>
      </section>

    </main>
  );
}