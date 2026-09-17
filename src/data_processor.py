import pandas as pd


def transform_price_data(data, symbol):

    prices = data["prices"]

    df = pd.DataFrame(
        prices,
        columns=["timestamp", "price"]
    )

    # Convert Unix milliseconds to datetime
    df["date"] = pd.to_datetime(
        df["timestamp"],
        unit="ms"
    )

    # Add cryptocurrency symbol
    df["symbol"] = symbol.upper()

    # Keep only the columns we need
    df = df[
        ["date", "symbol", "price"]
    ]

    # Round price
    df["price"] = df["price"].round(2)

    return df


if __name__ == "__main__":

    # Test data
    data = {
        "prices": [
            [1786665600000, 63429.17906286841],
            [1786752000000, 62984.28959582886],
            [1786838400000, 63031.04825975698]
        ]
    }

    df = transform_price_data(
        data,
        "BTC"
    )

    print(df)