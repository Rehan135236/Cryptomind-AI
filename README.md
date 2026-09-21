# CryptoMind AI

**AI-powered cryptocurrency research and analysis agent built with Python, PostgreSQL, FastAPI, Pinecone, Hugging Face, LangChain, LangGraph, and Groq.**

CryptoMind is an AI-driven crypto research platform that combines historical market data, quantitative analytics, vector-based document retrieval (RAG), RSS news feeds, LLM reasoning, and stateful agentic workflows to generate grounded cryptocurrency research.

---

## 📌 Current Status

> **Milestone Checkpoint: AI Research Agent Foundation**
>
> CryptoMind has reached the **AI research agent foundation** milestone. The system can retrieve crypto market analytics, search crypto-related documents using RAG, retrieve recent crypto news via RSS feeds, and use LangGraph with Groq to orchestrate these tools into a single research response.
>
> ⏸️ **Development Notice:** Active development is currently **paused** at this milestone checkpoint. Development will resume in the next phase focusing on structured research report generation, stronger evidence/source tracking, live market synchronization, and evaluation frameworks.

---

## 🚀 Overview & Problem Solved

Traditional financial research with Large Language Models (LLMs) often suffers from hallucinated market metrics, outdated facts, and lack of real-time market context. 

**CryptoMind solves this by enforcing strict tool-grounded reasoning:**

1. **Quantitative Market Grounding**: All prices, moving averages, 7d/30d returns, volatilities, drawdowns, and Sharpe ratios are calculated via Pandas and queried directly from PostgreSQL.
2. **Knowledge Base Grounding (RAG)**: Technical document queries (e.g. consensus mechanisms, protocol specs) retrieve embedded chunks from Pinecone vector store using Hugging Face's `sentence-transformers/all-MiniLM-L6-v2`.
3. **News Intelligence**: Recent market events are fetched dynamically from active RSS feeds (CoinDesk, Decrypt, CryptoSlate, Bitcoin Magazine) filtered by cryptocurrency symbols (BTC, ETH, SOL, BNB).
4. **Agentic Orchestration**: LangGraph coordinates multi-tool tool calling, allowing the LLM to autonomously decide which tools to invoke before synthesizing a factual final answer.

---

## 🏗️ Architecture

```text
                                   USER
                                    │
                                    ▼
                      LangGraph Agent Orchestrator
                           (src/graph.py)
                                    │
                                    ▼
                      LLM (Groq - openai/gpt-oss-120b)
                                    │
                                    ▼
                           Tool Decision Node
                                    │
     ┌──────────────────┬───────────┴───────────┬──────────────────┐
     ▼                  ▼                       ▼                  ▼
Market Analysis   Crypto Comparison      RAG Document Search   Crypto News Search
  (PostgreSQL)      (Multi-asset)            (Pinecone DB)        (RSS Feeds)
     │                  │                       │                  │
     └──────────────────┴───────────┬───────────┴──────────────────┘
                                    ▼
                         Tool Results Execution
                                    │
                                    ▼
                    LLM Synthesis & Grounded Reasoning
                                    │
                                    ▼
                          Final Research Answer
```

---

## ✨ Milestone Capabilities

### 1. Quantitative Analytics Engine
Calculates core quantitative finance metrics from stored historical price data:
* Current & Average Price, Min/Max Price
* 7-Day & 30-Day Moving Averages
* 7-Day & 30-Day Returns
* Daily Volatility & Maximum Drawdown
* Sharpe Ratio & Asset Correlations

### 2. Retrieval-Augmented Generation (RAG) Pipeline
* Custom document chunking using LangChain text splitters (`src/document_loader.py`)
* Vector embeddings using Hugging Face Inference API (`sentence-transformers/all-MiniLM-L6-v2`)
* Vector indexing and top-k similarity search in Pinecone (`src/rag.py`, `src/ingest_documents.py`)

### 3. Crypto News Retrieval
* Live RSS parsing across major crypto outlets (`src/news.py`)
* Automatic keyword matching for symbol-specific news filtering (BTC, ETH, SOL, BNB)

### 4. Agentic Workflow (LangGraph)
* Stateful execution loop powered by `langgraph.graph.StateGraph` (`src/graph.py`)
* Native Groq tool-calling format supporting dynamic function execution (`get_crypto_analysis`, `compare_crypto_assets`, `search_crypto_documents`, `search_crypto_news`)
* Strict system prompts preventing hallucinated financial metrics or ungrounded claims

### 5. REST API (FastAPI)
* Exposed analytical endpoints (`/`, `/crypto/{symbol}`, `/compare`, `/correlation`) with interactive Swagger docs.

---

## 📊 Development State Summary

### COMPLETED
* ✅ Data pipeline & historical price ingestion
* ✅ PostgreSQL storage & SQLAlchemy ORM
* ✅ Quantitative crypto analytics (returns, moving averages, volatility, drawdown, Sharpe ratio)
* ✅ FastAPI REST backend
* ✅ Hugging Face vector embeddings & Pinecone RAG document retrieval
* ✅ Crypto news retrieval through RSS feeds (CoinDesk, Decrypt, CryptoSlate, Bitcoin Magazine)
* ✅ Groq LLM integration (`openai/gpt-oss-120b`)
* ✅ Tool calling (manual, LangChain, native Groq tool calling)
* ✅ LangGraph orchestration loop (StateGraph, conditional routing, multi-tool execution)
* ✅ AI research agent foundation

