import requests


API_URL = "https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"


def get_historical_prices(coin_id, days=30):

    url = API_URL.format(coin_id=coin_id)

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


if __name__ == "__main__":

    data = get_historical_prices("bitcoin", days=30)

    prices = data["prices"]

    print(f"Number of price records: {len(prices)}")

    print("\nFirst 5 records:")

    for record in prices[:5]:
        timestamp = record[0]
        price = record[1]

        print(timestamp, price)