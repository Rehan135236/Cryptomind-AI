from database import get_connection


def add_unique_constraint():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        ALTER TABLE crypto_prices
        ADD CONSTRAINT unique_crypto_date_symbol
        UNIQUE (date, symbol);
    """)

    connection.commit()

    cursor.close()
    connection.close()

    print("Unique constraint added successfully!")


if __name__ == "__main__":
    add_unique_constraint()