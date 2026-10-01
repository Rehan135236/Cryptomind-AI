import pytest
from fastapi.testclient import TestClient
from src.api import app, rate_limiter

client = TestClient(app)


def test_request_id_and_timing_headers():
    response = client.get("/")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Response-Time-Ms" in response.headers

    # Passing custom X-Request-ID
    custom_id = "custom-test-request-id-12345"
    res_custom = client.get("/", headers={"X-Request-ID": custom_id})
    assert res_custom.status_code == 200
    assert res_custom.headers.get("X-Request-ID") == custom_id


def test_rate_limiting_trigger():
    test_key = "general:127.0.0.1"
    # Artificially fill rate limiter bucket for client IP
    for _ in range(75):
        rate_limiter.is_allowed(test_key, max_requests=60, window_seconds=60)

    # Next request should trigger 429 Too Many Requests
    response = client.get("/")
    assert response.status_code == 429
    data = response.json()
    assert "Rate limit exceeded" in data["detail"]
    assert "Retry-After" in response.headers

    # Reset rate limiter after test
    rate_limiter._requests.clear()


def test_no_stack_trace_exposure():
    # Attempt requesting non-existent endpoint to check 404 handler
    response = client.get("/invalid_path_xyz")
    assert response.status_code == 404
    data = response.json()
    assert "traceback" not in data
    assert "Traceback" not in data.get("detail", "")
