# 🧠 CryptoMind — AI Crypto Research & Analysis Agent

CryptoMind is an **AI-powered cryptocurrency research and analysis platform** that combines live market data, historical analytics, PostgreSQL, RAG, crypto news, LLMs, LangChain, and LangGraph into a single research agent.

The goal of CryptoMind is to provide **structured, data-grounded cryptocurrency research reports** rather than simple chatbot responses.

---

## 🚀 Project Overview

CryptoMind follows a tool-based AI research architecture:

```text
                         USER
                           │
                           ▼
                  React / Next.js
                    (Frontend)
                           │
                           ▼
                       FastAPI
                           │
                           ▼
                    LangGraph Agent
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Market Tools      SQL Tools        RAG Tools
          │                │                │
          ▼                ▼                ▼
     CoinGecko         PostgreSQL       Pinecone
          │
          ▼
     Crypto Analytics
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      News Tool       LLM Reasoning    Calculator
          │                │
          ▼                ▼
       RSS Feeds         Groq
                           │
                           ▼
                 Structured Research
                       Report
```

---

# ✨ Features

## 📊 Live Cryptocurrency Data

CryptoMind retrieves real-time cryptocurrency market information using the CoinGecko API.

Currently supported assets include:

* Bitcoin — BTC
* Ethereum — ETH
* Solana — SOL
* BNB — BNB
* XRP
* ADA
* DOGE
* TRX
* AVAX
* DOT
* LINK
* MATIC / POL
* LTC
* BCH
* ATOM
* UNI
* XLM
* ETC
* FIL
* NEAR
* APT
* ARB
* OP
* SUI
* AAVE
* ALGO
* VET
* ICP
* HBAR
* MKR
* PEPE
* SHIB

The market API supports:

* Current price
* 24-hour price change
* Coin ID resolution
* Historical price data

---

# 📈 Historical Crypto Analytics

Historical cryptocurrency data is stored in PostgreSQL and analyzed using Python and Pandas.

CryptoMind calculates:

* Current historical snapshot
* Average price
* Minimum price
* Maximum price
* 7-day moving average
* 30-day moving average
* 7-day return
* Full observation-period return
* Historical period start/end
* Historical period duration
* Daily volatility
* Maximum drawdown
* Daily Sharpe-like ratio

### Example metrics

```text
BTC

Current Price:        $77,447.08
Average Price:        $75,262.52
Minimum Price:        $62,843.70
Maximum Price:        $81,264.70

7D Moving Average:    $77,550.27
30D Moving Average:   $76,473.96

7D Return:            -2.08%
Period Return:        +22.10%

Daily Volatility:     2.46%
Maximum Drawdown:     -5.80%
Daily Sharpe-like:    0.266
```

> Historical metrics are calculated from the period available in the database and are not automatically treated as current market values.

---

# 🔗 Cryptocurrency Correlation Analysis

CryptoMind can calculate correlations between cryptocurrency returns.

Example assets:

```text
BTC
ETH
SOL
BNB
```

The correlation engine:

1. Loads historical prices from PostgreSQL
2. Pivots prices by date
3. Calculates percentage returns
4. Generates a correlation matrix

Example:

```text
BTC ↔ ETH   0.863
BTC ↔ SOL   0.816
ETH ↔ SOL   0.815
BTC ↔ BNB   0.712
```

Correlation is used as a descriptive statistical relationship and is not treated as proof of causation.

---

# 🗄️ PostgreSQL Database

CryptoMind stores historical cryptocurrency prices in PostgreSQL.

Database table:

```sql
CREATE TABLE crypto_prices (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    price NUMERIC(20, 8) NOT NULL,
    UNIQUE(date, symbol)
);
```

The unique constraint prevents duplicate observations for the same cryptocurrency and timestamp.

---

# 🤖 AI Research Agent

CryptoMind uses:

* Groq
* GPT-OSS 120B
* LangChain
* LangGraph

The agent can decide which tools are required to answer a research question.

For example:

```text
User:
"Analyze Bitcoin's recent performance and risk."

        ↓

LangGraph Agent

        ↓

Historical Analytics Tool
        +
Live Market Tool
        +
News Tool

        ↓

LLM Reasoning

        ↓

Structured Research Report
```

---

# 🧩 Tool-Based Architecture

CryptoMind currently includes the following tools:

### Live Market Tool

Retrieves current cryptocurrency prices and 24-hour changes.

```text
get_live_crypto_price()
```

