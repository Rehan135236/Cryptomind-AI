from typing import Optional, List

from pydantic import BaseModel, Field


# ============================================================
# LIVE MARKET DATA
# ============================================================

class LiveMarketData(BaseModel):

    current_price: Optional[float] = None

    change_24h: Optional[float] = None

    coin_id: Optional[str] = None

    source: Optional[str] = None


# ============================================================
# HISTORICAL MARKET SNAPSHOT
# ============================================================

class MarketSnapshot(BaseModel):

    current_price: Optional[float] = None

    average_price: Optional[float] = None

    minimum_price: Optional[float] = None

    maximum_price: Optional[float] = None

    moving_average_7d: Optional[float] = None

    moving_average_30d: Optional[float] = None


# ============================================================
# PERFORMANCE METRICS
# ============================================================

class PerformanceMetrics(BaseModel):

    return_7d: Optional[float] = None

    return_period: Optional[float] = None

    period_start: Optional[str] = None

    period_end: Optional[str] = None

    period_days: Optional[float] = None


# ============================================================
# RISK METRICS
# ============================================================

class RiskMetrics(BaseModel):

    daily_volatility: Optional[float] = None

    maximum_drawdown: Optional[float] = None

    daily_sharpe_ratio: Optional[float] = None


# ============================================================
# NEWS ARTICLE
# ============================================================

class NewsArticle(BaseModel):

    source: str

    title: str

    published: Optional[str] = None

    description: Optional[str] = None

    link: Optional[str] = None


# ============================================================
# SOURCE INFORMATION
# ============================================================

class SourceInfo(BaseModel):

    source_type: str

    source_name: str

    description: str


# ============================================================
# COMPLETE CRYPTO RESEARCH REPORT
# ============================================================

class CryptoResearchReport(BaseModel):

    asset: str

    # Current live market information
    live_market: LiveMarketData = Field(
        default_factory=LiveMarketData
    )

    # Historical PostgreSQL analytics
    market_snapshot: MarketSnapshot

    performance: PerformanceMetrics

    risk_metrics: RiskMetrics

    news: List[NewsArticle] = Field(
        default_factory=list
    )

    document_context: List[dict] = Field(
        default_factory=list
    )

    sources: List[SourceInfo] = Field(
        default_factory=list
    )

    interpretation: Optional[str] = None