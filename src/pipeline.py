import logging
import time
import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, Any, Optional

try:
    from .market_api import get_live_market_price, get_historical_prices
    from .data_processor import transform_price_data
    from .database import get_db_connection
    from .config import TRACKED_ASSETS, INGESTION_INTERVAL_MINUTES
except ImportError:
    from market_api import get_live_market_price, get_historical_prices
    from data_processor import transform_price_data
    from database import get_db_connection
    from config import TRACKED_ASSETS, INGESTION_INTERVAL_MINUTES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingestion_pipeline")

# In-process lock to prevent overlapping ingestion runs
_ingestion_lock = Lock()


def execute_ingestion_cycle(mode: str = "incremental", days: int = 1) -> Dict[str, Any]:

    if not _ingestion_lock.acquire(blocking=False):
        logger.warning("Ingestion cycle skipped: an ingestion run is already in progress.")
        return {
            "status": "skipped",
            "reason": "Another ingestion run is currently executing.",
        }

    run_id = str(uuid.uuid4())
    start_time = time.perf_counter()
    started_at = datetime.now(timezone.utc).replace(tzinfo=None)

    assets_attempted = len(TRACKED_ASSETS)
    assets_succeeded = 0
    assets_failed = 0
    records_inserted = 0
    records_updated = 0
    failed_symbols = []

    logger.info(f"Starting Ingestion Run [{run_id}] (Mode: {mode}) across {assets_attempted} assets...")

    # Record initial run entry in ingestion_runs table
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO ingestion_runs
                (id, started_at, status, assets_attempted)
                VALUES (%s, %s, %s, %s);
                """,
                (run_id, started_at, "running", assets_attempted),
            )
            cursor.close()
    except Exception as db_err:
        logger.error(f"Failed to record run initialization in DB: {db_err}")

    try:
        for symbol, coin_id in TRACKED_ASSETS:
            symbol_success = False
            try:
                if mode == "incremental":
                    # Fetch live market observation
                    live_data = get_live_market_price(symbol)
                    if "error" in live_data or not live_data.get("current_price"):
                        logger.warning(f"Live market data unavailable for {symbol}: {live_data.get('error')}")
                        failed_symbols.append(f"{symbol} ({live_data.get('error', 'No price')})")
                        assets_failed += 1
                        continue

                    # Current UTC timestamp rounded to minute
                    dt_now = datetime.now(timezone.utc).replace(tzinfo=None, second=0, microsecond=0)
                    price = float(live_data["current_price"])

                    if price <= 0:
                        logger.warning(f"Invalid non-positive price for {symbol}: {price}")
                        failed_symbols.append(f"{symbol} (Invalid price {price})")
                        assets_failed += 1
                        continue

                    with get_db_connection() as conn:
                        cursor = conn.cursor()
                        # Check existing price to accurately count inserts vs updates
                        cursor.execute(
                            "SELECT price FROM crypto_prices WHERE symbol = %s AND date = %s;",
                            (symbol, dt_now),
                        )
                        existing = cursor.fetchone()

                        cursor.execute(
                            """
                            INSERT INTO crypto_prices (date, symbol, price)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (symbol, date)
                            DO UPDATE SET price = EXCLUDED.price;
                            """,
                            (dt_now, symbol, price),
                        )
                        cursor.close()

                    if existing is None:
                        records_inserted += 1
                    else:
                        records_updated += 1

                    symbol_success = True

                else:
                    # Historical backfill mode
                    raw_data = get_historical_prices(coin_id, days=days)
                    df = transform_price_data(raw_data, symbol)
                    if df.empty:
                        logger.warning(f"No transformed records returned for {symbol}")
                        failed_symbols.append(f"{symbol} (Empty backfill)")
                        assets_failed += 1
                        continue

                    with get_db_connection() as conn:
                        cursor = conn.cursor()
                        for _, row in df.iterrows():
                            if row["price"] is None or row["price"] <= 0:
                                continue
                            cursor.execute(
                                """
                                INSERT INTO crypto_prices (date, symbol, price)
                                VALUES (%s, %s, %s)
                                ON CONFLICT (symbol, date)
                                DO UPDATE SET price = EXCLUDED.price;
                                """,
                                (row["date"], row["symbol"], float(row["price"])),
                            )
                            records_inserted += 1
                        cursor.close()
                    symbol_success = True

            except Exception as asset_err:
                logger.error(f"Error processing ingestion for {symbol}: {asset_err}")
                failed_symbols.append(f"{symbol} ({type(asset_err).__name__})")

            if symbol_success:
                assets_succeeded += 1
            else:
                if f"{symbol}" not in [fs.split(" ")[0] for fs in failed_symbols]:
                    assets_failed += 1
                    failed_symbols.append(f"{symbol} (Ingestion error)")

            # Rate-limit safety pause between requests
            time.sleep(1.2)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

        if assets_failed == 0:
            final_status = "success"
        elif assets_succeeded > 0:
            final_status = "partial_success"
        else:
            final_status = "failed"

        error_summary = ", ".join(failed_symbols) if failed_symbols else None

        # Update metadata table with final status
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE ingestion_runs
                    SET completed_at = %s,
                        status = %s,
                        assets_succeeded = %s,
                        assets_failed = %s,
                        records_inserted = %s,
                        records_updated = %s,
                        duration_ms = %s,
                        error_summary = %s
                    WHERE id = %s;
                    """,
                    (
                        completed_at,
                        final_status,
                        assets_succeeded,
                        assets_failed,
                        records_inserted,
                        records_updated,
                        duration_ms,
                        error_summary,
                        run_id,
                    ),
                )
                cursor.close()
        except Exception as db_err:
            logger.error(f"Failed to update ingestion run record in DB: {db_err}")

        # Console Summary Output
        print("\n" + "=" * 60)
        print("CRYPTOMIND MARKET INGESTION SUMMARY")
        print("=" * 60)
        print(f"Run ID           : {run_id}")
        print(f"Started (UTC)    : {started_at}")
        print(f"Completed (UTC)  : {completed_at}")
        print(f"Status           : {final_status.upper()}")
        print(f"Assets Attempted : {assets_attempted}")
        print(f"Successful       : {assets_succeeded}")
        print(f"Failed           : {assets_failed}")
        print(f"Records Inserted : {records_inserted}")
        print(f"Records Updated  : {records_updated}")
        if failed_symbols:
            print(f"Failed Assets    : {', '.join(failed_symbols)}")
        print(f"Duration         : {round(duration_ms / 1000, 2)}s ({duration_ms}ms)")
        print("=" * 60 + "\n")

        return {
            "run_id": run_id,
            "started_at": started_at.isoformat(),
            "completed_at": completed_at.isoformat(),
            "status": final_status,
            "assets_attempted": assets_attempted,
            "assets_succeeded": assets_succeeded,
            "assets_failed": assets_failed,
            "records_inserted": records_inserted,
            "records_updated": records_updated,
            "duration_ms": duration_ms,
            "failed_symbols": failed_symbols,
        }

    finally:
        _ingestion_lock.release()


