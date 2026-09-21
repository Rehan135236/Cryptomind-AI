from .analytics import (
    calculate_metrics,
    compare_cryptocurrencies
)

from .rag import search_documents

from .news import get_crypto_news


def get_crypto_analysis(symbol):
    """
    Get quantitative market analysis
    for one cryptocurrency.
    """

    symbol = symbol.upper()

    metrics = calculate_metrics(
        symbol
    )

    if metrics is None:
        return {
            "error": f"No data found for {symbol}"
        }

    return metrics


def compare_crypto_assets(symbols):
    """
    Compare multiple cryptocurrencies
    using quantitative market analytics.
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


def search_crypto_documents(
    query,
    top_k=3
):
    """
    Search CryptoMind's knowledge base
    for relevant cryptocurrency documents.
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
                    float(match["score"]),
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


if __name__ == "__main__":

    print(
        "\n" + "=" * 60
    )

    print(
        "CRYPTOMIND TOOLS TEST"
    )

    print(
        "=" * 60
    )


    # --------------------------------------------------
    # Market Analysis Tool
    # --------------------------------------------------

    print(
        "\n\nCrypto Analysis Tool:\n"
    )

    btc_result = get_crypto_analysis(
        "BTC"
    )

    print(
        btc_result
    )


    # --------------------------------------------------
    # Crypto Comparison Tool
    # --------------------------------------------------

    print(
        "\n\nCrypto Comparison Tool:\n"
    )

    comparison_result = (
        compare_crypto_assets(
            [
                "BTC",
                "ETH",
                "SOL",
                "BNB"
            ]
        )
    )

    for crypto in comparison_result:

        print(
            crypto
        )


    # --------------------------------------------------
    # RAG Tool
    # --------------------------------------------------

    print(
        "\n\nCrypto RAG Tool:\n"
    )

    rag_result = search_crypto_documents(
        "How does Ethereum secure its network?"
    )

    for document in rag_result:

        print(
            document
        )


    # --------------------------------------------------
    # News Tool
    # --------------------------------------------------

    print(
        "\n\nCrypto News Tool:\n"
    )

    news_result = search_crypto_news(
        limit=5
    )

    for article in news_result:

        print(
            article
        )