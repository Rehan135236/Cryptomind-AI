from database import get_connection


def check_database():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            symbol,
            COUNT(*) AS total_records,
            MIN(date) AS first_date,
            MAX(date) AS last_date
        FROM crypto_prices
        GROUP BY symbol
        ORDER BY symbol;
    """)

    rows = cursor.fetchall()

    print("\nCrypto database summary:\n")

    for row in rows:
        symbol, total, first_date, last_date = row

        print(
            f"{symbol} | "
            f"Records: {total} | "
            f"From: {first_date} | "
            f"To: {last_date}"
        )

    cursor.close()
    connection.close()


if __name__ == "__main__":
    check_database()