### IN PROGRESS / NEXT
* ⏳ Structured research reports & report generation modules
* ⏳ Source and evidence tracking enhancements
* ⏳ Live/current market data synchronization
* ⏳ Agent evaluation framework & benchmarks
* ⏳ React / Next.js frontend dashboard
* ⏳ Docker containerization
* ⏳ Production cloud deployment

---

## 🗺️ Milestone Checklist

1. Project setup                  ✅
2. Live crypto API                ✅
3. Multiple cryptocurrencies      ✅
4. Historical data                ✅
5. Pandas transformation          ✅
6. PostgreSQL                     ✅
7. Crypto analytics               ✅
8. FastAPI                        ✅
9. LLM                            ✅
10. Tool calling                  ✅
11. LangChain                     ✅
12. LangGraph                     ✅
13. RAG                            ✅
14. Crypto news                    ✅
15. AI research agent foundation  ✅
16. Structured research reports    ⏳
17. Agent evaluation              ⏳
18. React frontend                ⏳
19. Docker                         ⏳
20. Deployment                    ⏳

---

## 🛠️ Technology Stack

* **Backend Framework**: Python 3.10+, FastAPI, Uvicorn
* **Database & ORM**: PostgreSQL, SQLAlchemy, Psycopg2
* **Data Processing**: Pandas, NumPy
* **Vector DB & RAG**: Pinecone, Hugging Face Inference Client (`all-MiniLM-L6-v2`), LangChain Text Splitter
* **AI & Agent Orchestration**: Groq (`openai/gpt-oss-120b`), LangGraph, LangChain
* **News Processing**: Python `xml.etree.ElementTree`, Requests
* **External APIs**: CoinGecko API, Hugging Face API, Pinecone API, Groq API

---

## 📁 Project Structure

```text
cryptomind/
│
├── src/
│   ├── __init__.py
│   ├── add_constraint.py        # DB schema helpers
│   ├── analytics.py             # Quantitative analytics engine
│   ├── api.py                   # FastAPI REST API endpoints
│   ├── check_database.py        # Database verification helper
│   ├── cleanup_database.py      # Database cleanup script
│   ├── cleanup_pinecone.py      # Pinecone test vector cleanup utility
│   ├── config.py                # Database configuration
│   ├── correlation.py           # Asset correlation calculations
│   ├── data_processor.py        # Data cleaning and transformation
│   ├── database.py             # SQLAlchemy models and engine setup
│   ├── document_loader.py       # LangChain document splitter
│   ├── embeddings.py            # Hugging Face embedding generator
│   ├── graph.py                 # Core LangGraph AI Research Agent
│   ├── ingest_documents.py      # Vector ingestion script for RAG
│   ├── langchain_agent.py       # LangChain agent experiment
│   ├── llm.py                   # Groq LLM client
│   ├── market_api.py            # CoinGecko market API client
│   ├── news.py                  # Crypto RSS news parser and matcher
│   ├── pinecone_test.py         # Pinecone vector store test script
│   ├── pipeline.py              # Market data ETL pipeline
│   ├── rag.py                   # Pinecone document similarity search
│   ├── rag_qa.py                # RAG question-answering module
│   ├── test_coingecko.py        # CoinGecko API connection test
│   ├── test_huggingface.py      # Hugging Face API token check
│   └── tools.py                 # Unified agent tool definitions
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── documents/
│       └── ethereum.txt
│
├── tests/
├── .env                         # Environment variables (IGNORED)
├── .gitignore                   # Git ignore file
├── requirements.txt             # Python dependencies
└── README.md                    # Project documentation
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cryptomind
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
HF_TOKEN=your_huggingface_token
COINGECKO_API_KEY=your_coingecko_api_key
```

> ⚠️ **Security Warning:** Never commit your `.env` file or API credentials. `.env` is ignored by `.gitignore`.

---

## ⚙️ Installation & Usage

### 1. Setup Environment

```bash
git clone https://github.com/Rehan135236/Cryptomind-AI.git
cd Cryptomind-AI

python -m venv .venv
# On Windows:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Run Data Pipeline & Database Setup

```powershell
# Create database tables
python -m src.database

# Run ETL pipeline to store historical market data
python -m src.pipeline

# Ingest research documents into Pinecone vector index
python -m src.ingest_documents
```

### 3. Run AI Research Agent (LangGraph)

```powershell
python -m src.graph
```

Example prompt executed by the agent:
> *"Give me the latest Bitcoin news and explain how Bitcoin has performed over the last 30 days."*

### 4. Run FastAPI Server

```powershell
uvicorn src.api:app --reload
```
Access interactive documentation at `http://127.0.0.1:8000/docs`.

---

## 🎯 Target Objective & Use Cases

CryptoMind demonstrates end-to-end integration across data engineering, quantitative finance, vector databases, and multi-tool agent orchestration:
* **Market Quantitative Intelligence**: Real analytical metrics replacing generic LLM estimates.
* **Domain RAG Retrieval**: Accurate technical answers sourced strictly from ingested documentation.
* **Agentic Multi-Tool Synthesis**: Automated correlation of market prices, news stories, and technical facts.

---

## ⚠️ Disclaimer

CryptoMind is an experimental technical research and analytics project built for demonstration purposes. Information generated by the system is strictly for educational and technical research and should not be used as financial or investment advice.
