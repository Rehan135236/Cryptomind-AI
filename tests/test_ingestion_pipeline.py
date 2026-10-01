import pytest
from src.config import TRACKED_ASSETS
from src.database import get_db_connection
from src.pipeline import execute_ingestion_cycle, get_latest_ingestion_status, get_data_freshness


def test_tracked_assets_configuration():
    assert len(TRACKED_ASSETS) == 16
    symbols = [s for s, _ in TRACKED_ASSETS]
    assert "BTC" in symbols
    assert "ETH" in symbols
    assert "NEAR" in symbols


def test_ingestion_cycle_execution_and_idempotency():
    # 1. Execute first ingestion run
    res1 = execute_ingestion_cycle(mode="incremental")
    assert res1["status"] in ["success", "partial_success"]
    assert res1["assets_succeeded"] > 0

    # 2. Execute second ingestion run (same interval)
    res2 = execute_ingestion_cycle(mode="incremental")
    assert res2["status"] in ["success", "partial_success"]

    # 3. Query PostgreSQL for duplicate (symbol, date) records
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT symbol, date, COUNT(*)
            FROM crypto_prices
            GROUP BY symbol, date
            HAVING COUNT(*) > 1;
        """)
        dupes = cursor.fetchall()
        cursor.close()

    assert len(dupes) == 0, f"Found duplicate records in database: {dupes}"


def test_ingestion_status_and_freshness():
    status_data = get_latest_ingestion_status()
    assert "status" in status_data
    assert status_data["status"] in ["success", "partial_success", "failed"]

    freshness_data = get_data_freshness()
    assert freshness_data["latest_timestamp"] is not None
    assert freshness_data["age_minutes"] is not None
    assert freshness_data["is_fresh"] is True
