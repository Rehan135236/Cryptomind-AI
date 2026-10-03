import os
import re
import logging
from typing import Dict, List, Tuple
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("config")

# ============================================================
# CRYPTOMIND ASSET UNIVERSE
# ============================================================

TRACKED_ASSETS: List[Tuple[str, str]] = [
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

DEFAULT_SYMBOLS: List[str] = ["BTC", "ETH", "SOL", "BNB"]

# ============================================================
# ENVIRONMENT & OBSERVABILITY
# ============================================================
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

# ============================================================
# REQUIRED PRODUCTION VARIABLES
# ============================================================
DATABASE_URL: str = os.getenv("DATABASE_URL", "")
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
HF_TOKEN: str = os.getenv("HF_TOKEN", "")
PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")

# ============================================================
# OPTIONAL VARIABLES & DEFAULTS
# ============================================================
COINGECKO_API_KEY: str = os.getenv("COINGECKO_API_KEY", "")

# CORS Origins Configuration
_raw_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
)
CORS_ALLOWED_ORIGINS: List[str] = [
    origin.strip() for origin in _raw_origins.split(",") if origin.strip()
]

# Database Pool Settings
DB_POOL_MIN: int = int(os.getenv("DB_POOL_MIN", "1"))
DB_POOL_MAX: int = int(os.getenv("DB_POOL_MAX", "10"))

# Rate Limiting (Requests per minute)
GENERAL_RATE_LIMIT: int = int(os.getenv("GENERAL_RATE_LIMIT", "60"))
RESEARCH_RATE_LIMIT: int = int(os.getenv("RESEARCH_RATE_LIMIT", "10"))

# Timeouts & Request Validation Boundaries
HTTP_TIMEOUT_SECONDS: float = float(os.getenv("HTTP_TIMEOUT_SECONDS", "15.0"))
MAX_RESEARCH_QUERY_LENGTH: int = int(os.getenv("MAX_RESEARCH_QUERY_LENGTH", "1000"))

# Scheduler & Ingestion Worker Settings
INGESTION_ENABLED: bool = os.getenv("INGESTION_ENABLED", "true").lower() == "true"
INGESTION_INTERVAL_MINUTES: int = int(os.getenv("INGESTION_INTERVAL_MINUTES", "60"))
INGESTION_RUN_ON_STARTUP: bool = os.getenv("INGESTION_RUN_ON_STARTUP", "false").lower() == "true"


# ============================================================
# SECRET SANITIZATION UTILITY
# ============================================================
def redact_secret(value: str) -> str:
    """Mask secret key values for secure logging."""
    if not value:
        return "<NOT_SET>"
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}...{value[-4:]}"


def sanitize_log_message(message: str) -> str:
    """Redact sensitive secrets/credentials from log messages."""
    if not message:
        return message

    sanitized = message
    for secret in [DATABASE_URL, GROQ_API_KEY, HF_TOKEN, PINECONE_API_KEY, COINGECKO_API_KEY]:
        if secret and len(secret) > 6 and secret in sanitized:
            sanitized = sanitized.replace(secret, redact_secret(secret))
    
    # Redact postgres password patterns if present in URLs
    sanitized = re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", sanitized)
    return sanitized


# ============================================================
# STARTUP CONFIGURATION VALIDATION
# ============================================================
def validate_config() -> Dict[str, bool]:
    """
    Validates required and optional configuration settings.
    In production mode, raises ValueError if required secrets are missing.
    """
    required_keys = {
        "DATABASE_URL": DATABASE_URL,
        "GROQ_API_KEY": GROQ_API_KEY,
        "HF_TOKEN": HF_TOKEN,
        "PINECONE_API_KEY": PINECONE_API_KEY,
    }

    missing_keys = [k for k, v in required_keys.items() if not v]

    if missing_keys:
        msg = f"Missing required environment variables: {', '.join(missing_keys)}"
        if ENVIRONMENT == "production":
            logger.error(f"[PRODUCTION CONFIG ERROR] {msg}")
            raise ValueError(msg)
        else:
            logger.warning(f"[DEVELOPMENT CONFIG WARNING] {msg}")

    # Log sanitized configuration status
    logger.info(f"CryptoMind Configuration Loaded [Environment: {ENVIRONMENT}]")
    logger.info(f"  - Database URL       : {redact_secret(DATABASE_URL)}")
    logger.info(f"  - Groq API Key       : {redact_secret(GROQ_API_KEY)}")
    logger.info(f"  - Pinecone API Key   : {redact_secret(PINECONE_API_KEY)}")
    logger.info(f"  - Hugging Face Token : {redact_secret(HF_TOKEN)}")
    logger.info(f"  - Ingestion Enabled  : {INGESTION_ENABLED} (Interval: {INGESTION_INTERVAL_MINUTES}m)")

    return {k: bool(v) for k, v in required_keys.items()}
