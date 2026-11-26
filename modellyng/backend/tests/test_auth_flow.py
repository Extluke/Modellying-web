from __future__ import annotations

from datetime import datetime, timezone
import sys
import time
import uuid
from pathlib import Path
from typing import Dict, Optional, Tuple
from unittest.mock import MagicMock

import jwt
import psycopg2
import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.auth import email_service  # noqa: E402
from app.auth import router as auth_router_module  # noqa: E402
from app.auth import security as auth_security  # noqa: E402
from app.auth.storage import DuplicateEmailError, UnverifiedEmailExistsError  # noqa: E402
from app.main import app  # noqa: E402


class InMemoryUserStorage:
    """Isolated deterministic storage test double matching PostgresUserStorage contracts."""

    def __init__(self) -> None:
        self.users: Dict[str, dict] = {}
        self.verification_tokens: Dict[str, dict] = {}
        self.reset_tokens: Dict[str, dict] = {}
        self.raise_db_error_on_find_by_id = False

        # Seed accounts mimicking production public.users defaults (pre-verified)
        self.create_user(
            full_name="Super Administrator",
            email="admin@modellyng.ac.id",
            plain_password="Password123",
            role="admin",
            admin_role="super_admin",
            email_verified=True,
        )
        self.create_user(
            full_name="Cahayu UI Specialist",
            email="cahayu@modellyng.ac.id",
            plain_password="Password123",
            role="researcher",
            subscription_tier="student_30",
            email_verified=True,
        )

    def create_user(
        self,
        full_name: str,
        email: str,
        plain_password: str,
        role: str = "researcher",
        institution: Optional[str] = None,
        subscription_tier: str = "free",
        admin_role: Optional[str] = None,
        email_verified: bool = False,
    ) -> dict:
        email_clean = email.strip().lower()
        existing = next((u for u in self.users.values() if u["email"] == email_clean), None)
        if existing:
            if not existing.get("email_verified", True):
                raise UnverifiedEmailExistsError(
                    "Email ini sudah terdaftar namun belum diverifikasi. Silakan lanjutkan verifikasi email Anda."
                )
            raise DuplicateEmailError(
                "Email sudah terdaftar. Silakan masuk atau gunakan alamat email Google lain."
            )

        uid = str(uuid.uuid4())
        is_admin = role == "admin"
        now_iso = datetime.now(timezone.utc).isoformat()
        user = {
            "id": uid,
            "full_name": full_name.strip(),
            "email": email_clean,
            "password_hash": auth_security.hash_password(plain_password),
            "institution": institution.strip() if institution and institution.strip() else None,
            "role": role,
            "status": "active",
            "suspension_reason": None,
            "subscription_tier": subscription_tier,
            "citation_format": "APA",
            "ai_confidence_threshold": 0.80,
            "admin_role": (admin_role or "admin") if is_admin else None,
            "admin_permissions": ["all"] if is_admin else [],
            "email_verified": email_verified,
            "email_verified_at": now_iso if email_verified else None,
            "created_at": now_iso,
        }
        self.users[uid] = user
        return dict(user)

    def find_by_email(self, email: str) -> Optional[dict]:
        email_clean = email.strip().lower()
        for user in self.users.values():
            if user["email"] == email_clean:
                return dict(user)
        return None

    def find_by_id(self, user_id: str) -> Optional[dict]:
        if self.raise_db_error_on_find_by_id:
            raise psycopg2.OperationalError("Simulated database outage")
        user = self.users.get(str(user_id))
        return dict(user) if user else None

    def create_email_verification(
        self,
        user_id: str,
        email: str,
        token_hash: str,
        otp_code_hash: str,
        valid_seconds: int = 900,
    ) -> None:
        email_clean = email.strip().lower()
        self.verification_tokens = {
            k: v for k, v in self.verification_tokens.items() if v["user_id"] != user_id
        }
        self.verification_tokens[token_hash] = {
            "user_id": user_id,
            "email": email_clean,
            "token_hash": token_hash,
            "otp_code_hash": otp_code_hash,
            "attempts": 0,
            "expires_at": time.time() + valid_seconds,
            "created_at": time.time(),
        }

    def verify_email_by_token_hash(self, token_hash: str) -> Optional[dict]:
        entry = self.verification_tokens.get(token_hash)
        if not entry or entry["expires_at"] <= time.time():
            return None
        user_id = entry["user_id"]
        user = self.users.get(user_id)
        if not user:
            return None
        user["email_verified"] = True
        user["email_verified_at"] = datetime.now(timezone.utc).isoformat()
        self.verification_tokens = {
            k: v for k, v in self.verification_tokens.items() if v["user_id"] != user_id
        }
        return dict(user)

    def verify_email_by_otp(
        self,
        email: str,
        otp_code_hash: str,
        max_attempts: int = 5,
    ) -> Tuple[str, Optional[dict]]:
        email_clean = email.strip().lower()
        candidates = [
            v for v in self.verification_tokens.values() if v["email"] == email_clean
        ]
        if not candidates:
            return "not_found", None
        entry = max(candidates, key=lambda item: item["created_at"])

        if entry["expires_at"] <= time.time():
            self.verification_tokens.pop(entry["token_hash"], None)
            return "expired", None

        if entry["attempts"] >= max_attempts:
            self.verification_tokens.pop(entry["token_hash"], None)
            return "too_many_attempts", None

        if not auth_security.constant_time_equals(entry["otp_code_hash"], otp_code_hash):
            entry["attempts"] += 1
            if entry["attempts"] >= max_attempts:
                self.verification_tokens.pop(entry["token_hash"], None)
                return "too_many_attempts", None
            return "invalid_code", None

        user_id = entry["user_id"]
        user = self.users.get(user_id)
        if not user:
            return "not_found", None
        user["email_verified"] = True
        user["email_verified_at"] = datetime.now(timezone.utc).isoformat()
        self.verification_tokens = {
            k: v for k, v in self.verification_tokens.items() if v["user_id"] != user_id
        }
        return "verified", dict(user)

    def update_password_hash(self, user_id: str, new_hash: str) -> None:
        if user_id in self.users:
            self.users[user_id]["password_hash"] = new_hash

    def update_password(self, email: str, new_plain_password: str) -> bool:
        user = self.find_by_email(email)
        if not user:
            return False
        self.users[user["id"]]["password_hash"] = auth_security.hash_password(new_plain_password)
        return True

    def create_reset_token(self, email: str, valid_seconds: int = 900) -> str:
        user = self.find_by_email(email)
        if not user:
            raise ValueError("Pengguna tidak ditemukan.")
        token = f"reset-{uuid.uuid4()}"
        self.reset_tokens[token] = {
            "email": user["email"],
            "expires_at": time.time() + valid_seconds,
        }
        return token

    def verify_reset_token(self, token: str) -> Optional[str]:
        entry = self.reset_tokens.get(token)
        if not entry or entry["expires_at"] <= time.time():
            return None
        return entry["email"]

    def revoke_reset_token(self, token: str) -> None:
        self.reset_tokens.pop(token, None)


