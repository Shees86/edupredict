import hashlib
import json
import os
import tempfile
import time
import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from cryptography.fernet import Fernet

import backup_db
import db


class SensitiveStorageTests(unittest.TestCase):
    def setUp(self):
        self.encryption_key = Fernet.generate_key().decode("ascii")
        self.environment = patch.dict(
            os.environ, {"APP_ENCRYPTION_KEY": self.encryption_key}
        )
        self.environment.start()

    def tearDown(self):
        self.environment.stop()

    @patch("db.users_col.update_one")
    def test_totp_secret_is_encrypted_before_storage(self, update_one):
        update_one.return_value.matched_count = 1

        stored = db.set_totp_secret("alice", "totp-secret")

        self.assertTrue(stored)
        encrypted = update_one.call_args.args[1]["$set"]["totp_secret"]
        self.assertNotIn("totp-secret", encrypted)
        self.assertEqual(db._decrypt_sensitive(encrypted), "totp-secret")

    @patch("db.users_col.update_one")
    @patch("db.users_col.find")
    def test_legacy_auth_secrets_are_encrypted(self, find, update_one):
        find.return_value = [{
            "_id": "user-id",
            "totp_secret": "old-totp-secret",
            "reset_token": "old-reset-token",
        }]

        db._migrate_legacy_auth_secrets()

        update = update_one.call_args.args[1]["$set"]
        self.assertEqual(db._decrypt_sensitive(update["totp_secret"]), "old-totp-secret")
        self.assertEqual(db._decrypt_sensitive(update["reset_token"]), "old-reset-token")
        self.assertEqual(
            update["reset_token_hash"],
            hashlib.sha256(b"old-reset-token").hexdigest(),
        )

    @patch("db.users_col.update_one")
    @patch("db.users_col.find_one", return_value={"username": "alice"})
    def test_reset_token_is_encrypted_and_hash_is_stored(
        self, find_one, update_one
    ):
        token = db.create_reset_token("alice")

        update = update_one.call_args.args[1]["$set"]
        self.assertNotIn(token, update["reset_token"])
        self.assertEqual(db._decrypt_sensitive(update["reset_token"]), token)
        self.assertEqual(
            update["reset_token_hash"],
            hashlib.sha256(token.encode("utf-8")).hexdigest(),
        )
        self.assertIsInstance(update["reset_token_expires"], datetime)

    @patch("db.users_col.update_one")
    @patch("db.users_col.find_one")
    def test_reset_token_is_checked_by_hash_and_consumed_once(
        self, find_one, update_one
    ):
        token = "reset-token"
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        find_one.return_value = {
            "_id": "user-id",
            "username": "alice",
            "reset_token_hash": token_hash,
            "reset_token_expires": datetime.utcnow() + timedelta(minutes=5),
        }
        update_one.return_value.modified_count = 1

        result = db.reset_password_with_token(token, "new-password")

        self.assertTrue(result)
        self.assertEqual(find_one.call_args.args[0]["$or"][0], {
            "reset_token_hash": token_hash,
        })
        update_filter = update_one.call_args.args[0]
        self.assertEqual(update_filter["_id"], "user-id")
        self.assertEqual(update_filter["reset_token_hash"], token_hash)
        self.assertIn("reset_token_hash", update_one.call_args.args[1]["$unset"])


class BackupTests(unittest.TestCase):
    def test_backup_excludes_user_secrets_and_includes_all_collections(self):
        collections = {
            name: MagicMock()
            for name in (
                "users", "students", "predictions", "alerts", "feedback",
                "goals", "messages", "audit_log",
            )
        }
        for collection in collections.values():
            collection.find.return_value = [{"_id": "document-id"}]
        user_document = {
            "_id": "user-id",
            "password_hash": "hashed-password",
            "totp_secret": "encrypted-totp",
            "reset_token": "encrypted-reset-token",
            "reset_token_hash": "reset-hash",
            "reset_token_expires": datetime.utcnow().isoformat(),
        }
        collections["users"].find.side_effect = lambda query, projection: [
            {
                key: value for key, value in user_document.items()
                if key not in projection
            }
        ]

        with tempfile.TemporaryDirectory() as temporary_directory:
            with patch.dict(backup_db.COLLECTIONS, collections, clear=True):
                with patch("backup_db.os.path.dirname", return_value=temporary_directory):
                    backup_db.main()

            backup_root = os.path.join(temporary_directory, "backups")
            timestamp_directory = os.path.join(
                backup_root, os.listdir(backup_root)[0]
            )
            with open(os.path.join(timestamp_directory, "users.json")) as backup:
                users = json.load(backup)

        self.assertEqual(set(backup_db.COLLECTIONS), set(collections))
        self.assertEqual(
            collections["users"].find.call_args.args,
            ({}, backup_db.USER_BACKUP_PROJECTION),
        )
        self.assertEqual(users[0], {"_id": "user-id"})


class SessionIdleTimeoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch("db.init_indexes"), patch("db.migrate_legacy_defaults"):
            import app as app_module

        cls.app = app_module.app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

    def test_idle_session_is_expired(self):
        timeout = self.app.config["SESSION_IDLE_TIMEOUT_SECONDS"]
        with self.client.session_transaction() as session:
            session["user"] = {"username": "alice", "role": "teacher"}
            session["_last_activity"] = time.time() - timeout - 1

        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, 401)

    def test_active_session_activity_is_refreshed(self):
        with self.client.session_transaction() as session:
            session["user"] = {"username": "alice", "role": "teacher"}
            session["_last_activity"] = time.time()

        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, 200)
        with self.client.session_transaction() as session:
            self.assertTrue(session.permanent)
            self.assertGreater(session["_last_activity"], 0)


if __name__ == "__main__":
    unittest.main()
