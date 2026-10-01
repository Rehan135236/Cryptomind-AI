import pytest
from fastapi.testclient import TestClient
from src.api import app

client = TestClient(app)


def test_research_request_validation():
    # Empty query
    res1 = client.post("/research", json={"query": ""})
    assert res1.status_code == 400
    assert "detail" in res1.json()

    # Whitespace-only query
    res2 = client.post("/research", json={"query": "    "})
    assert res2.status_code == 400

    # Oversized query exceeding 1000 characters
    long_query = "A" * 1050
    res3 = client.post("/research", json={"query": long_query})
    assert res3.status_code == 400

    # Missing query field
    res4 = client.post("/research", json={})
    assert res4.status_code == 400


def test_research_simple_query():
    query = "What is the current Bitcoin price?"
    res = client.post("/research", json={"query": query})
    assert res.status_code == 200
    data = res.json()
    assert "messages" in data or "report" in data or "response" in data or "interpretation" in data


def test_research_complex_query():
    query = "Analyze Bitcoin market performance, risk, and recent news."
    res = client.post("/research", json={"query": query})
    assert res.status_code == 200
    data = res.json()
    assert "messages" in data or "report" in data or "response" in data or "interpretation" in data