@pytest.fixture()
def fake_storage(monkeypatch: pytest.MonkeyPatch) -> InMemoryUserStorage:
    storage = InMemoryUserStorage()
    monkeypatch.setattr(auth_router_module, "user_storage", storage)
    monkeypatch.setattr(auth_router_module, "APP_ENV", "development")
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("EMAIL_PROVIDER", "auto")
    monkeypatch.delenv("SMTP_USERNAME", raising=False)
    monkeypatch.delenv("SMTP_PASSWORD", raising=False)
    # Prevent live TCP calls to Mailpit during deterministic router tests
    monkeypatch.setattr(
        email_service,
        "_send_via_mailpit",
        MagicMock(side_effect=OSError("Mailpit offline in unit tests")),
    )
    auth_security.login_rate_limiter.attempts.clear()
    auth_security.login_ip_rate_limiter.attempts.clear()
    auth_security.register_rate_limiter.attempts.clear()
    auth_security.forgot_rate_limiter.attempts.clear()
    auth_security.verify_email_rate_limiter.attempts.clear()
    auth_security.resend_verification_rate_limiter.attempts.clear()
    auth_security.resend_verification_ip_rate_limiter.attempts.clear()
    return storage


@pytest.fixture()
def client(fake_storage: InMemoryUserStorage) -> TestClient:
    return TestClient(app)


