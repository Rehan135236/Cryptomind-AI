import unittest
from fastapi.testclient import TestClient

from src.api import app, rate_limiter
from src.config import redact_secret, sanitize_log_message, validate_config

client = TestClient(app)


class TestApiHardeningAndSecurity(unittest.TestCase):

    def setUp(self):
        with rate_limiter._lock:
            rate_limiter._requests.clear()

    def test_01_request_id_and_security_headers(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("X-Request-ID", response.headers)
        self.assertIn("X-Response-Time-Ms", response.headers)
        
        # Production Security Headers
        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(response.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")

        # Passing custom X-Request-ID
        custom_id = "custom-test-request-id-12345"
        res_custom = client.get("/", headers={"X-Request-ID": custom_id})
        self.assertEqual(res_custom.status_code, 200)
        self.assertEqual(res_custom.headers.get("X-Request-ID"), custom_id)

    def test_02_rate_limiting_trigger(self):
        for key in ["general:testclient", "general:127.0.0.1"]:
            for _ in range(75):
                rate_limiter.is_allowed(key, max_requests=60, window_seconds=60)

        response = client.get("/")
        self.assertEqual(response.status_code, 429)
        data = response.json()
        self.assertIn("Rate limit exceeded", data["detail"])
        self.assertIn("Retry-After", response.headers)

        rate_limiter._requests.clear()


    def test_03_no_stack_trace_exposure(self):
        response = client.get("/invalid_path_xyz")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertNotIn("traceback", data)
        self.assertNotIn("Traceback", data.get("detail", ""))

    def test_04_secret_redaction_utilities(self):
        raw_secret = "gsk_sample_dummy_secret_key_for_testing_purposes_ExK"
        redacted = redact_secret(raw_secret)
        self.assertTrue(redacted.startswith("gsk_"))
        self.assertTrue(redacted.endswith("ExK"))
        self.assertNotIn(raw_secret, redacted)


        log_msg = f"Connected using key {raw_secret} to database postgresql://user:my_secret_pass@localhost:5432/db"
        sanitized = sanitize_log_message(log_msg)
        self.assertNotIn(raw_secret, sanitized)
        self.assertNotIn("my_secret_pass", sanitized)
        self.assertIn("://user:****@", sanitized)

    def test_05_config_validation(self):
        status = validate_config()
        self.assertIsInstance(status, dict)
        self.assertIn("DATABASE_URL", status)
        self.assertIn("GROQ_API_KEY", status)
        self.assertIn("HF_TOKEN", status)
        self.assertIn("PINECONE_API_KEY", status)


if __name__ == "__main__":
    unittest.main()
