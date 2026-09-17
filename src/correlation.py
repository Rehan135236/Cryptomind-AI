import pandas as pd

from .database import get_engine


def get_all_crypto_data():

    engine = get_engine()

    query = """
        SELECT date, symbol, price
        FROM crypto_prices
        ORDER BY date;
    """

    df = pd.read_sql(
        query,
        engine
    )

    engine.dispose()

    return df


def calculate_correlation():

    df = get_all_crypto_data()

    # Convert rows into columns
    price_data = df.pivot(
        index="date",
        columns="symbol",
        values="price"
    )

    # Calculate daily percentage returns
    returns = price_data.pct_change(
        fill_method=None
    )

    # Calculate correlation matrix
    correlation_matrix = returns.corr()

    return correlation_matrix


if __name__ == "__main__":

    correlation = calculate_correlation()

    print("\nCrypto Correlation Matrix:\n")

    print(
        correlation.round(3).to_string()
    )