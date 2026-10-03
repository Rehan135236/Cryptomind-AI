import sys
import unittest
from fastapi.testclient import TestClient

from src.api import app, rate_limiter
from src.config import TRACKED_ASSETS
from tests.test_rag_ingestion import TestRagIngestionArchitecture

client = TestClient(app)
ALL_SYMBOLS = [s for s, _ in TRACKED_ASSETS]


class TestFastApiProductionHardening(unittest.TestCase):

    def setUp(self):
        # Clear rate limiter before each test
        with rate_limiter._lock:
            rate_limiter._requests.clear()

    def test_01_root_and_health_endpoints(self):
        # GET /
        res_root = client.get("/")
        self.assertEqual(res_root.status_code, 200)
        self.assertEqual(res_root.json()["status"], "ok")
        self.assertIn("X-Request-ID", res_root.headers)
        self.assertIn("X-Response-Time-Ms", res_root.headers)

        # GET /health
        res_health = client.get("/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["status"], "ok")

        # GET /health/db
        res_db = client.get("/health/db")
        self.assertEqual(res_db.status_code, 200)
        self.assertEqual(res_db.json()["status"], "ok")
        self.assertEqual(res_db.json()["database"], "ok")
        self.assertGreater(res_db.json()["total_records"], 0)

    def test_02_symbols_and_tracked_assets(self):
        # GET /crypto/symbols
        res_sym = client.get("/crypto/symbols")
        self.assertEqual(res_sym.status_code, 200)
        self.assertEqual(res_sym.json()["count"], 16)
        self.assertEqual(set(res_sym.json()["symbols"]), set(ALL_SYMBOLS))

        # Test all 16 tracked assets metrics and history
        for symbol in ALL_SYMBOLS:
            res_m = client.get(f"/crypto/{symbol}")
            self.assertEqual(res_m.status_code, 200, f"Metrics failed for {symbol}")
            self.assertEqual(res_m.json()["symbol"], symbol)

            res_h = client.get(f"/crypto/{symbol}/history")
            self.assertEqual(res_h.status_code, 200, f"History failed for {symbol}")
            self.assertEqual(res_h.json()["symbol"], symbol)

        # Test invalid symbol
        res_inv = client.get("/crypto/INVALID_SYMBOL_XYZ")
        self.assertEqual(res_inv.status_code, 404)
        self.assertIn("detail", res_inv.json())

    def test_03_compare_and_correlation(self):
        combos = ["BTC,ETH", "BTC,ETH,XRP", "BTC,SOL,DOGE", "BTC,LINK,DOT,AVAX"]
        for combo in combos:
            res_comp = client.get(f"/compare?symbols={combo}")
            self.assertEqual(res_comp.status_code, 200)
            self.assertEqual(len(res_comp.json()), len(combo.split(",")))

            res_corr = client.get(f"/correlation?symbols={combo}")
            self.assertEqual(res_corr.status_code, 200)
            self.assertEqual(set(res_corr.json().keys()), set(combo.split(",")))

    def test_04_news_endpoint(self):
        res_news = client.get("/news?symbol=BTC&limit=5")
        self.assertEqual(res_news.status_code, 200)
        self.assertIn("articles", res_news.json())
        self.assertLessEqual(len(res_news.json()["articles"]), 5)

    def test_05_research_validation(self):
        # Empty query
        res1 = client.post("/research", json={"query": ""})
        self.assertEqual(res1.status_code, 400)

        # Whitespace-only query
        res2 = client.post("/research", json={"query": "    "})
        self.assertEqual(res2.status_code, 400)

        # Oversized query
        res3 = client.post("/research", json={"query": "A" * 1050})
        self.assertEqual(res3.status_code, 400)

    def test_06_research_simple_and_complex(self):
        # Simple query
        res_simple = client.post("/research", json={"query": "What is the current Bitcoin price?"})
        self.assertEqual(res_simple.status_code, 200)
        data_s = res_simple.json()
        self.assertTrue("messages" in data_s or "report" in data_s or "response" in data_s or "interpretation" in data_s)

        # Complex query
        res_complex = client.post("/research", json={"query": "Analyze Bitcoin market performance, risk, and recent news."})
        self.assertEqual(res_complex.status_code, 200)
        data_c = res_complex.json()
        self.assertTrue("messages" in data_c or "report" in data_c or "response" in data_c or "interpretation" in data_c)

    def test_07_hardening_rate_limiting_and_headers(self):
        # Custom request ID
        res_custom = client.get("/", headers={"X-Request-ID": "custom-id-9999"})
        self.assertEqual(res_custom.headers.get("X-Request-ID"), "custom-id-9999")

        # Rate limit trigger for TestClient
        for key in ["general:testclient", "general:127.0.0.1"]:
            for _ in range(70):
                rate_limiter.is_allowed(key, max_requests=60, window_seconds=60)

        res_rl = client.get("/")
        self.assertEqual(res_rl.status_code, 429)
        self.assertIn("Retry-After", res_rl.headers)

    def test_08_ingestion_status_and_freshness_endpoints(self):
        res = client.get("/ingestion/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("scheduler", data)
        self.assertIn("last_run", data)
        self.assertIn("data_freshness", data)
        self.assertTrue(data["scheduler"]["enabled"])

    def test_09_ingestion_cycle_execution_and_idempotency(self):
        from src.pipeline import execute_ingestion_cycle
        from src.database import get_db_connection

        # Execute ingestion cycle
        result = execute_ingestion_cycle(mode="incremental")
        self.assertIn(result["status"], ["success", "partial_success"])

        # Idempotency SQL check
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT symbol, date, COUNT(*)
                FROM crypto_prices
                GROUP BY symbol, date
                HAVING COUNT(*) > 1;
            """)
            dupes = cursor.fetchall()
            cursor.close()

        self.assertEqual(len(dupes), 0, f"Found duplicate records: {dupes}")


if __name__ == "__main__":
    unittest.main()
