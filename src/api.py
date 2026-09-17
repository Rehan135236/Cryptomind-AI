from fastapi import FastAPI, HTTPException

from .analytics import (
    calculate_metrics,
    compare_cryptocurrencies
)

from .correlation import calculate_correlation


app = FastAPI(
    title="CryptoMind API",
    description="API for crypto market data and analytics",
    version="1.0.0"
)


@app.get("/")
def root():

    return {
        "message": "CryptoMind API is running!"
    }


@app.get("/crypto/{symbol}")
def get_crypto_analysis(symbol: str):

    symbol = symbol.upper()

    metrics = calculate_metrics(symbol)

    if metrics is None:

        raise HTTPException(
            status_code=404,
            detail=f"No data found for {symbol}"
        )

    return metrics


@app.get("/compare")
def compare_crypto():

    cryptocurrencies = [
        "BTC",
        "ETH",
        "SOL",
        "BNB"
    ]

    comparison = compare_cryptocurrencies(
        cryptocurrencies
    )

    return comparison.to_dict(
        orient="records"
    )


@app.get("/correlation")
def crypto_correlation():

    correlation = calculate_correlation()

    return correlation.to_dict()