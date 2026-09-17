from market_api import get_historical_prices
from data_processor import transform_price_data
from database import get_connection


def save_crypto_data(symbol, coin_id, days=30):

    # 1. Extract data from CoinGecko
    print(f"Fetching {symbol} data...")

    data = get_historical_prices(
        coin_id,
        days
    )

    # 2. Transform data using Pandas
    df = transform_price_data(
        data,
        symbol
    )

    # 3. Connect to PostgreSQL
    connection = get_connection()
    cursor = connection.cursor()

    # 4. Load data using UPSERT
    for _, row in df.iterrows():

        cursor.execute(
            """
            INSERT INTO crypto_prices
            (date, symbol, price)
            VALUES (%s, %s, %s)

            ON CONFLICT (date, symbol)
            DO UPDATE SET
                price = EXCLUDED.price;
            """,
            (
                row["date"],
                row["symbol"],
                row["price"]
            )
        )

    connection.commit()

    cursor.close()
    connection.close()

    print(f"Processed {len(df)} records for {symbol}")


if __name__ == "__main__":

    cryptocurrencies = [
        ("BTC", "bitcoin"),
        ("ETH", "ethereum"),
        ("SOL", "solana"),
        ("BNB", "binancecoin")
    ]

    for symbol, coin_id in cryptocurrencies:

        save_crypto_data(
            symbol,
            coin_id,
            days=30
        )