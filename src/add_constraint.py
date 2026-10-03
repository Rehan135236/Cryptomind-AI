try:
    from .database import get_db_connection
except ImportError:
    from database import get_db_connection


def add_unique_constraint():

    with get_db_connection() as connection:
        cursor = connection.cursor()

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

        cursor.close()

    print("Unique constraint verified successfully!")


if __name__ == "__main__":
    add_unique_constraint()