### Historical Analytics Tool

Retrieves historical market and risk metrics.

```text
get_crypto_analysis()
```

### Cryptocurrency Comparison Tool

Compares multiple cryptocurrencies using historical data.

```text
compare_crypto_assets()
```

### Document Search Tool

Searches the Pinecone vector database for relevant document information.

```text
search_crypto_documents()
```

### Crypto News Tool

Retrieves recent cryptocurrency news from RSS feeds.

```text
search_crypto_news()
```

---

# 🧠 RAG — Retrieval-Augmented Generation

CryptoMind includes a RAG pipeline using:

* Hugging Face embeddings
* Sentence Transformers
* Pinecone
* LangGraph
* Groq

Current embedding model:

```text
sentence-transformers/all-MiniLM-L6-v2
```

Embedding dimension:

```text
384
```

Vector database:

```text
Pinecone
```

---

## 📚 Document Processing Pipeline

```text
Documents
    │
    ▼
Document Loader
    │
    ▼
Text Splitting
    │
    ▼
Embeddings
    │
    ▼
Pinecone
    │
    ▼
Semantic Search
    │
    ▼
Relevant Context
    │
    ▼
LLM
    │
    ▼
Grounded Answer
```

The current document collection includes Ethereum information.

The RAG system is designed to:

* Answer only from retrieved documents
* Avoid unsupported claims
* Avoid hallucinating missing information
* Return a clear insufficient-information response when necessary
* Include document/source context

---

# 📰 Crypto News

CryptoMind retrieves cryptocurrency news using RSS feeds from multiple sources.

Current sources include:

* CoinDesk
* CoinTelegraph
* Decrypt
* CryptoSlate
* Bitcoin Magazine

News can be filtered by cryptocurrency.

Example:

```text
search_crypto_news("BTC")
```

The agent is instructed to distinguish reported information from unsupported causal claims.

---

# 📋 Structured Research Reports

CryptoMind uses Pydantic models to produce structured research reports.

The report can contain:

```text
CryptoResearchReport
│
├── Asset
│
├── Live Market Data
│
├── Market Snapshot
│
├── Performance Metrics
│
├── Risk Metrics
│
├── News
│
├── Document Context
│
├── Sources
│
└── Interpretation
```

This makes the system easier to integrate with:

* APIs
* Frontend applications
* Dashboards
* Automated reports
* Future data pipelines

---

# 🔄 LangGraph Workflow

The current LangGraph workflow is:

```text
START
  │
  ▼
LLM
  │
  ├──────────────► Tools
  │                  │
  │                  ▼
  │                 LLM
  │
  ▼
Report Node
  │
  ▼
Report Generation
  │
  ▼
END
```

The graph separates:

1. Tool selection
2. Tool execution
3. Structured report construction
4. Human-readable report generation

---

# 🛡️ Grounded AI Behavior

CryptoMind is designed to reduce hallucinations by grounding responses in available data.

The agent distinguishes between:

### Live Data

Retrieved directly from the cryptocurrency market API.

### Historical Data

Retrieved from the PostgreSQL database.

### Document Data

Retrieved from Pinecone through RAG.

### News Data

Retrieved from external RSS sources.

The agent does not automatically treat one source as another.

For example:

```text
Live BTC price
        ≠
Historical database snapshot
```

Both values can appear in a report, but their sources are explicitly distinguished.

---

# 🧪 Agent Evaluation

CryptoMind currently has an automated evaluation suite containing **7 test cases**.

Tests cover:

```text
1. Current Bitcoin price
2. Historical Bitcoin performance
3. Bitcoin risk analysis
4. Latest Bitcoin news
5. Ethereum document question
6. Unknown document question
7. Cryptocurrency comparison
```

Latest evaluation:

```text
============================================================
CRYPTOMIND AGENT EVALUATION
============================================================

Total tests: 7
Passed: 7
Failed: 0

Success Rate: 100%
```

### RAG hallucination test

The evaluation also checks whether the agent invents information that is not contained in the available documents.

For example:

```text
Question:
"According to the available documents, who founded Ethereum?"
```

The system correctly responds that the available documents do not contain enough information instead of inventing an answer.

---

# ⚡ FastAPI Backend

CryptoMind exposes its functionality through FastAPI.

Available endpoints:

```text
GET /
GET /crypto/{symbol}
GET /compare
GET /correlation
```

Run the API with:

```powershell
uvicorn src.api:app --reload
```

API documentation is available through FastAPI's automatic documentation interface.

