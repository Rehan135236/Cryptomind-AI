import pandas as pd

from .database import get_engine


# ============================================================
# GET CRYPTO DATA
# ============================================================

def get_crypto_data(symbol):

    engine = get_engine()

    query = """
        SELECT
            date,
            symbol,
            price
        FROM crypto_prices
        WHERE symbol = %(symbol)s
        ORDER BY date;
    """

    df = pd.read_sql(
        query,
        engine,
        params={
            "symbol": symbol
        }
    )

    engine.dispose()

    return df


# ============================================================
# CALCULATE CRYPTO METRICS
# ============================================================

def calculate_metrics(symbol):

    symbol = symbol.upper()

    df = get_crypto_data(
        symbol
    )

    if df.empty:
        return None

    # --------------------------------------------------------
    # PRICE MOVING AVERAGES
    # --------------------------------------------------------

    df["ma_7"] = (
        df["price"]
        .rolling(window=7)
        .mean()
    )

    df["ma_30"] = (
        df["price"]
        .rolling(window=30)
        .mean()
    )

    # --------------------------------------------------------
    # BASIC PRICE STATISTICS
    # --------------------------------------------------------

    current_price = (
        df["price"].iloc[-1]
    )

    min_price = (
        df["price"].min()
    )

    max_price = (
        df["price"].max()
    )

    average_price = (
        df["price"].mean()
    )

    moving_average_7d = (
        df["ma_7"].iloc[-1]
    )

    moving_average_30d = (
        df["ma_30"].iloc[-1]
    )

    # --------------------------------------------------------
    # 7-DAY RETURN
    # --------------------------------------------------------

    if len(df) >= 8:

        price_7_days_ago = (
            df["price"].iloc[-8]
        )

        return_7d = (
            (
                current_price
                - price_7_days_ago
            )
            / price_7_days_ago
        ) * 100

    else:

        return_7d = None

    # --------------------------------------------------------
    # DATABASE-PERIOD RETURN
    # --------------------------------------------------------
    #
    # Instead of calling this "30-day return",
    # calculate the actual period using the
    # first and last observations.
    #
    # This avoids assuming that the database
    # contains exactly 30 calendar days.
    # --------------------------------------------------------

    first_price = (
        df["price"].iloc[0]
    )

    return_period = (
        (
            current_price
            - first_price
        )
        / first_price
    ) * 100

    period_start = (
        df["date"].iloc[0]
    )

    period_end = (
        df["date"].iloc[-1]
    )

    period_days = (
        period_end
        - period_start
    ).total_seconds() / 86400

    # --------------------------------------------------------
    # DAILY RETURNS
    # --------------------------------------------------------

    df["daily_return"] = (
        df["price"]
        .pct_change()
    )

    # --------------------------------------------------------
    # DAILY VOLATILITY
    # --------------------------------------------------------
    #
    # Standard deviation of daily returns.
    #
    # This is NOT annualized volatility.
    # --------------------------------------------------------

    daily_volatility = (
        df["daily_return"].std()
    )

    # --------------------------------------------------------
    # MAXIMUM DRAWDOWN
    # --------------------------------------------------------

    df["running_peak"] = (
        df["price"].cummax()
    )

    df["drawdown"] = (
        (
            df["price"]
            - df["running_peak"]
        )
        / df["running_peak"]
    )

    maximum_drawdown = (
        df["drawdown"].min()
        * 100
    )

    # --------------------------------------------------------
    # DAILY SHARPE-LIKE RATIO
    # --------------------------------------------------------
    #
    # This is based on daily returns and does
    # NOT use annualization or a risk-free rate.
    #
    # Therefore we explicitly call it a
    # daily Sharpe-like ratio.
    # --------------------------------------------------------

    if daily_volatility != 0:

        daily_sharpe_ratio = (
            df["daily_return"].mean()
            / daily_volatility
        )

    else:

        daily_sharpe_ratio = 0

    # --------------------------------------------------------
    # RETURN RESULTS
    # --------------------------------------------------------

    return {

        "symbol": symbol,

        "current_price": round(
            float(current_price),
            2
        ),

        "average_price": round(
            float(average_price),
            2
        ),

        "minimum_price": round(
            float(min_price),
            2
        ),

        "maximum_price": round(
            float(max_price),
            2
        ),

        "moving_average_7d": round(
            float(moving_average_7d),
            2
        ),

        "moving_average_30d": round(
            float(moving_average_30d),
            2
        ),

        "return_7d": round(
            float(return_7d),
            2
        )
        if return_7d is not None
        else None,

        "return_period": round(
            float(return_period),
            2
        ),

        "period_start": (
            period_start.isoformat()
        ),

        "period_end": (
            period_end.isoformat()
        ),

        "period_days": round(
            float(period_days),
            2
        ),

        "daily_volatility": round(
            float(
                daily_volatility * 100
            ),
            2
        ),

        "maximum_drawdown": round(
            float(maximum_drawdown),
            2
        ),

        "daily_sharpe_ratio": round(
            float(daily_sharpe_ratio),
            3
        )
    }


# ============================================================
# COMPARE CRYPTOCURRENCIES
# ============================================================

def compare_cryptocurrencies(symbols):

    results = []

    for symbol in symbols:

        metrics = calculate_metrics(
            symbol
        )

        if metrics:

            results.append(
                metrics
            )

    comparison = pd.DataFrame(
        results
    )

    return comparison


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    cryptocurrencies = [
        "BTC",
        "ETH",
        "SOL",
        "BNB"
    ]

    comparison = (
        compare_cryptocurrencies(
            cryptocurrencies
        )
    )

    print(
        "\nCrypto Comparison:\n"
    )

    print(
        comparison[
            [
                "symbol",
                "current_price",
                "moving_average_7d",
                "moving_average_30d",
                "return_7d",
                "return_period",
                "period_days",
                "daily_volatility",
                "maximum_drawdown",
                "daily_sharpe_ratio"
            ]
        ].to_string(
            index=False
        )
    )