def save_crypto_data(symbol: str, coin_id: str, days: int = 30):
    """
    Backwards compatibility helper for single asset save.
    """
    raw_data = get_historical_prices(coin_id, days=days)
    df = transform_price_data(raw_data, symbol)
    if df.empty:
        return

    with get_db_connection() as conn:
        cursor = conn.cursor()
        for _, row in df.iterrows():
            if row["price"] is None or row["price"] <= 0:
                continue
            cursor.execute(
                """
                INSERT INTO crypto_prices (date, symbol, price)
                VALUES (%s, %s, %s)
                ON CONFLICT (symbol, date)
                DO UPDATE SET price = EXCLUDED.price;
                """,
                (row["date"], row["symbol"], float(row["price"])),
            )
        cursor.close()


def run_pipeline(days: int = 30, sleep_delay: float = 1.2):

    return execute_ingestion_cycle(mode="incremental")


def get_latest_ingestion_status() -> Dict[str, Any]:

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, started_at, completed_at, status,
                       assets_attempted, assets_succeeded, assets_failed,
                       records_inserted, records_updated, duration_ms, error_summary
                FROM ingestion_runs
                ORDER BY started_at DESC
                LIMIT 1;
                """
            )
            row = cursor.fetchone()
            cursor.close()

            if row:
                return {
                    "run_id": row[0],
                    "started_at": row[1].isoformat() if row[1] else None,
                    "completed_at": row[2].isoformat() if row[2] else None,
                    "status": row[3],
                    "assets_attempted": row[4],
                    "assets_succeeded": row[5],
                    "assets_failed": row[6],
                    "records_inserted": row[7],
                    "records_updated": row[8],
                    "duration_ms": float(row[9]) if row[9] is not None else None,
                    "error_summary": row[10],
                }
    except Exception as err:
        logger.error(f"Error fetching latest ingestion status: {err}")

    return {
        "status": "none",
        "message": "No ingestion runs recorded yet.",
    }


def get_data_freshness() -> Dict[str, Any]:

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT MAX(date) FROM crypto_prices;")
            max_date = cursor.fetchone()[0]
            cursor.close()

            if max_date:
                now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
                age_seconds = (now_utc - max_date).total_seconds()
                age_minutes = round(max(0.0, age_seconds / 60.0), 2)
                # Data is fresh if latest record is within expected interval + grace period
                threshold_minutes = float(INGESTION_INTERVAL_MINUTES + 30)
                is_fresh = age_minutes <= threshold_minutes

                return {
                    "latest_timestamp": max_date.isoformat(),
                    "age_minutes": age_minutes,
                    "is_fresh": is_fresh,
                }
    except Exception as err:
        logger.error(f"Error calculating data freshness: {err}")

    return {
        "latest_timestamp": None,
        "age_minutes": None,
        "is_fresh": False,
    }


if __name__ == "__main__":
    execute_ingestion_cycle(mode="incremental")