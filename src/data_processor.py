import logging
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("data_processor")


def transform_price_data(data, symbol):

    if not symbol or not isinstance(symbol, str):
        logger.warning(f"Invalid symbol provided: {symbol}")
        return pd.DataFrame(columns=["date", "symbol", "price"])

    if not data or "prices" not in data or not isinstance(data["prices"], list):
        logger.warning(f"Invalid or empty price data payload for symbol: {symbol}")
        return pd.DataFrame(columns=["date", "symbol", "price"])

    prices = data["prices"]

    valid_rows = []
    for observation in prices:
        if not isinstance(observation, (list, tuple)) or len(observation) < 2:
            logger.warning(f"Skipping malformed observation payload for {symbol}: {observation}")
            continue

        ts, price = observation[0], observation[1]

        # Validate timestamp
        if ts is None or not isinstance(ts, (int, float)) or ts <= 0:
            logger.warning(f"Skipping invalid timestamp for {symbol}: {ts}")
            continue

        # Validate price
        if price is None or not isinstance(price, (int, float)) or price <= 0:
            logger.warning(f"Skipping invalid price observation for {symbol}: {price}")
            continue

        valid_rows.append((ts, price))

    if not valid_rows:
        logger.warning(f"No valid observations remaining after filtering for symbol: {symbol}")
        return pd.DataFrame(columns=["date", "symbol", "price"])

    df = pd.DataFrame(
        valid_rows,
        columns=["timestamp", "price"]
    )

    # Convert Unix milliseconds to datetime
    df["date"] = pd.to_datetime(
        df["timestamp"],
        unit="ms"
    )

    # Add cryptocurrency symbol
    df["symbol"] = symbol.strip().upper()

    # Keep required columns
    df = df[["date", "symbol", "price"]]

    # Round price for consistency
    df["price"] = df["price"].round(8)

    # Drop any NaT/NaN just in case
    df = df.dropna(subset=["date", "symbol", "price"])
    df = df[df["price"] > 0]

    return df


if __name__ == "__main__":
    data = {
        "prices": [
            [1786665600000, 63429.17906286841],
            [1786752000000, -100.0],  # Invalid price
            [None, 63000.0],          # Invalid timestamp
            [1786838400000, 63031.04825975698]
        ]
    }

    df = transform_price_data(data, "BTC")
    print(df)