import pytest
from fastapi.testclient import TestClient
from src.api import app
from src.config import TRACKED_ASSETS

client = TestClient(app)
ALL_SYMBOLS = [s for s, _ in TRACKED_ASSETS]


def test_get_available_symbols():
    response = client.get("/crypto/symbols")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 16
    assert set(data["symbols"]) == set(ALL_SYMBOLS)


def test_all_16_tracked_assets_metrics_and_history():
    for symbol in ALL_SYMBOLS:
        # Test metrics
        res_m = client.get(f"/crypto/{symbol}")
        assert res_m.status_code == 200, f"Failed for symbol {symbol}"
        m_data = res_m.json()
        assert m_data["symbol"] == symbol
        assert m_data["current_price"] > 0
        assert m_data["average_price"] > 0

        # Test history
        res_h = client.get(f"/crypto/{symbol}/history")
        assert res_h.status_code == 200, f"History failed for symbol {symbol}"
        h_data = res_h.json()
        assert h_data["symbol"] == symbol
        assert len(h_data["data"]) > 0


def test_invalid_crypto_symbol():
    res = client.get("/crypto/NONEXISTENT_ASSET_123")
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data
    assert "NONEXISTENT_ASSET_123" in data["detail"]


def test_compare_endpoint_combinations():
    combinations = [
        "BTC,ETH",
        "BTC,ETH,XRP",
        "BTC,SOL,DOGE",
        "BTC,LINK,DOT,AVAX",
    ]
    for combo in combinations:
        res = client.get(f"/compare?symbols={combo}")
        assert res.status_code == 200
        data = res.json()
        expected_len = len(combo.split(","))
        assert len(data) == expected_len


def test_correlation_endpoint_combinations():
    combinations = [
        "BTC,ETH",
        "BTC,ETH,XRP",
        "BTC,SOL,DOGE",
        "BTC,LINK,DOT,AVAX",
    ]
    for combo in combinations:
        res = client.get(f"/correlation?symbols={combo}")
        assert res.status_code == 200
        data = res.json()
        expected_symbols = set(combo.split(","))
        assert set(data.keys()) == expected_symbols


def test_news_endpoint():
    res = client.get("/news?symbol=BTC&limit=5")
    assert res.status_code == 200
    data = res.json()
    assert "articles" in data
    assert len(data["articles"]) <= 5
