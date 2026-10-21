import os
import unittest
from unittest.mock import patch

from flask import Flask
from blueprints.auth import auth_bp
from password_policy import PASSWORD_POLICY_ERROR, validate_password


class PasswordPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = Flask(__name__)
        cls.app.secret_key = "password-policy-test-key"
        cls.app.config["TESTING"] = True
        cls.app.register_blueprint(auth_bp)
        cls.client = cls.app.test_client()

    def setUp(self):
        from extensions import _rate_limit_hits

        _rate_limit_hits.clear()

    def assert_password_rejected(self, response):
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], PASSWORD_POLICY_ERROR)

    def test_shared_validator_accepts_and_rejects_policy_boundaries(self):
        self.assertIsNone(validate_password("Abcdefghi1"))
        for password in ("Abcdefg1", "Abcdefghij", "1234567890", None):
            with self.subTest(password=password):
                self.assertEqual(validate_password(password), PASSWORD_POLICY_ERROR)

    @patch("blueprints.auth.db.log_action")
    @patch("blueprints.auth.db.create_user", return_value=("user-id", None))
    def test_signup_accepts_and_rejects_passwords(self, create_user, log_action):
        valid = self.client.post(
            "/api/auth/register",
            json={"username": "teacher", "password": "Abcdefghi1", "role": "teacher"},
        )
        self.assertEqual(valid.status_code, 201)
        create_user.assert_called_once()

        create_user.reset_mock()
        for password in ("Abcdefg1", "Abcdefghij", "1234567890"):
            with self.subTest(password=password):
                response = self.client.post(
                    "/api/auth/register",
                    json={"username": "teacher", "password": password, "role": "teacher"},
                )
                self.assert_password_rejected(response)
        create_user.assert_not_called()

    @patch.dict(os.environ, {"ADMIN_SETUP_KEY": "test-setup-key"})
    @patch("blueprints.auth.db.log_action")
    @patch("blueprints.auth.db.create_user", return_value=("admin-id", None))
    def test_admin_creation_accepts_and_rejects_passwords(
        self, create_user, log_action
    ):
        valid = self.client.post(
            "/api/auth/register-admin",
            json={
                "setup_key": "test-setup-key",
                "username": "admin",
                "password": "Abcdefghi1",
            },
        )
        self.assertEqual(valid.status_code, 201)
        create_user.assert_called_once()

        create_user.reset_mock()
        for password in ("Abcdefg1", "Abcdefghij", "1234567890"):
            with self.subTest(password=password):
                response = self.client.post(
                    "/api/auth/register-admin",
                    json={
                        "setup_key": "test-setup-key",
                        "username": "admin",
                        "password": password,
                    },
                )
                self.assert_password_rejected(response)
        create_user.assert_not_called()

    @patch("blueprints.auth.db.verify_user", return_value={"username": "alice"})
    @patch("blueprints.auth.db.set_user_password", return_value=True)
    def test_change_password_accepts_and_rejects_passwords(
        self, set_user_password, verify_user
    ):
        with self.client.session_transaction() as session:
            session["user"] = {"username": "alice", "role": "teacher"}

        valid = self.client.post(
            "/api/auth/change-password",
            json={"current_password": "old-password", "new_password": "Abcdefghi1"},
        )
        self.assertEqual(valid.status_code, 200)
        set_user_password.assert_called_once_with("alice", "Abcdefghi1")
        with self.client.session_transaction() as session:
            self.assertEqual(session["user"]["username"], "alice")

        set_user_password.reset_mock()
        for password in ("Abcdefg1", "Abcdefghij", "1234567890"):
            with self.subTest(password=password):
                response = self.client.post(
                    "/api/auth/change-password",
                    json={
                        "current_password": "old-password",
                        "new_password": password,
                    },
                )
                self.assert_password_rejected(response)
        set_user_password.assert_not_called()

    @patch("blueprints.auth.db.reset_password_with_token", return_value=True)
    def test_reset_password_accepts_and_rejects_passwords(self, reset_password):
        valid = self.client.post(
            "/api/auth/reset-password",
            json={"token": "reset-token", "new_password": "Abcdefghi1"},
        )
        self.assertEqual(valid.status_code, 200)
        reset_password.assert_called_once_with("reset-token", "Abcdefghi1")

        reset_password.reset_mock()
        for password in ("Abcdefg1", "Abcdefghij", "1234567890"):
            with self.subTest(password=password):
                response = self.client.post(
                    "/api/auth/reset-password",
                    json={"token": "reset-token", "new_password": password},
                )
                self.assert_password_rejected(response)
        reset_password.assert_not_called()


if __name__ == "__main__":
    unittest.main()
