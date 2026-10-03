import os
import requests
from dotenv import load_dotenv

load_dotenv()

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

HISTORICAL_API_URL = "https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
LIVE_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price"
COINS_LIST_URL = "https://api.coingecko.com/api/v3/coins/list"

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
    "SHIB": "shiba-inu",
}


def get_headers():
    headers = {
        "User-Agent": "CryptoMind/1.0 (Python/FastAPI)",
        "Accept": "application/json",
    }
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    return headers


def resolve_coin_id(symbol):
    symbol = symbol.upper().strip()

    if symbol in COMMON_COINS:
        return COMMON_COINS[symbol]

    try:
        response = requests.get(
            COINS_LIST_URL,
            params={"include_platform": "false"},
            headers=get_headers(),
            timeout=15,
        )
        response.raise_for_status()
        coins = response.json()

        matches = []
        for coin in coins:
            coin_symbol = str(coin.get("symbol", "")).upper()
            if coin_symbol == symbol:
                matches.append(coin)

        if not matches:
            return None

        return matches[0].get("id")
    except Exception as err:
        print(f"Failed to resolve coin ID for {symbol}: {err}")
        return None


def get_historical_prices(coin_id, days=30):
    url = HISTORICAL_API_URL.format(coin_id=coin_id)
    params = {
        "vs_currency": "usd",
        "days": days,
        "interval": "daily",
    }

    response = requests.get(
        url,
        params=params,
        headers=get_headers(),
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def get_live_market_price(symbol):
    symbol = symbol.upper().strip()
    coin_id = resolve_coin_id(symbol)

    if coin_id:
        try:
            response = requests.get(
                LIVE_PRICE_URL,
                params={
                    "ids": coin_id,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                },
                headers=get_headers(),
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                coin_data = data.get(coin_id)
                if coin_data and "usd" in coin_data:
                    return {
                        "symbol": symbol,
                        "coin_id": coin_id,
                        "current_price": coin_data.get("usd"),
                        "change_24h": coin_data.get("usd_24h_change"),
                        "source": "CoinGecko live market API",
                    }
        except requests.RequestException as err:
            print(f"CoinGecko live API request warning for {symbol}: {err}")

    # Fallback to historical database snapshot if live market API is rate-limited or unavailable
    try:
        from .analytics import calculate_metrics
        metrics = calculate_metrics(symbol)
        if metrics and "current_price" in metrics:
            return {
                "symbol": symbol,
                "coin_id": coin_id or symbol.lower(),
                "current_price": metrics["current_price"],
                "change_24h": metrics.get("return_7d"),
                "source": "Historical database snapshot (CoinGecko fallback)",
            }
    except Exception as db_err:
        print(f"Database fallback failed for {symbol}: {db_err}")

    return {
        "error": f"Live market price currently unavailable for symbol '{symbol}'."
    }


if __name__ == "__main__":
    for s in ["BTC", "ETH", "SOL"]:
        print(get_live_market_price(s))