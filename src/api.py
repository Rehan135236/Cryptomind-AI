import time
import uuid
import logging
from collections import defaultdict
from threading import Lock
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import SQLAlchemyError
from psycopg2 import OperationalError, InterfaceError

from .config import (
    ENVIRONMENT,
    LOG_LEVEL,
    CORS_ALLOWED_ORIGINS,
    GENERAL_RATE_LIMIT,
    RESEARCH_RATE_LIMIT,
    MAX_RESEARCH_QUERY_LENGTH,
)
from .analytics import (
    calculate_metrics,
    compare_cryptocurrencies,
    get_historical_prices,
)
from .correlation import calculate_correlation
from .database import get_db_connection
from .graph import graph
from .pipeline import get_latest_ingestion_status, get_data_freshness, execute_ingestion_cycle
from .scheduler import start_scheduler, stop_scheduler, get_scheduler_info

# ============================================================
# LOGGING SETUP
# ============================================================
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("cryptomind.api")


# ============================================================
# RATE LIMITER (SLIDING WINDOW)
# ============================================================
class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    """
    def __init__(self):
        self._requests = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            # Filter timestamps outside the window
            timestamps = [t for t in self._requests[key] if t > cutoff]
            if len(timestamps) >= max_requests:
                self._requests[key] = timestamps
                return False
            timestamps.append(now)
            self._requests[key] = timestamps
            return True


rate_limiter = SlidingWindowRateLimiter()


# ============================================================
# FASTAPI APP
# ============================================================
app = FastAPI(
    title="CryptoMind API",
    description="AI-powered cryptocurrency research, quantitative analytics, and RAG API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================================
# CORS HARDENING
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST METADATA & TIMING MIDDLEWARE
# ============================================================
@app.middleware("http")
async def add_request_metadata_and_timing(request: Request, call_next):
    # Extract or generate Request ID
    req_id = request.headers.get("X-Request-ID")
    if not req_id or len(req_id) > 64:
        req_id = str(uuid.uuid4())
    
    request.state.request_id = req_id
    start_time = time.perf_counter()

    # Rate limiting check
    client_ip = request.client.host if request.client else "127.0.0.1"
    path = request.url.path

    if path == "/research":
        limit_key = f"research:{client_ip}"
        allowed = rate_limiter.is_allowed(limit_key, RESEARCH_RATE_LIMIT, 60)
    else:
        limit_key = f"general:{client_ip}"
        allowed = rate_limiter.is_allowed(limit_key, GENERAL_RATE_LIMIT, 60)

    if not allowed:
        logger.warning(f"[Request ID: {req_id}] Rate limit exceeded for IP {client_ip} on path {path}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded. Please try again later.",
                "error": "Rate limit exceeded",
                "request_id": req_id,
            },
            headers={"Retry-After": "60", "X-Request-ID": req_id},
        )

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time-Ms"] = str(duration_ms)

    logger.info(
        f"[Request ID: {req_id}] {request.method} {path} -> {response.status_code} ({duration_ms}ms)"
    )

    return response


# ============================================================
# GLOBAL EXCEPTION HANDLERS
# ============================================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error": exc.detail,
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id} if req_id else {},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", None)
    logger.warning(f"[Request ID: {req_id}] Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": "Invalid request payload or parameters.",
            "error": "Validation Error",
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id} if req_id else {},
    )


@app.exception_handler(SQLAlchemyError)
@app.exception_handler(OperationalError)
@app.exception_handler(InterfaceError)
async def database_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None)
    logger.error(f"[Request ID: {req_id}] Database Error: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database service currently unavailable. Please try again.",
            "error": "Database Error",
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id} if req_id else {},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None)
    logger.error(f"[Request ID: {req_id}] Unhandled Exception: {type(exc).__name__}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected internal server error occurred.",
            "error": "Internal Server Error",
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id} if req_id else {},
    )


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================
class ResearchRequest(BaseModel):
    query: str = Field(..., description="Research query for the CryptoMind AI Agent")

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Research query cannot be empty or whitespace only.")
        if len(v) > MAX_RESEARCH_QUERY_LENGTH:
            raise ValueError(f"Research query exceeds maximum length of {MAX_RESEARCH_QUERY_LENGTH} characters.")
        return stripped


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str


class DbHealthResponse(BaseModel):
    status: str
    database: str
    total_records: int


class SymbolListResponse(BaseModel):
    symbols: List[str]
    count: int


# ============================================================
# EVENT HANDLERS
# ============================================================
@app.on_event("startup")
def startup_event():
    logger.info("Initializing CryptoMind backend services...")
    start_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    logger.info("Shutting down CryptoMind backend services...")
    stop_scheduler()


# ============================================================
# HEALTH & INGESTION ENDPOINTS
# ============================================================
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "CryptoMind API is running",
        "status": "ok",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
    }


@app.get("/health/db", response_model=DbHealthResponse, tags=["Health"])
def health_db():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM crypto_prices;")
            count = cursor.fetchone()[0]
            cursor.close()
        return {
            "status": "ok",
            "database": "ok",
            "total_records": count,
        }
    except Exception as err:
        logger.error(f"Health DB check failed: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database health check failed.",
        )


@app.get("/ingestion/status", tags=["Ingestion"])
def get_ingestion_status_endpoint():
    scheduler_info = get_scheduler_info()
    last_run = get_latest_ingestion_status()
    freshness = get_data_freshness()

    return {
        "scheduler": scheduler_info,
        "last_run": last_run,
        "data_freshness": freshness,
    }


# ============================================================
# AI RESEARCH ENDPOINT
# ============================================================
@app.post("/research", tags=["AI Research"])
def research(request: ResearchRequest, raw_req: Request):
    req_id = getattr(raw_req.state, "request_id", "N/A")
    query = request.query
    logger.info(f"[Request ID: {req_id}] Initiating AI Research for query: '{query[:80]}...'")

    try:
        result = graph.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": query,
                    }
                ]
            }
        )
        logger.info(f"[Request ID: {req_id}] AI Research query completed successfully.")
        return result

    except Exception as e:
        logger.error(f"[Request ID: {req_id}] AI Research execution failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research agent processing failed.",
        )


# ============================================================
# AVAILABLE CRYPTOCURRENCIES
# ============================================================
@app.get("/crypto/symbols", response_model=SymbolListResponse, tags=["Analytics"])
def get_available_symbols():
    try:
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT DISTINCT symbol
                FROM crypto_prices
                ORDER BY symbol;
            """)
            symbols = [row[0] for row in cursor.fetchall()]
            cursor.close()

        return {
            "symbols": symbols,
            "count": len(symbols),
        }
    except Exception as e:
        logger.error(f"Failed to retrieve symbols: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cryptocurrency symbols.",
        )


