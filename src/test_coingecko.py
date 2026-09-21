import os

import requests
from dotenv import load_dotenv


load_dotenv()

API_KEY = os.getenv(
    "COINGECKO_API_KEY"
)

URL = (
    "https://api.coingecko.com/api/v3/"
    "ping"
)

headers = {
    "x-cg-demo-api-key": API_KEY
}


response = requests.get(
    URL,
    headers=headers,
    timeout=10
)


print(
    "Status code:",
    response.status_code
)

print(
    "Response:"
)

print(
    response.text
)