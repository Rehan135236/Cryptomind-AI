import os
import logging
from contextlib import contextmanager
from dotenv import load_dotenv
import psycopg2
from psycopg2 import pool, OperationalError, InterfaceError
from sqlalchemy import create_engine

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set.")

# Pool configuration
MIN_CONN = int(os.getenv("DB_POOL_MIN", "1"))
MAX_CONN = int(os.getenv("DB_POOL_MAX", "10"))

_connection_pool = None
_sqlalchemy_engine = None


def get_pool():

    global _connection_pool
    if _connection_pool is None or _connection_pool.closed:
        _connection_pool = pool.ThreadedConnectionPool(
            MIN_CONN,
            MAX_CONN,
            dsn=DATABASE_URL,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )
    return _connection_pool


def get_connection():

    p = get_pool()
    conn = p.getconn()
    
    # Connection health check
    if conn.closed != 0:
        try:
            p.putconn(conn, close=True)
        except Exception:
            pass
        conn = psycopg2.connect(
            dsn=DATABASE_URL,
            keepalives=1,
            keepalives_idle=30,
            keepalives_interval=10,
            keepalives_count=5
        )
    else:
        # Quick ping test to catch serverless disconnects
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
        except (OperationalError, InterfaceError):
            try:
                p.putconn(conn, close=True)
            except Exception:
                pass
            conn = psycopg2.connect(
                dsn=DATABASE_URL,
                keepalives=1,
                keepalives_idle=30,
                keepalives_interval=10,
                keepalives_count=5
            )
            
    return conn


def release_connection(conn, close=False):

    if conn and _connection_pool and not _connection_pool.closed:
        try:
            if close or conn.closed != 0:
                _connection_pool.putconn(conn, close=True)
            else:
                _connection_pool.putconn(conn)
        except Exception as err:
            logger.warning(f"Error returning connection to pool: {err}")
            try:
                conn.close()
            except Exception:
                pass


@contextmanager
def get_db_connection():

    conn = get_connection()
    should_close = False
    try:
        yield conn
        if conn.closed == 0:
            conn.commit()
    except (OperationalError, InterfaceError) as conn_err:
        logger.warning(f"Database connection error: {conn_err}")
        should_close = True
        raise
    except Exception:
        if conn.closed == 0:
            try:
                conn.rollback()
            except Exception:
                should_close = True
        else:
            should_close = True
        raise
    finally:
        release_connection(conn, close=should_close)


def get_engine():

    global _sqlalchemy_engine
    if _sqlalchemy_engine is None:
        _sqlalchemy_engine = create_engine(
            DATABASE_URL,
            pool_size=MIN_CONN,
            max_overflow=MAX_CONN,
            pool_pre_ping=True,
            pool_recycle=300
        )
    return _sqlalchemy_engine


def harden_database():

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crypto_prices (
                id SERIAL PRIMARY KEY,
                date TIMESTAMP NOT NULL,
                symbol VARCHAR(20) NOT NULL,
                price NUMERIC(20, 8) NOT NULL
            );
        """)

        # 2. Check and clean duplicates before creating unique constraint
        cursor.execute("""
            DELETE FROM crypto_prices a
            USING crypto_prices b
            WHERE a.id > b.id
            AND a.date = b.date
            AND a.symbol = b.symbol;
        """)

        # 3. Add UNIQUE constraint if not exists
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'unique_crypto_symbol_date'
                ) THEN
                    ALTER TABLE crypto_prices
                    ADD CONSTRAINT unique_crypto_symbol_date UNIQUE (symbol, date);
                END IF;
            END $$;
        """)

        # 4. Add CHECK constraint for positive price
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'check_price_positive'
                ) THEN
                    ALTER TABLE crypto_prices
                    ADD CONSTRAINT check_price_positive CHECK (price > 0);
                END IF;
            END $$;
        """)

        # 5. Add composite index for symbol + date queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol_date
            ON crypto_prices (symbol, date DESC);
        """)

        # 6. Add index for date queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_crypto_prices_date
            ON crypto_prices (date);
        """)

        # 7. Add ingestion_runs table for run metadata
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ingestion_runs (
                id VARCHAR(64) PRIMARY KEY,
                started_at TIMESTAMP NOT NULL,
                completed_at TIMESTAMP,
                status VARCHAR(20) NOT NULL,
                assets_attempted INT NOT NULL DEFAULT 0,
                assets_succeeded INT NOT NULL DEFAULT 0,
                assets_failed INT NOT NULL DEFAULT 0,
                records_inserted INT NOT NULL DEFAULT 0,
                records_updated INT NOT NULL DEFAULT 0,
                duration_ms NUMERIC(12, 2),
                error_summary TEXT
            );
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started
            ON ingestion_runs (started_at DESC);
        """)

        cursor.close()

    print("Database hardening complete: tables, constraints, and indexes verified.")


def create_tables():
    harden_database()


if __name__ == "__main__":
    harden_database()