def _register_and_verify(
    client: TestClient,
    email: str,
    password: str = "Password123",
    full_name: str = "Peneliti Uji",
    institution: Optional[str] = None,
) -> dict:
    payload = {
        "full_name": full_name,
        "email": email,
        "password": password,
        "confirm_password": password,
    }
    if institution is not None:
        payload["institution"] = institution

    reg = client.post("/api/auth/register", json=payload)
    assert reg.status_code == 201
    reg_data = reg.json()
    assert reg_data["requires_verification"] is True
    assert "token" not in reg_data

    code = reg_data["dev_verification_code"]
    assert code and len(code) == 6
    verify = client.post("/api/auth/verify-email", json={"email": reg_data["email"], "code": code})
    assert verify.status_code == 200
    assert verify.json()["verified"] is True

    login = client.post("/api/auth/login", json={"email": reg_data["email"], "password": password})
    assert login.status_code == 200
    return login.json()


def test_auth_routes_mounted_cleanly_without_duplicate_api_prefix() -> None:
    auth_paths = {path for path in app.openapi()["paths"].keys() if "auth" in path}
    assert "/auth/login" in auth_paths
    assert "/api/auth/login" in auth_paths
    assert "/api/v1/auth/login" in auth_paths
    assert "/api/auth/register" in auth_paths
    assert "/api/v1/auth/register" in auth_paths
    assert "/api/auth/verify-email" in auth_paths
    assert "/api/v1/auth/verify-email" in auth_paths
    assert "/api/auth/resend-verification" in auth_paths
    assert "/api/v1/auth/resend-verification" in auth_paths
    assert "/api/auth/me" in auth_paths
    assert "/api/v1/auth/me" in auth_paths
    assert "/api/auth/logout" in auth_paths
    assert "/api/v1/auth/logout" in auth_paths
    assert not any("/api/api/" in p or "/v1/api/" in p for p in auth_paths)


def test_register_requires_verification_no_jwt_and_blocks_unverified_login(
    client: TestClient, fake_storage: InMemoryUserStorage
) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "  Dr. Siti Aisyah  ",
            "email": "Siti.Aisyah@GMAIL.COM ",
            "institution": "  Telkom University  ",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["requires_verification"] is True
    assert "token" not in data
    assert data["delivery_channel"] == "dev_preview"
    assert len(data["dev_verification_code"]) == 6
    assert "/verify-email?token=" in data["dev_verification_url"]
    assert data["user"]["full_name"] == "Dr. Siti Aisyah"
    assert data["user"]["email"] == "siti.aisyah@gmail.com"
    assert data["user"]["institution"] == "Telkom University"
    assert data["user"]["email_verified"] is False
    assert data["user"]["admin_role"] is None

    stored = fake_storage.find_by_email("siti.aisyah@gmail.com")
    assert stored is not None
    assert stored["password_hash"].startswith("$argon2id$")
    assert stored["email_verified"] is False

    # Re-registering unverified email yields 409 EMAIL_UNVERIFIED
    rereg = client.post(
        "/api/auth/register",
        json={
            "full_name": "Siti Lagi",
            "email": "siti.aisyah@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert rereg.status_code == 409
    assert rereg.json()["detail"]["code"] == "EMAIL_UNVERIFIED"

    # Wrong password on unverified user must still return generic 401 (no unverified leak)
    wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "siti.aisyah@gmail.com", "password": "WrongPassword9"},
    )
    assert wrong_pw.status_code == 401
    assert wrong_pw.json()["detail"] == "Email atau kata sandi salah."

    # Correct password on unverified user returns 403 EMAIL_NOT_VERIFIED
    unverified_login = client.post(
        "/api/auth/login",
        json={"email": "siti.aisyah@gmail.com", "password": "Password123"},
    )
    assert unverified_login.status_code == 403
    assert unverified_login.json()["detail"]["code"] == "EMAIL_NOT_VERIFIED"


