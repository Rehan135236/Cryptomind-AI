from .analytics import (
    calculate_metrics,
    compare_cryptocurrencies
)


def get_crypto_analysis(symbol):

    symbol = symbol.upper()

    metrics = calculate_metrics(symbol)

    if metrics is None:
        return {
            "error": f"No data found for {symbol}"
        }

    return metrics


def compare_crypto_assets(symbols):

    # Convert symbols to uppercase
    symbols = [
        symbol.upper()
        for symbol in symbols
    ]

    comparison = compare_cryptocurrencies(
        symbols
    )

    if comparison.empty:
        return {
            "error": "No data found for the requested cryptocurrencies."
        }

    return comparison.to_dict(
        orient="records"
    )


if __name__ == "__main__":

    print("\nCrypto Analysis Tool:\n")

    btc_result = get_crypto_analysis("BTC")

    print(btc_result)

    print("\nCrypto Comparison Tool:\n")

    comparison_result = compare_crypto_assets(
        ["BTC", "ETH", "SOL", "BNB"]
    )

    for crypto in comparison_result:
        print(crypto)