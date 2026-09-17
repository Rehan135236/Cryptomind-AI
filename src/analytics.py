import pandas as pd
from .database import get_engine


def get_crypto_data(symbol):

    engine = get_engine()

    query = """
        SELECT date, symbol, price
        FROM crypto_prices
        WHERE symbol = %(symbol)s
        ORDER BY date;
    """

    df = pd.read_sql(
        query,
        engine,
        params={"symbol": symbol}
    )

    engine.dispose()

    return df


def calculate_metrics(symbol):

    df = get_crypto_data(symbol)

    if df.empty:
        return None

    # Moving averages
    df["ma_7"] = df["price"].rolling(window=7).mean()
    df["ma_30"] = df["price"].rolling(window=30).mean()

    # Current price
    current_price = df["price"].iloc[-1]

    # Basic statistics
    min_price = df["price"].min()
    max_price = df["price"].max()
    average_price = df["price"].mean()

    # Latest moving averages
    moving_average_7d = df["ma_7"].iloc[-1]
    moving_average_30d = df["ma_30"].iloc[-1]

    # 7-day return
    if len(df) >= 8:

        price_7_days_ago = df["price"].iloc[-8]

        return_7d = (
            (current_price - price_7_days_ago)
            / price_7_days_ago
        ) * 100

    else:
        return_7d = None

    # 30-day return
    if len(df) >= 31:

        price_30_days_ago = df["price"].iloc[0]

        return_30d = (
            (current_price - price_30_days_ago)
            / price_30_days_ago
        ) * 100

    else:
        return_30d = None

    # Daily percentage returns
    df["daily_return"] = df["price"].pct_change()

    # Daily volatility
    volatility = df["daily_return"].std()

    # Maximum drawdown
    df["running_peak"] = df["price"].cummax()

    df["drawdown"] = (
        (df["price"] - df["running_peak"])
        / df["running_peak"]
    )

    maximum_drawdown = df["drawdown"].min() * 100

    # Sharpe ratio
    if volatility != 0:

        sharpe_ratio = (
            df["daily_return"].mean()
            / volatility
        )

    else:
        sharpe_ratio = 0

    # Return structured data
    return {
        "symbol": symbol,
        "current_price": round(float(current_price), 2),
        "average_price": round(float(average_price), 2),
        "minimum_price": round(float(min_price), 2),
        "maximum_price": round(float(max_price), 2),
        "moving_average_7d": round(float(moving_average_7d), 2),
        "moving_average_30d": round(float(moving_average_30d), 2),
        "return_7d": round(float(return_7d), 2)
        if return_7d is not None else None,
        "return_30d": round(float(return_30d), 2)
        if return_30d is not None else None,
        "volatility": round(float(volatility * 100), 2),
        "maximum_drawdown": round(float(maximum_drawdown), 2),
        "sharpe_ratio": round(float(sharpe_ratio), 3)
    }


def compare_cryptocurrencies(symbols):

    results = []

    for symbol in symbols:

        metrics = calculate_metrics(symbol)

        if metrics:
            results.append(metrics)

    comparison = pd.DataFrame(results)

    return comparison


if __name__ == "__main__":

    cryptocurrencies = [
        "BTC",
        "ETH",
        "SOL",
        "BNB"
    ]

    comparison = compare_cryptocurrencies(
        cryptocurrencies
    )

    print("\nCrypto Comparison:\n")

    print(
        comparison[
            [
                "symbol",
                "current_price",
                "moving_average_7d",
                "moving_average_30d",
                "return_7d",
                "return_30d",
                "volatility",
                "maximum_drawdown",
                "sharpe_ratio"
            ]
        ].to_string(index=False)
    )