---

# 📁 Project Structure

```text
cryptomind/
│
├── .venv/
│
├── data/
│   ├── raw/
│   ├── processed/
│   ├── documents/
│   └── vectorstore/
│
├── src/
│   ├── __init__.py
│   ├── api.py
│   ├── analytics.py
│   ├── correlation.py
│   ├── database.py
│   ├── data_processor.py
│   ├── document_loader.py
│   ├── embeddings.py
│   ├── evaluation.py
│   ├── graph.py
│   ├── ingest_documents.py
│   ├── market_api.py
│   ├── news.py
│   ├── pipeline.py
│   ├── rag.py
│   ├── rag_qa.py
│   ├── research_report.py
│   └── tools.py
│
├── tests/
│
├── .env
├── requirements.txt
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the repository

```powershell
git clone https://github.com/Rehan135236/Cryptomind-AI.git
cd Cryptomind-AI
```

## 2. Create virtual environment

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

## 3. Install dependencies

```powershell
pip install -r requirements.txt
```

---

# 🔐 Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
GROQ_API_KEY=your_groq_api_key
HF_TOKEN=your_huggingface_token
PINECONE_API_KEY=your_pinecone_api_key
```

**Never commit the `.env` file to GitHub.**

Add it to `.gitignore`:

```text
.env
.venv/
__pycache__/
*.pyc
```

---

# 🗃️ Run the Historical Data Pipeline

Run:

```powershell
python -m src.pipeline
```

This fetches cryptocurrency historical data and stores it in PostgreSQL.

---

# 📊 Run Analytics

Run:

```powershell
python -m src.analytics
```

This calculates cryptocurrency performance and risk metrics.

---

# 🔗 Run Correlation Analysis

Run:

```powershell
python -m src.correlation
```

---

# 🧠 Run Document Ingestion

Place documents inside:

```text
data/documents/
```

Then run:

```powershell
python -m src.ingest_documents
```

This processes the documents, creates embeddings, and stores vectors in Pinecone.

---

# 🤖 Run the AI Agent

Run:

```powershell
python -m src.graph
```

The agent can then:

* Analyze cryptocurrency prices
* Retrieve historical metrics
* Compare crypto assets
* Search documents
* Retrieve crypto news
* Generate structured research reports

---

# 🧪 Run Evaluation

Run:

```powershell
python -m src.evaluation
```

Expected result:

```text
Total tests: 7
Passed: 7
Failed: 0
```

---

# 🛠️ Technology Stack

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pandas
* Pydantic

## AI / LLM

* Groq
* GPT-OSS 120B
* LangChain
* LangGraph

## RAG

* Hugging Face
* Sentence Transformers
* Pinecone

## Database

* PostgreSQL

## APIs / Data

* CoinGecko
* RSS feeds

## Development

* Git
* GitHub
* VS Code
* Jupyter

## Planned Frontend

* React
* Next.js

## Planned Infrastructure

* Docker
* Cloud deployment
* CI/CD

---

# 🗺️ Development Roadmap

```text
[x] Project Setup
[x] Live Crypto API
[x] Multiple Cryptocurrencies
[x] Historical Data
[x] Pandas Transformation
[x] PostgreSQL
[x] Crypto Analytics
[x] FastAPI
[x] LLM Integration
[x] Tool Calling
[x] LangChain
[x] LangGraph
[x] RAG
[x] Crypto News
[x] AI Research Agent
[x] Structured Research Reports
[x] Agent Evaluation
[ ] React / Next.js Frontend
[ ] Docker
[ ] Production Deployment
[ ] CI/CD
```

---

# 🎯 Project Goals

CryptoMind is being developed as a practical **AI Financial Research / Crypto Intelligence platform**.

The long-term architecture is intended to support:

* Automated market research
* Multi-source financial analysis
* Retrieval-augmented research
* Tool-using AI agents
* Structured financial reports
* Interactive dashboards
* Automated data pipelines
* Production API services

---

# ⚠️ Disclaimer

CryptoMind is a technical research and analysis project.

Market data, statistics, news, and generated interpretations are provided for research and educational purposes and should not be treated as financial advice.

---

# 👨💻 Author

**Rehan Rashid**

Software Engineer focused on:

* Artificial Intelligence
* Data Science
* Data Analytics
* Backend Engineering
* Full-Stack Development
* AI Agents
* Financial Data Systems

GitHub: `Rehan135236`

Portfolio: `rehanrashid.vercel.app`
