import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
import psycopg2

load_dotenv()


def get_connection():
    return psycopg2.connect(
        os.getenv("DATABASE_URL")
    )


def get_engine():
    return create_engine(
        os.getenv("DATABASE_URL")
    )


def create_tables():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS crypto_prices (
            id SERIAL PRIMARY KEY,
            date TIMESTAMP NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            price NUMERIC(20, 8) NOT NULL,
            UNIQUE(date, symbol)
        );
    """)

    connection.commit()

    cursor.close()
    connection.close()

    print("crypto_prices table created successfully!")


if __name__ == "__main__":
    create_tables()