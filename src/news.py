import requests
import xml.etree.ElementTree as ET


RSS_FEEDS = {
    "CoinDesk": "https://www.coindesk.com/arc/outboundfeeds/rss",
    "CoinTelegraph": "https://cointelegraph.com/rss",
    "Decrypt": "https://decrypt.co/feed",
    "CryptoSlate": "https://cryptoslate.com/feed/",
    "BitcoinMagazine": "https://bitcoinmagazine.com/.rss/full/",
}


CRYPTO_KEYWORDS = {
    "BTC": [
        "bitcoin",
        "btc",
    ],
    "ETH": [
        "ethereum",
        "ether",
        "eth",
    ],
    "SOL": [
        "solana",
        "sol",
    ],
    "BNB": [
        "bnb",
        "binance coin",
        "binancecoin",
        "binance",
    ],
}


def get_feed(source, url, limit=5):

    response = requests.get(
        url,
        timeout=15,
        headers={
            "User-Agent": "CryptoMind/1.0"
        }
    )

    response.raise_for_status()

    root = ET.fromstring(
        response.content
    )

    articles = []

    for item in root.findall(".//item"):

        title = item.findtext(
            "title",
            default=""
        )

        link = item.findtext(
            "link",
            default=""
        )

        published = item.findtext(
            "pubDate",
            default=""
        )

        description = item.findtext(
            "description",
            default=""
        )

        articles.append(
            {
                "source": source,
                "title": title,
                "link": link,
                "published": published,
                "description": description
            }
        )

        if len(articles) >= limit:
            break

    return articles


def article_matches_crypto(
    article,
    symbol
):
    """
    Check whether an article is relevant
    to the requested cryptocurrency.
    """

    # If no cryptocurrency was requested,
    # allow all articles.
    if symbol is None:
        return True

    symbol = symbol.upper()

    # If the symbol is not in our known
    # cryptocurrency list, allow the article.
    if symbol not in CRYPTO_KEYWORDS:
        return True

    keywords = CRYPTO_KEYWORDS[symbol]

    searchable_text = " ".join(
        [
            article.get("title", ""),
            article.get("description", "")
        ]
    ).lower()

    for keyword in keywords:

        if keyword.lower() in searchable_text:
            return True

    return False


def get_crypto_news(
    symbol=None,
    limit_per_source=5,
    max_results=10
):
    """
    Retrieve recent cryptocurrency news.

    If symbol is provided, only articles relevant
    to that cryptocurrency are returned.

    Examples:

        get_crypto_news("BTC")

        get_crypto_news("ETH")

        get_crypto_news("SOL")

        get_crypto_news("BNB")

        get_crypto_news()
    """

    all_articles = []

    for source, url in RSS_FEEDS.items():

        try:

            print(
                f"Fetching {source}..."
            )

            articles = get_feed(
                source,
                url,
                limit_per_source
            )

            print(
                f"  Retrieved "
                f"{len(articles)} articles"
            )

            for article in articles:

                if article_matches_crypto(
                    article,
                    symbol
                ):

                    all_articles.append(
                        article
                    )

        except Exception as error:

            print(
                f"  Failed: {error}"
            )

    return all_articles[:max_results]


if __name__ == "__main__":

    print(
        "\n" + "=" * 60
    )

    print(
        "CRYPTOMIND CRYPTO NEWS TEST"
    )

    print(
        "=" * 60
    )

    print(
        "\nTesting Bitcoin news...\n"
    )

    bitcoin_news = get_crypto_news(
        symbol="BTC",
        limit_per_source=5,
        max_results=10
    )

    print(
        f"\nBitcoin articles found: "
        f"{len(bitcoin_news)}"
    )

    for i, article in enumerate(
        bitcoin_news,
        start=1
    ):

        print(
            "\n" + "-" * 60
        )

        print(
            f"NEWS {i}"
        )

        print(
            f"Source: "
            f"{article['source']}"
        )

        print(
            f"Title: "
            f"{article['title']}"
        )

        print(
            f"Published: "
            f"{article['published']}"
        )

        print(
            f"Link: "
            f"{article['link']}"
        )

        print(
            f"Description: "
            f"{article['description']}"
        )