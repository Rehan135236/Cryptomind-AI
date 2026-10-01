import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# CRYPTOMIND CONFIGURATION & ASSET UNIVERSE
# ============================================================

TRACKED_ASSETS = [
    ("BTC", "bitcoin"),
    ("ETH", "ethereum"),
    ("BNB", "binancecoin"),
    ("SOL", "solana"),
    ("XRP", "ripple"),
    ("ADA", "cardano"),
    ("DOGE", "dogecoin"),
    ("AVAX", "avalanche-2"),
    ("TRX", "tron"),
    ("LINK", "chainlink"),
    ("DOT", "polkadot"),
    ("LTC", "litecoin"),
    ("BCH", "bitcoin-cash"),
    ("UNI", "uniswap"),
    ("ATOM", "cosmos"),
    ("NEAR", "near"),
]

DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL", "BNB"]

# Environment & Observability
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Database & Credentials
DATABASE_URL = os.getenv("DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

# CORS Origins Configuration
_raw_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
)
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in _raw_origins.split(",") if origin.strip()
]

# Rate Limiting (Requests per minute)
GENERAL_RATE_LIMIT = int(os.getenv("GENERAL_RATE_LIMIT", "60"))
RESEARCH_RATE_LIMIT = int(os.getenv("RESEARCH_RATE_LIMIT", "10"))

# Timeouts & Request Validation Boundaries
HTTP_TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT_SECONDS", "15.0"))
MAX_RESEARCH_QUERY_LENGTH = int(os.getenv("MAX_RESEARCH_QUERY_LENGTH", "1000"))

# Scheduler & Ingestion Worker Settings
INGESTION_ENABLED = os.getenv("INGESTION_ENABLED", "true").lower() == "true"
INGESTION_INTERVAL_MINUTES = int(os.getenv("INGESTION_INTERVAL_MINUTES", "60"))
INGESTION_RUN_ON_STARTUP = os.getenv("INGESTION_RUN_ON_STARTUP", "false").lower() == "true"
