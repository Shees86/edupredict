import unittest
from io import BytesIO
from unittest.mock import patch

from flask import send_file


class SecurityHeadersTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch("db.init_indexes"), patch("db.migrate_legacy_defaults"):
            import app as app_module

        cls.app = app_module.app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()
        cls.app.add_url_rule(
            "/_test/download",
            "security_header_test_download",
            lambda: send_file(
                BytesIO(b"report"),
                as_attachment=True,
                download_name="report.csv",
            ),
        )

    def assert_security_headers(self, response):
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        self.assertEqual(
            response.headers["Strict-Transport-Security"],
            "max-age=31536000; includeSubDomains",
        )
        self.assertEqual(response.headers["Referrer-Policy"], "no-referrer")
        self.assertEqual(
            response.headers["Content-Security-Policy"],
            "default-src 'none'; frame-ancestors 'none'",
        )

    def test_api_response_includes_security_headers(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assert_security_headers(response)

    def test_error_response_includes_security_headers(self):
        response = self.client.get("/missing-route")

        self.assertEqual(response.status_code, 404)
        self.assert_security_headers(response)

    def test_sse_response_keeps_event_stream_headers(self):
        with self.client.session_transaction() as session:
            session["user"] = {"username": "alice", "role": "admin"}

        with patch("blueprints.alerts.db.list_alerts", return_value=[]), patch(
            "blueprints.alerts._STREAM_MAX_SECONDS", 0
        ):
            response = self.client.get("/api/alerts/stream")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "text/event-stream")
        self.assertEqual(response.headers["Cache-Control"], "no-cache")
        self.assert_security_headers(response)

    def test_download_keeps_attachment_headers(self):
        response = self.client.get("/_test/download")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Content-Disposition"],
            "attachment; filename=report.csv",
        )
        self.assertEqual(response.data, b"report")
        self.assert_security_headers(response)


if __name__ == "__main__":
    unittest.main()
