"use client";

import Link from "next/link";
import { ArrowRight, Bot, Cpu, Database, FileCode, Layers, ShieldCheck, Sparkles, Terminal, Workflow } from "lucide-react";

export default function AboutPage() {
    const pipelineSteps = [
        { title: "Live Spot Prices", desc: "CoinGecko API", color: "text-[#C6FF00]" },
        { title: "Historical Data", desc: "PostgreSQL Database", color: "text-[#C6FF00]" },
        { title: "Analytics Engine", desc: "Pandas Returns & Risk", color: "text-cyan-400" },
        { title: "News Intelligence", desc: "Verified RSS Feeds", color: "text-cyan-400" },
        { title: "RAG & Vector DB", desc: "Pinecone Documents", color: "text-purple-400" },
        { title: "AI Research Agent", desc: "LangGraph & Groq LLM", color: "text-[#C6FF00]" },
        { title: "Structured Report", desc: "Verified Intelligence", color: "text-[#C6FF00]" },
    ];

    const techStack = [
        { category: "Frontend", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Recharts", "Three.js", "@react-three/fiber", "Lucide Icons"] },
        { category: "Backend API", items: ["Python 3.12", "FastAPI", "SQLAlchemy", "Uvicorn", "REST Endpoints"] },
        { category: "Analytics & Data", items: ["PostgreSQL", "Pandas DataFrames", "NumPy", "CoinGecko Market API"] },
        { category: "AI & Knowledge", items: ["LangChain", "LangGraph Agent", "Groq LLaMA-3", "Pinecone Vector DB", "HuggingFace Embeddings"] },
    ];

    return (
        <main className="min-h-screen pb-24 text-white">
            <div className="mx-auto max-w-[1280px] px-5 pt-16 md:px-8 md:pt-20 space-y-16">

                {/* HERO */}
                <section className="space-y-6 max-w-4xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C6FF00]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C6FF00]" />
                        SYSTEM ARCHITECTURE & METHODOLOGY
                    </div>

                    <h1 className="font-display text-4xl font-bold tracking-[-0.04em] md:text-6xl text-white">
                        AI-powered crypto research, <br />
                        <span className="text-gradient">built for evidence.</span>
                    </h1>

                    <p className="text-base leading-8 text-white/50 md:text-lg max-w-2xl">
                        CryptoMind combines deterministic financial analytics with multi-agent artificial intelligence to produce structured, verifiable market intelligence.
                    </p>
                </section>

                {/* DATA PIPELINE VISUAL FLOW */}
                <section className="glass rounded-3xl p-8 md:p-10 border border-white/10 space-y-8">
                    <div className="flex items-center gap-3">
                        <Workflow size={22} className="text-[#C6FF00]" />
                        <div>
                            <h2 className="font-display text-xl font-bold text-white">End-to-End Data & Intelligence Pipeline</h2>
                            <p className="text-xs text-white/40">From raw market telemetry to structured institutional reports</p>
                        </div>
                    </div>

                    {/* Pipeline Diagram */}
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 pt-4">
                        {pipelineSteps.map((step, idx) => (
                            <div key={idx} className="relative group">
                                <div className="glass rounded-2xl p-4 border border-white/10 text-center space-y-2 h-full flex flex-col justify-between transition hover:-translate-y-1 hover:border-[#C6FF00]/30">
                                    <div className="text-[10px] font-mono text-white/30">STEP 0{idx + 1}</div>
                                    <div className={`font-display text-xs font-bold ${step.color}`}>{step.title}</div>
                                    <div className="text-[10px] text-white/40 font-mono">{step.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* WHAT CRYPTOMIND DOES */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Layers size={20} className="text-cyan-400" />
                        <h2 className="font-display text-2xl font-bold text-white">Core Capabilities</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="glass rounded-2xl p-7 border border-white/10 space-y-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/20">
                                <Database size={20} />
                            </div>
                            <h3 className="font-display text-lg font-bold text-white">Deterministic Analytics</h3>
                            <p className="text-xs leading-6 text-white/45">
                                Prices, returns, moving averages, volatility, drawdowns, and correlation ratios are computed deterministically with Pandas and PostgreSQL—never hallucinated.
                            </p>
                        </div>

                        <div className="glass rounded-2xl p-7 border border-white/10 space-y-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                                <Bot size={20} />
                            </div>
                            <h3 className="font-display text-lg font-bold text-white">Agentic Research Synthesis</h3>
                            <p className="text-xs leading-6 text-white/45">
                                A LangGraph agent orchestrates tools to inspect market spot prices, historical risk metrics, vector-stored documents, and real RSS news feeds simultaneously.
                            </p>
                        </div>

                        <div className="glass rounded-2xl p-7 border border-white/10 space-y-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400 border border-purple-400/20">
                                <Sparkles size={20} />
                            </div>
                            <h3 className="font-display text-lg font-bold text-white">Structured Report Generation</h3>
                            <p className="text-xs leading-6 text-white/45">
                                Research outputs are returned as typed, structured schemas containing verified metrics, source attribution, and clean RSS summaries ready for printing or exporting.
                            </p>
                        </div>
                    </div>
                </section>

                {/* TECHNOLOGY STACK */}
                <section className="glass rounded-3xl p-8 md:p-10 border border-white/10 space-y-8">
                    <div className="flex items-center gap-3">
                        <Cpu size={22} className="text-[#C6FF00]" />
                        <div>
                            <h2 className="font-display text-2xl font-bold text-white">Verified Technology Stack</h2>
                            <p className="text-xs text-white/40">Technologies actively powering the CryptoMind repository</p>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {techStack.map((stack) => (
                            <div key={stack.category} className="glass rounded-2xl p-6 border border-white/10 space-y-4">
                                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#C6FF00]">
                                    {stack.category}
                                </h3>
                                <ul className="space-y-2 text-xs text-white/70 font-mono">
                                    {stack.items.map((item) => (
                                        <li key={item} className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* PHILOSOPHY & AGENT ARCHITECTURE */}
                <div className="grid gap-6 md:grid-cols-2">

                    <section className="glass rounded-3xl p-8 border border-white/10 space-y-4">
                        <div className="flex items-center gap-2 text-[#C6FF00] font-mono text-xs">
                            <Terminal size={16} />
                            AGENT ARCHITECTURE
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">Stateful Multi-Agent Reasoning</h3>
                        <p className="text-xs leading-6 text-white/50">
                            The backend implements a stateful LangGraph agent graph. When a research prompt is received, the agent invokes custom Python tools (`get_crypto_metrics`, `get_crypto_news`, `query_rag_documents`) before passing gathered evidence to an LLM structurer node.
                        </p>
                    </section>

                    <section className="glass rounded-3xl p-8 border border-white/10 space-y-4">
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                            <ShieldCheck size={16} />
                            EVIDENCE PHILOSOPHY
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">Zero Fake Data Commitment</h3>
                        <p className="text-xs leading-6 text-white/50">
                            CryptoMind is built strictly on verified market data sources. Numerical prices, returns, drawdowns, and news articles are sourced directly from CoinGecko, PostgreSQL, and RSS feeds. Fake metrics and placeholders are strictly prohibited.
                        </p>
                    </section>

                </div>

                {/* CTA */}
                <section className="glass rounded-3xl p-10 border border-[#C6FF00]/20 bg-gradient-to-r from-[#C6FF00]/10 via-transparent to-cyan-500/10 text-center space-y-6">
                    <h2 className="font-display text-3xl font-bold text-white">Ready to experience AI-powered research?</h2>
                    <p className="text-sm text-white/60 max-w-xl mx-auto">
                        Explore market analytics, query the research agent, or view live news signals now.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 pt-2">
                        <Link
                            href="/research"
                            className="inline-flex items-center gap-2 rounded-full bg-[#C6FF00] px-7 py-3 text-xs font-bold text-black transition hover:brightness-110"
                        >
                            Open Research Workspace
                            <ArrowRight size={16} />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-xs font-bold text-white hover:bg-white/10"
                        >
                            View Live Dashboard
                        </Link>
                    </div>
                </section>

            </div>
        </main>
    );
}
