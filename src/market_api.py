import requests


# ============================================================
# COINGECKO API
# ============================================================

HISTORICAL_API_URL = (
    "https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
)

LIVE_PRICE_URL = (
    "https://api.coingecko.com/api/v3/simple/price"
)

COINS_LIST_URL = (
    "https://api.coingecko.com/api/v3/coins/list"
)


# ============================================================
# COMMON COIN SYMBOLS
# ============================================================
# These provide fast resolution for popular cryptocurrencies.
# Unknown cryptocurrencies will be searched automatically.

COMMON_COINS = {

    "BTC": "bitcoin",

    "ETH": "ethereum",

    "SOL": "solana",

    "BNB": "binancecoin",

    "XRP": "ripple",

    "ADA": "cardano",

    "DOGE": "dogecoin",

    "TRX": "tron",

    "AVAX": "avalanche-2",

    "DOT": "polkadot",

    "LINK": "chainlink",

    "MATIC": "matic-network",

    "POL": "polygon-ecosystem-token",

    "LTC": "litecoin",

    "BCH": "bitcoin-cash",

    "ATOM": "cosmos",

    "UNI": "uniswap",

    "XLM": "stellar",

    "ETC": "ethereum-classic",

    "FIL": "filecoin",

    "NEAR": "near",

    "APT": "aptos",

    "ARB": "arbitrum",

    "OP": "optimism",

    "SUI": "sui",

    "AAVE": "aave",

    "ALGO": "algorand",

    "VET": "vechain",

    "ICP": "internet-computer",

    "HBAR": "hedera-hashgraph",

    "MKR": "maker",

    "PEPE": "pepe",

    "SHIB": "shiba-inu"
}


# ============================================================
# RESOLVE SYMBOL → COINGECKO COIN ID
# ============================================================

def resolve_coin_id(symbol):
    """
    Convert a cryptocurrency symbol into
    its CoinGecko coin ID.

    Example:

    BTC -> bitcoin
    ETH -> ethereum
    SOL -> solana

    If the symbol is not in COMMON_COINS,
    CoinGecko's coin list is searched.
    """

    symbol = symbol.upper().strip()

    # Fast lookup for common cryptocurrencies
    if symbol in COMMON_COINS:
        return COMMON_COINS[symbol]

    print(
        f"Searching CoinGecko for symbol: {symbol}"
    )

    response = requests.get(
        COINS_LIST_URL,
        params={
            "include_platform": "false"
        },
        timeout=15
    )

    response.raise_for_status()

    coins = response.json()

    matches = []

    for coin in coins:

        coin_symbol = str(
            coin.get("symbol", "")
        ).upper()

        if coin_symbol == symbol:

            matches.append(
                coin
            )

    if not matches:
        return None

    # Prefer exact symbol matches.
    # CoinGecko can contain multiple coins
    # with the same symbol, so prefer the
    # first established result returned.
    return matches[0].get("id")


# ============================================================
# HISTORICAL CRYPTO PRICES
# ============================================================

def get_historical_prices(
    coin_id,
    days=30
):
    """
    Retrieve historical cryptocurrency prices
    from CoinGecko.
    """

    url = HISTORICAL_API_URL.format(
        coin_id=coin_id
    )

    params = {

        "vs_currency": "usd",

        "days": days,

        "interval": "daily"
    }

    response = requests.get(

        url,

        params=params,

        timeout=10
    )

    response.raise_for_status()

    return response.json()


# ============================================================
# LIVE CRYPTO MARKET PRICE
# ============================================================

def get_live_market_price(symbol):
    """
    Retrieve the current live cryptocurrency
    price and 24-hour change.

    Supports common cryptocurrencies directly
    and automatically searches CoinGecko for
    other symbols.
    """

    symbol = symbol.upper().strip()

    coin_id = resolve_coin_id(
        symbol
    )

    if not coin_id:

        return {
            "error": (
                f"Cryptocurrency '{symbol}' "
                f"could not be found."
            )
        }

    response = requests.get(

        LIVE_PRICE_URL,

        params={

            "ids": coin_id,

            "vs_currencies": "usd",

            "include_24hr_change": "true"
        },

        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    coin_data = data.get(
        coin_id
    )

    if not coin_data:

        return {
            "error": (
                f"No live market data found "
                f"for {symbol}."
            )
        }

    return {

        "symbol": symbol,

        "coin_id": coin_id,

        "current_price": coin_data.get(
            "usd"
        ),

        "change_24h": coin_data.get(
            "usd_24h_change"
        ),

        "source": (
            "CoinGecko live market API"
        )
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print(
        "\n"
        + "=" * 60
    )

    print(
        "CRYPTOMIND LIVE MARKET API TEST"
    )

    print(
        "=" * 60
    )

    cryptocurrencies = [

        "BTC",

        "ETH",

        "SOL",

        "BNB",

        "XRP"
    ]

    for symbol in cryptocurrencies:

        print(
            f"\nFetching {symbol}..."
        )

        result = get_live_market_price(
            symbol
        )

        print(result)