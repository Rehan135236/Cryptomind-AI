# ============================================================
# CRYPTOMIND TOOLS
# ============================================================

from .analytics import (
    calculate_metrics,
    compare_cryptocurrencies
)

from .rag import (
    search_documents
)

from .news import (
    get_crypto_news
)

from .market_api import (
    get_live_market_price
)


# ============================================================
# HISTORICAL CRYPTO ANALYSIS
# ============================================================

def get_crypto_analysis(symbol):
    """
    Retrieve historical cryptocurrency
    market analysis from PostgreSQL.
    """

    symbol = symbol.upper()

    metrics = calculate_metrics(
        symbol
    )

    if metrics is None:

        return {
            "error": (
                f"No data found for {symbol}"
            )
        }

    return metrics


# ============================================================
# LIVE CRYPTO MARKET PRICE
# ============================================================

def get_live_crypto_price(symbol):
    """
    Retrieve the current live cryptocurrency
    price and 24-hour percentage change.

    Data source:
    CoinGecko live market API.
    """

    symbol = symbol.upper()

    return get_live_market_price(
        symbol
    )


# ============================================================
# CRYPTOCURRENCY COMPARISON
# ============================================================

def compare_crypto_assets(symbols):
    """
    Compare multiple cryptocurrencies using
    historical quantitative market metrics.
    """

    symbols = [
        symbol.upper()
        for symbol in symbols
    ]

    comparison = compare_cryptocurrencies(
        symbols
    )

    if comparison.empty:

        return {
            "error": (
                "No data found for the "
                "requested cryptocurrencies."
            )
        }

    return comparison.to_dict(
        orient="records"
    )


# ============================================================
# RAG DOCUMENT SEARCH
# ============================================================

def search_crypto_documents(
    query,
    top_k=3
):
    """
    Search the CryptoMind RAG knowledge base
    for relevant cryptocurrency information.
    """

    results = search_documents(
        query,
        top_k=top_k
    )

    documents = []

    for match in results["matches"]:

        metadata = match.get(
            "metadata",
            {}
        )

        documents.append(
            {
                "score": round(
                    float(
                        match["score"]
                    ),
                    4
                ),

                "source": metadata.get(
                    "source",
                    "Unknown"
                ),

                "chunk_id": metadata.get(
                    "chunk_id",
                    "N/A"
                ),

                "text": metadata.get(
                    "text",
                    ""
                )
            }
        )

    return documents


# ============================================================
# CRYPTO NEWS SEARCH
# ============================================================

def search_crypto_news(
    symbol=None,
    limit=10
):
    """
    Retrieve recent cryptocurrency news.

    If a symbol is provided, return only
    news relevant to that cryptocurrency.
    """

    if symbol:

        symbol = symbol.upper()

    articles = get_crypto_news(
        symbol=symbol,
        limit_per_source=5,
        max_results=limit
    )

    return articles


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print(
        "\n"
        + "=" * 60
    )

    print(
        "CRYPTOMIND TOOLS TEST"
    )

    print(
        "=" * 60
    )

    # --------------------------------------------------------
    # LIVE PRICE TEST
    # --------------------------------------------------------

    print(
        "\nTesting live Bitcoin price..."
    )

    live_price = get_live_crypto_price(
        "BTC"
    )

    print(
        "\nLive market result:"
    )

    print(
        live_price
    )

    # --------------------------------------------------------
    # HISTORICAL ANALYSIS TEST
    # --------------------------------------------------------

    print(
        "\nTesting historical Bitcoin analysis..."
    )

    analysis = get_crypto_analysis(
        "BTC"
    )

    print(
        "\nHistorical analysis:"
    )

    print(
        analysis
    )

    # --------------------------------------------------------
    # NEWS TEST
    # --------------------------------------------------------

    print(
        "\nTesting Bitcoin news..."
    )

    news = search_crypto_news(
        symbol="BTC",
        limit=3
    )

    print(
        f"\nNews articles found: {len(news)}"
    )

    for article in news:

        print(
            "\n"
            + "-" * 60
        )

        print(
            f"Source: "
            f"{article.get('source')}"
        )

        print(
            f"Title: "
            f"{article.get('title')}"
        )

    print(
        "\n"
        + "=" * 60
    )

    print(
        "TOOLS TEST COMPLETED"
    )

    print(
        "=" * 60
    )