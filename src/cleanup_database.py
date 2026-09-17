from database import get_connection


def cleanup_duplicates():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM crypto_prices a
        USING crypto_prices b
        WHERE a.id > b.id
        AND a.date = b.date
        AND a.symbol = b.symbol;
    """)

    deleted_rows = cursor.rowcount

    connection.commit()

    cursor.close()
    connection.close()

    print(f"Deleted {deleted_rows} duplicate records.")


if __name__ == "__main__":
    cleanup_duplicates()