# ============================================================
# CRYPTO METRICS
# ============================================================
@app.get("/crypto/{symbol}", tags=["Analytics"])
def get_crypto(symbol: str):
    symbol = symbol.strip().upper()
    metrics = calculate_metrics(symbol)

    if metrics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No analytical data found for cryptocurrency symbol '{symbol}'.",
        )

    return metrics


# ============================================================
# HISTORICAL CRYPTO PRICES
# ============================================================
@app.get("/crypto/{symbol}/history", tags=["Analytics"])
def get_crypto_history(symbol: str):
    symbol = symbol.strip().upper()
    historical_prices = get_historical_prices(symbol)

    if not historical_prices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No historical price data found for cryptocurrency symbol '{symbol}'.",
        )

    return {
        "symbol": symbol,
        "data": historical_prices,
    }


# ============================================================
# COMPARE CRYPTOCURRENCIES
# ============================================================
@app.get("/compare", tags=["Analytics"])
def compare_crypto(symbols: str = "BTC,ETH,SOL,BNB"):
    symbol_list = [
        symbol.strip().upper()
        for symbol in symbols.split(",")
        if symbol.strip()
    ]

    if not symbol_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid cryptocurrency symbols provided for comparison.",
        )

    comparison = compare_cryptocurrencies(symbol_list)

    if comparison.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No data found for the requested cryptocurrencies.",
        )

    return comparison.to_dict(orient="records")


# ============================================================
# CORRELATION MATRIX
# ============================================================
@app.get("/correlation", tags=["Analytics"])
def crypto_correlation(symbols: str = "BTC,ETH,SOL,BNB"):
    symbol_list = [
        symbol.strip().upper()
        for symbol in symbols.split(",")
        if symbol.strip()
    ]

    if not symbol_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid cryptocurrency symbols provided for correlation matrix.",
        )

    correlation = calculate_correlation(symbol_list)

    if correlation.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No correlation data found for requested cryptocurrencies.",
        )

    return correlation.to_dict()


# ============================================================
# NEWS
# ============================================================
@app.get("/news", tags=["News"])
def get_news(symbol: Optional[str] = None, limit: int = 30):
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit parameter must be between 1 and 100.",
        )

    try:
        from .news import get_crypto_news
        symbol_filter = symbol.strip().upper() if symbol else None

        articles = get_crypto_news(
            symbol=symbol_filter,
            limit_per_source=10,
            max_results=limit,
        )

        return {
            "articles": articles,
            "count": len(articles),
        }
    except Exception as e:
        logger.error(f"Failed to fetch news: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch cryptocurrency news.",
        )