import sys
try:
    from .database import get_db_connection, get_connection, release_connection
    from .config import TRACKED_ASSETS
except ImportError:
    from database import get_db_connection, get_connection, release_connection
    from config import TRACKED_ASSETS


def check_database():
    print("=" * 60)
    print("CRYPTOMIND DATABASE INTEGRITY & HARDENING CHECK")
    print("=" * 60)

    # 1. Connection check
    try:
        conn = get_connection()
        release_connection(conn)
        print("Database connection: PASS")
    except Exception as err:
        print(f"Database connection: FAIL ({err})")
        return False

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 2. Table existence
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'crypto_prices'
            );
        """)
        table_exists = cursor.fetchone()[0]
        if not table_exists:
            print("crypto_prices table: FAIL (Table does not exist)")
            return False
        
        # 3. Total records
        cursor.execute("SELECT COUNT(*) FROM crypto_prices;")
        total_records = cursor.fetchone()[0]
        print(f"\ncrypto_prices:\n  Total records: {total_records}")

        # 4. Asset record counts
        cursor.execute("""
            SELECT symbol, COUNT(*), MIN(date), MAX(date)
            FROM crypto_prices
            GROUP BY symbol
            ORDER BY symbol;
        """)
        asset_rows = cursor.fetchall()
        existing_assets = {row[0]: row[1] for row in asset_rows}
        
        print("\nAssets Breakdown:")
        tracked_symbols = [symbol for symbol, _ in TRACKED_ASSETS]
        for symbol in tracked_symbols:
            count = existing_assets.get(symbol, 0)
            status = "PASS" if count > 0 else "WARNING (0 records)"
            print(f"  {symbol:<6} : {count:>4} records  [{status}]")

        # 5. Data integrity checks
        # Duplicates
        cursor.execute("""
            SELECT COUNT(*) FROM (
                SELECT symbol, date, COUNT(*)
                FROM crypto_prices
                GROUP BY symbol, date
                HAVING COUNT(*) > 1
            ) dupes;
        """)
        dupes_count = cursor.fetchone()[0]

        # Null checks
        cursor.execute("SELECT COUNT(*) FROM crypto_prices WHERE symbol IS NULL;")
        null_symbols = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM crypto_prices WHERE date IS NULL;")
        null_dates = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM crypto_prices WHERE price IS NULL;")
        null_prices = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM crypto_prices WHERE price <= 0;")
        invalid_prices = cursor.fetchone()[0]

        # Overall Date range
        cursor.execute("SELECT MIN(date), MAX(date) FROM crypto_prices;")
        min_date, max_date = cursor.fetchone()

        print("\nIntegrity:")
        print(f"  Duplicate (symbol, date) : {dupes_count}  [{'PASS' if dupes_count == 0 else 'FAIL'}]")
        print(f"  NULL symbols             : {null_symbols}  [{'PASS' if null_symbols == 0 else 'FAIL'}]")
        print(f"  NULL dates               : {null_dates}  [{'PASS' if null_dates == 0 else 'FAIL'}]")
        print(f"  NULL prices              : {null_prices}  [{'PASS' if null_prices == 0 else 'FAIL'}]")
        print(f"  Invalid prices (<= 0)    : {invalid_prices}  [{'PASS' if invalid_prices == 0 else 'FAIL'}]")
        print(f"  Overall Date Range       : {min_date} to {max_date}")

        # 6. Indexes check
        cursor.execute("""
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'crypto_prices';
        """)
        indexes = [row[0] for row in cursor.fetchall()]
        idx_symbol_date = "idx_crypto_prices_symbol_date" in indexes
        idx_date = "idx_crypto_prices_date" in indexes

        print("\nIndexes:")
        print(f"  idx_crypto_prices_symbol_date : {'PASS' if idx_symbol_date else 'FAIL'}")
        print(f"  idx_crypto_prices_date        : {'PASS' if idx_date else 'FAIL'}")

        # 7. Constraints check
        cursor.execute("""
            SELECT conname FROM pg_constraint
            WHERE conrelid = 'crypto_prices'::regclass;
        """)
        constraints = [row[0] for row in cursor.fetchall()]
        unique_constraint = ("unique_crypto_symbol_date" in constraints or "unique_crypto_date_symbol" in constraints or "crypto_prices_date_symbol_key" in constraints)
        check_constraint = "check_price_positive" in constraints

        print("\nConstraints:")
        print(f"  Unique (symbol, date) : {'PASS' if unique_constraint else 'FAIL'}")
        print(f"  Check (price > 0)     : {'PASS' if check_constraint else 'FAIL'}")

        cursor.close()

    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY: " + ("ALL CHECKS PASSED" if (dupes_count == 0 and null_symbols == 0 and null_dates == 0 and null_prices == 0 and invalid_prices == 0 and idx_symbol_date and idx_date) else "SOME CHECKS FAILED"))
    print("=" * 60)
    return True


if __name__ == "__main__":
    check_database()