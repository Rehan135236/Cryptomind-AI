"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Filter, Newspaper, RefreshCw, Search, Sparkles, TrendingUp } from "lucide-react";

import { API_BASE_URL as API_BASE } from "@/lib/api";

type NewsArticle = {
    source: string;
    title: string;
    link: string;
    published: string;
    description: string;
};

function formatDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
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

function detectRelatedAsset(title: string, desc: string): string | null {
    const text = (title + " " + desc).toLowerCase();
    if (text.includes("bitcoin") || text.includes("btc")) return "BTC";
    if (text.includes("ethereum") || text.includes("ether") || text.includes("eth")) return "ETH";
    if (text.includes("solana") || text.includes("sol")) return "SOL";
    if (text.includes("binance") || text.includes("bnb")) return "BNB";
    return null;
}

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
    const [selectedSource, setSelectedSource] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchNews = async (symbolFilter?: string) => {
        setLoading(true);
        setError("");
        try {
            const url = symbolFilter && symbolFilter !== "ALL"
                ? `${API_BASE}/news?symbol=${symbolFilter}&limit=40`
                : `${API_BASE}/news?limit=40`;

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to load news (Status ${res.status})`);
            }
            const data = await res.json();
            setArticles(data.articles || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to CryptoMind news backend."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews(selectedSymbol);
    }, [selectedSymbol]);

    // Unique sources for filter dropdown
    const availableSources = useMemo(() => {
        const sourcesSet = new Set<string>();
        articles.forEach((a) => {
            if (a.source && a.source !== "Unknown source" && a.source !== "Unknown") {
                sourcesSet.add(a.source);
            }
        });
        return Array.from(sourcesSet);
    }, [articles]);

    // Filtered articles
    const filteredArticles = useMemo(() => {
        return articles.filter((article) => {
            // Source filter
            if (selectedSource !== "ALL" && article.source !== selectedSource) {
                return false;
            }
            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const titleMatch = article.title.toLowerCase().includes(query);
                const descMatch = cleanHtml(article.description).toLowerCase().includes(query);
                if (!titleMatch && !descMatch) return false;
            }
            return true;
        });
    }, [articles, selectedSource, searchQuery]);

    const featuredArticle = filteredArticles[0];
    const feedArticles = filteredArticles.slice(1);

    return (
        <main className="min-h-screen pb-24 text-white">
            <div className="mx-auto max-w-[1280px] px-5 pt-16 md:px-8 md:pt-20 space-y-10">

                {/* HERO HEADER */}
                <section className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                        REAL-TIME MARKET INTELLIGENCE
                    </div>

                    <h1 className="font-display text-4xl font-bold tracking-[-0.04em] md:text-6xl text-white">
                        Crypto News <span className="text-gradient">Intelligence</span>
                    </h1>

                    <p className="max-w-2xl text-base text-white/45 md:text-lg">
                        Real-time market news, narratives, and research signals aggregated directly from verified institutional crypto RSS feeds.
                    </p>
                </section>

                {/* SEARCH & FILTERS BAR */}
                <section className="glass rounded-3xl p-4 md:p-6 border border-white/10 space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-3.5 text-white/30" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles by keyword, event, or narrative..."
                                className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-cyan-400/40"
                            />
                        </div>

                        {/* Source Filter Dropdown */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-white/45 font-mono">
                                <Filter size={14} />
                                SOURCE:
                            </div>
                            <select
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value)}
                                className="h-11 rounded-2xl border border-white/10 bg-[#0c0d14] px-4 text-xs font-semibold text-white outline-none focus:border-cyan-400/40 cursor-pointer"
                            >
                                <option value="ALL">All Sources</option>
                                {availableSources.map((src) => (
                                    <option key={src} value={src}>
                                        {src}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => fetchNews(selectedSymbol)}
                                title="Refresh feed"
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/10 transition"
                            >
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* ASSET FILTER PILLS */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                        <span className="text-xs font-mono text-white/35 mr-2">ASSET:</span>
                        {["ALL", "BTC", "ETH", "SOL", "BNB"].map((sym) => {
                            const active = selectedSymbol === sym;
                            return (
                                <button
                                    key={sym}
                                    type="button"
                                    onClick={() => setSelectedSymbol(sym)}
                                    className={`rounded-full px-4 py-1.5 text-xs font-semibold font-mono transition ${active
                                            ? "bg-[#C6FF00] text-black shadow-lg shadow-[#C6FF00]/10"
                                            : "border border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
                                        }`}
                                >
                                    {sym === "ALL" ? "All Assets" : sym}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ERROR STATE */}
                {error && (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center space-y-3">
                        <p className="text-sm font-semibold text-red-300">Unable to load crypto news</p>
                        <p className="text-xs text-red-300/60 max-w-md mx-auto">{error}</p>
                        <button
                            type="button"
                            onClick={() => fetchNews(selectedSymbol)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-400/10 border border-red-400/20 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/20"
                        >
                            <RefreshCw size={14} /> Retry Connection
                        </button>
                    </div>
                )}

                {/* LOADING SKELETON */}
                {loading && (
                    <div className="space-y-6">
                        {/* Featured Skeleton */}
                        <div className="glass h-64 animate-pulse rounded-3xl" />
                        {/* Grid Skeletons */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="glass h-48 animate-pulse rounded-2xl" />
                            <div className="glass h-48 animate-pulse rounded-2xl" />
                            <div className="glass h-48 animate-pulse rounded-2xl" />
                        </div>
                    </div>
                )}

                {/* EMPTY STATE */}
                {!loading && !error && filteredArticles.length === 0 && (
                    <div className="glass rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                        <Newspaper size={36} className="mx-auto text-white/25" />
                        <h3 className="font-display text-lg font-bold text-white">No articles found</h3>
                        <p className="text-xs text-white/40">
                            No news articles match your current search query or filter selection. Try adjusting your filters.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSymbol("ALL");
                                setSelectedSource("ALL");
                                setSearchQuery("");
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}

                {/* MAIN CONTENT FEED */}
                {!loading && !error && filteredArticles.length > 0 && (
                    <div className="space-y-10">

                        {/* FEATURED STORY HERO */}
                        {featuredArticle && (
                            <section className="glass rounded-3xl p-8 md:p-10 border border-cyan-400/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-105 transition duration-500">
                                    <Sparkles size={140} className="text-cyan-400" />
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                        FEATURED STORY
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                                        {featuredArticle.source && featuredArticle.source !== "Unknown source" ? featuredArticle.source : "Crypto News"}
                                    </span>
                                    {detectRelatedAsset(featuredArticle.title, featuredArticle.description) && (
                                        <span className="rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/10 px-3 py-1 text-[10px] font-bold text-[#C6FF00] font-mono">
                                            ${detectRelatedAsset(featuredArticle.title, featuredArticle.description)}
                                        </span>
                                    )}
                                    <span className="text-xs text-white/35 font-mono ml-auto">
                                        {formatDate(featuredArticle.published)}
                                    </span>
                                </div>

                                <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl leading-snug text-white group-hover:text-cyan-300 transition">
                                    {featuredArticle.title}
                                </h2>

                                <p className="mt-4 text-sm leading-7 text-white/60 max-w-4xl line-clamp-3">
                                    {cleanHtml(featuredArticle.description)}
                                </p>

                                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                                    <a
                                        href={featuredArticle.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 px-5 py-2.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-400/20 hover:text-white"
                                    >
                                        Read full coverage
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </section>
                        )}

                        {/* NEWS GRID */}
                        {feedArticles.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <TrendingUp size={18} className="text-[#C6FF00]" />
                                    <h2 className="font-display text-xl font-bold text-white">Latest Market Signals</h2>
                                    <span className="text-xs font-mono text-white/30">({feedArticles.length} stories)</span>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {feedArticles.map((article, index) => {
                                        const sourceName = article.source && article.source !== "Unknown source" ? article.source : "Crypto News";
                                        const cleanDesc = cleanHtml(article.description);
                                        const assetTag = detectRelatedAsset(article.title, article.description);

                                        return (
                                            <article
                                                key={`${article.link}-${index}`}
                                                className="glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between transition duration-300 hover:-translate-y-1 hover:border-white/20 group"
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/70">
                                                            {sourceName}
                                                        </span>
                                                        {assetTag && (
                                                            <span className="rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/10 px-2 py-0.5 text-[9px] font-bold text-[#C6FF00] font-mono">
                                                                ${assetTag}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="font-display text-base font-semibold leading-snug text-white group-hover:text-[#C6FF00] transition">
                                                        {article.title}
                                                    </h3>

                                                    {cleanDesc && (
                                                        <p className="text-xs text-white/45 leading-6 line-clamp-3">
                                                            {cleanDesc}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                                                    <span className="text-white/30 font-mono text-[11px]">
                                                        {formatDate(article.published)}
                                                    </span>

                                                    <a
                                                        href={article.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-cyan-400 font-semibold hover:text-[#C6FF00] transition"
                                                    >
                                                        Read ↗
                                                    </a>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                    </div>
                )}

            </div>
        </main>
    );
}