def test_verify_email_via_otp_enforces_5_attempts_and_redirects_without_jwt(
    client: TestClient,
) -> None:
    reg = client.post(
        "/api/auth/register",
        json={
            "full_name": "Peneliti OTP",
            "email": "otp.tester@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert reg.status_code == 201
    valid_otp = reg.json()["dev_verification_code"]
    wrong_otp = "000000" if valid_otp != "000000" else "999999"

    # 5 wrong attempts invalidate the issued OTP
    for _ in range(5):
        bad = client.post(
            "/api/auth/verify-email",
            json={"email": "otp.tester@gmail.com", "code": wrong_otp},
        )
        assert bad.status_code == 400

    # Even the previously valid OTP is now invalidated
    locked = client.post(
        "/api/auth/verify-email",
        json={"email": "otp.tester@gmail.com", "code": valid_otp},
    )
    assert locked.status_code == 400

    # Resend generates a fresh OTP
    auth_security.verify_email_rate_limiter.attempts.clear()
    resend = client.post(
        "/api/auth/resend-verification",
        json={"email": "otp.tester@gmail.com"},
    )
    assert resend.status_code == 200
    fresh_otp = resend.json()["dev_verification_code"]
    assert fresh_otp and len(fresh_otp) == 6

    # Immediate second resend hits 60s cooldown (429)
    cooldown = client.post(
        "/api/auth/resend-verification",
        json={"email": "otp.tester@gmail.com"},
    )
    assert cooldown.status_code == 429
    assert "Retry-After" in cooldown.headers

    # Valid OTP verifies email and returns VerifyEmailResponse (no JWT — user goes to /login)
    verified = client.post(
        "/api/v1/auth/verify-email",
        json={"email": "otp.tester@gmail.com", "code": fresh_otp},
    )
    assert verified.status_code == 200
    v_data = verified.json()
    assert v_data["verified"] is True
    assert v_data["email"] == "otp.tester@gmail.com"
    assert "token" not in v_data

    # Single-use: reusing OTP fails
    reused = client.post(
        "/api/auth/verify-email",
        json={"email": "otp.tester@gmail.com", "code": fresh_otp},
    )
    assert reused.status_code == 400

    # Now user can log in cleanly
    login = client.post(
        "/api/auth/login",
        json={"email": "otp.tester@gmail.com", "password": "Password123"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["email_verified"] is True


def test_verify_email_via_magic_link_token(client: TestClient) -> None:
    reg = client.post(
        "/api/auth/register",
        json={
            "full_name": "Peneliti Magic Link",
            "email": "magic.link@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert reg.status_code == 201
    magic_url = reg.json()["dev_verification_url"]
    raw_token = magic_url.split("token=")[-1]

    verify = client.post("/api/auth/verify-email", json={"token": raw_token})
    assert verify.status_code == 200
    assert verify.json()["verified"] is True

    # Single-use: reusing magic token fails
    reuse = client.post("/api/auth/verify-email", json={"token": raw_token})
    assert reuse.status_code == 400


@pytest.mark.parametrize(
    "bad_email",
    [
        "user@yahoo.com",
        "user@outlook.com",
        "user@modellyng.ac.id",
        "user@gmail.co.id",
        "bad..dots@gmail.com",
        ".leadingdot@gmail.com",
        "trailingdot.@gmail.com",
        "not-an-email",
    ],
)
def test_register_rejects_non_gmail_or_malformed_emails(
    client: TestClient, bad_email: str
) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Peneliti Uji",
            "email": bad_email,
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert response.status_code == 422


def test_register_rejects_whitespace_name_weak_password_and_duplicate_gmail(
    client: TestClient,
) -> None:
    blank_name = client.post(
        "/api/auth/register",
        json={
            "full_name": "     ",
            "email": "peneliti1@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert blank_name.status_code == 422

    weak_pwd = client.post(
        "/api/auth/register",
        json={
            "full_name": "Peneliti Uji",
            "email": "peneliti1@gmail.com",
            "password": "passwordonly",
            "confirm_password": "passwordonly",
        },
    )
    assert weak_pwd.status_code == 422

    _register_and_verify(client, "peneliti.sama@gmail.com")

    duplicate = client.post(
        "/api/auth/register",
        json={
            "full_name": "Peneliti Dua",
            "email": "Peneliti.Sama@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert duplicate.status_code == 409


def test_register_rate_limiter_enforces_429(client: TestClient) -> None:
    for idx in range(5):
        res = client.post(
            "/api/auth/register",
            json={
                "full_name": f"User {idx}",
                "email": f"ratetest{idx}@gmail.com",
                "password": "Password123",
                "confirm_password": "Password123",
            },
        )
        assert res.status_code == 201

    blocked = client.post(
        "/api/auth/register",
        json={
            "full_name": "User Overflow",
            "email": "ratetest99@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers


def test_login_exact_password_no_exclamation_backdoor_and_remember_me_ttl(
    client: TestClient,
) -> None:
    # Backdoor regression: Password123! MUST fail when real password is Password123
    backdoor_attempt = client.post(
        "/api/auth/login",
        json={
            "email": "cahayu@modellyng.ac.id",
            "password": "Password123!",
            "remember_me": False,
        },
    )
    assert backdoor_attempt.status_code == 401
    assert backdoor_attempt.json()["detail"] == "Email atau kata sandi salah."

    # Seeded accounts remain verified and login normally
    login_short = client.post(
        "/api/auth/login",
        json={
            "email": "cahayu@modellyng.ac.id",
            "password": "Password123",
            "remember_me": False,
        },
    )
    assert login_short.status_code == 200
    payload_short = auth_security.decode_access_token(login_short.json()["token"])
    ttl_short_hours = (payload_short["exp"] - payload_short["iat"]) / 3600
    assert 23.9 <= ttl_short_hours <= 24.1

    login_long = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@modellyng.ac.id",
            "password": "Password123",
            "remember_me": True,
        },
    )
    assert login_long.status_code == 200
    assert login_long.json()["user"]["role"] == "admin"
    assert login_long.json()["user"]["admin_role"] == "super_admin"
    payload_long = auth_security.decode_access_token(login_long.json()["token"])
    ttl_long_hours = (payload_long["exp"] - payload_long["iat"]) / 3600
    assert 167.9 <= ttl_long_hours <= 168.1


def test_login_rejects_external_non_gmail_and_enforces_rate_limit(
    client: TestClient,
) -> None:
    external_domain = client.post(
        "/api/auth/login",
        json={"email": "someone@yahoo.com", "password": "Password123"},
    )
    assert external_domain.status_code == 422

    for _ in range(5):
        wrong = client.post(
            "/api/auth/login",
            json={"email": "cahayu@modellyng.ac.id", "password": "WrongPassword9"},
        )
        assert wrong.status_code == 401

    limited = client.post(
        "/api/auth/login",
        json={"email": "cahayu@modellyng.ac.id", "password": "Password123"},
    )
    assert limited.status_code == 429
    assert "Retry-After" in limited.headers


def test_suspended_deactivated_and_unverified_jwt_enforcement(
    client: TestClient, fake_storage: InMemoryUserStorage
) -> None:
    auth_data = _register_and_verify(client, "status.check@gmail.com")
    token = auth_data["token"]
    user_id = auth_data["user"]["id"]

    me_ok = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_ok.status_code == 200

    # If user becomes unverified, existing JWT must be rejected with 401
    fake_storage.users[user_id]["email_verified"] = False
    me_unverified = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_unverified.status_code == 401
    fake_storage.users[user_id]["email_verified"] = True

    # Admin suspends user
    fake_storage.users[user_id]["status"] = "suspended"
    fake_storage.users[user_id]["suspension_reason"] = "Pelanggaran kebijakan unggah."

    wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "status.check@gmail.com", "password": "WrongPassword1"},
    )
    assert wrong_pw.status_code == 401

    login_suspended = client.post(
        "/api/auth/login",
        json={"email": "status.check@gmail.com", "password": "Password123"},
    )
    assert login_suspended.status_code == 403
    assert "Pelanggaran kebijakan unggah." in login_suspended.json()["detail"]

    me_suspended = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_suspended.status_code == 401

    fake_storage.users[user_id]["status"] = "deactivated"
    login_deactivated = client.post(
        "/api/auth/login",
        json={"email": "status.check@gmail.com", "password": "Password123"},
    )
    assert login_deactivated.status_code == 403


def test_get_current_user_token_validation_and_db_outage_503(
    client: TestClient, fake_storage: InMemoryUserStorage
) -> None:
    bad_sub_token = jwt.encode(
        {
            "sub": "not-a-uuid",
            "email": "x@gmail.com",
            "role": "researcher",
            "iat": time.time(),
            "exp": time.time() + 3600,
        },
        auth_security.JWT_SECRET_KEY,
        algorithm=auth_security.JWT_ALGORITHM,
    )
    res_bad_sub = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {bad_sub_token}"}
    )
    assert res_bad_sub.status_code == 401

    expired_token = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "x@gmail.com",
            "role": "researcher",
            "iat": time.time() - 7200,
            "exp": time.time() - 3600,
        },
        auth_security.JWT_SECRET_KEY,
        algorithm=auth_security.JWT_ALGORITHM,
    )
    res_expired = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_expired.status_code == 401

    login_res = client.post(
        "/api/auth/login",
        json={"email": "cahayu@modellyng.ac.id", "password": "Password123"},
    )
    valid_token = login_res.json()["token"]
    fake_storage.raise_db_error_on_find_by_id = True
    res_db_down = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {valid_token}"}
    )
    assert res_db_down.status_code == 503


def test_logout_and_password_reset_regression(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True

    monkeypatch.setattr(auth_router_module, "APP_ENV", "production")
    monkeypatch.setenv("APP_ENV", "production")
    forgot_prod = client.post(
        "/api/auth/forgot-password",
        json={"email": "cahayu@modellyng.ac.id"},
    )
    assert forgot_prod.status_code == 200
    assert forgot_prod.json()["details"] is None

    auth_security.forgot_rate_limiter.attempts.clear()
    monkeypatch.setattr(auth_router_module, "APP_ENV", "development")
    monkeypatch.setenv("APP_ENV", "development")
    forgot_dev = client.post(
        "/api/auth/forgot-password",
        json={"email": "cahayu@modellyng.ac.id"},
    )
    assert forgot_dev.status_code == 200
    details = forgot_dev.json()["details"]
    assert details and "token=" in details
    reset_token = details.split("token=")[-1].strip()

    reset_res = client.post(
        "/api/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "NewPassword99",
            "confirm_password": "NewPassword99",
        },
    )
    assert reset_res.status_code == 200

    login_new = client.post(
        "/api/auth/login",
        json={"email": "cahayu@modellyng.ac.id", "password": "NewPassword99"},
    )
    assert login_new.status_code == 200


def test_email_service_auto_detect_smtp_mailpit_and_production_guard(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # 1. SMTP mode when credentials are configured
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("EMAIL_PROVIDER", "auto")
    monkeypatch.setenv("SMTP_HOST", "smtp.gmail.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USERNAME", "sender@gmail.com")
    monkeypatch.setenv("SMTP_PASSWORD", "abcd efgh ijkl mnop")
    smtp_mock = MagicMock()
    monkeypatch.setattr(email_service, "_send_via_smtp", smtp_mock)

    res_smtp = email_service.send_verification_email(
        to_email="user@gmail.com",
        full_name="Peneliti",
        otp_code="123456",
        verification_url="http://localhost:3000/verify-email?token=abc",
    )
    assert res_smtp.delivered is True
    assert res_smtp.channel == "smtp"
    assert smtp_mock.called

    # 2. Mailpit fallback when SMTP credentials are absent
    monkeypatch.delenv("SMTP_USERNAME", raising=False)
    monkeypatch.delenv("SMTP_PASSWORD", raising=False)
    mailpit_mock = MagicMock()
    monkeypatch.setattr(email_service, "_send_via_mailpit", mailpit_mock)

    res_mailpit = email_service.send_verification_email(
        to_email="user@gmail.com",
        full_name="Peneliti",
        otp_code="123456",
        verification_url="http://localhost:3000/verify-email?token=abc",
    )
    assert res_mailpit.delivered is True
    assert res_mailpit.channel == "mailpit"
    assert mailpit_mock.called

    # 3. Production mode raises EmailDeliveryError when no transport succeeds
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setattr(
        email_service,
        "_send_via_mailpit",
        MagicMock(side_effect=OSError("Mailpit not available")),
    )
    with pytest.raises(email_service.EmailDeliveryError):
        email_service.send_verification_email(
            to_email="user@gmail.com",
            full_name="Peneliti",
            otp_code="123456",
            verification_url="http://localhost:3000/verify-email?token=abc",
        )
