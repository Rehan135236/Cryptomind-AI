try:
    from .database import get_db_connection
except ImportError:
    from database import get_db_connection


def cleanup_duplicates():

    with get_db_connection() as connection:
        cursor = connection.cursor()

        cursor.execute("""
            DELETE FROM crypto_prices a
            USING crypto_prices b
            WHERE a.id > b.id
            AND a.date = b.date
            AND a.symbol = b.symbol;
        """)

        deleted_rows = cursor.rowcount
        cursor.close()

    print(f"Deleted {deleted_rows} duplicate records.")
    return deleted_rows


if __name__ == "__main__":
    cleanup_duplicates()