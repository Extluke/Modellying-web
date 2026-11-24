from __future__ import annotations

from datetime import datetime, timezone
import sys
import time
import uuid
from pathlib import Path
from typing import Dict, Optional

import jwt
import psycopg2
import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.auth import router as auth_router_module  # noqa: E402
from app.auth import security as auth_security  # noqa: E402
from app.auth.storage import DuplicateEmailError  # noqa: E402
from app.main import app  # noqa: E402


class InMemoryUserStorage:
    """Isolated deterministic storage test double matching PostgresUserStorage contracts."""

    def __init__(self) -> None:
        self.users: Dict[str, dict] = {}
        self.reset_tokens: Dict[str, dict] = {}
        self.raise_db_error_on_find_by_id = False

        # Seed accounts mimicking production public.users defaults
        self.create_user(
            full_name="Super Administrator",
            email="admin@modellyng.ac.id",
            plain_password="Password123",
            role="admin",
            admin_role="super_admin",
        )
        self.create_user(
            full_name="Cahayu UI Specialist",
            email="cahayu@modellyng.ac.id",
            plain_password="Password123",
            role="researcher",
            subscription_tier="student_30",
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
    ) -> dict:
        email_clean = email.strip().lower()
        if any(u["email"] == email_clean for u in self.users.values()):
            raise DuplicateEmailError(
                "Email sudah terdaftar. Silakan masuk atau gunakan alamat email Google lain."
            )

        uid = str(uuid.uuid4())
        is_admin = role == "admin"
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
            "created_at": datetime.now(timezone.utc).isoformat(),
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
    auth_security.login_rate_limiter.attempts.clear()
    auth_security.login_ip_rate_limiter.attempts.clear()
    auth_security.register_rate_limiter.attempts.clear()
    auth_security.forgot_rate_limiter.attempts.clear()
    return storage


@pytest.fixture()
def client(fake_storage: InMemoryUserStorage) -> TestClient:
    return TestClient(app)


def test_auth_routes_mounted_cleanly_without_duplicate_api_prefix() -> None:
    auth_paths = {path for path in app.openapi()["paths"].keys() if "auth" in path}
    assert "/auth/login" in auth_paths
    assert "/api/auth/login" in auth_paths
    assert "/api/v1/auth/login" in auth_paths
    assert "/api/auth/register" in auth_paths
    assert "/api/v1/auth/register" in auth_paths
    assert "/api/auth/me" in auth_paths
    assert "/api/v1/auth/me" in auth_paths
    assert "/api/auth/logout" in auth_paths
    assert "/api/v1/auth/logout" in auth_paths
    assert not any("/api/api/" in p or "/v1/api/" in p for p in auth_paths)


def test_register_success_with_gmail_and_optional_institution(
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
    assert data["token"]
    assert data["token_type"] == "bearer"
    assert data["expires_at"]
    assert data["user"]["full_name"] == "Dr. Siti Aisyah"
    assert data["user"]["email"] == "siti.aisyah@gmail.com"
    assert data["user"]["institution"] == "Telkom University"
    assert data["user"]["role"] == "researcher"
    assert data["user"]["status"] == "active"
    assert data["user"]["subscription_tier"] == "free"
    assert data["user"]["admin_role"] is None

    stored = fake_storage.find_by_email("siti.aisyah@gmail.com")
    assert stored is not None
    assert stored["password_hash"].startswith("$argon2id$")


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

    first = client.post(
        "/api/auth/register",
        json={
            "full_name": "Peneliti Satu",
            "email": "peneliti.sama@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert first.status_code == 201

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

    # Standard login without remember_me (~24h)
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

    # Remember me login (~168h / 7 days)
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


def test_suspended_and_deactivated_account_enforcement(
    client: TestClient, fake_storage: InMemoryUserStorage
) -> None:
    reg = client.post(
        "/api/auth/register",
        json={
            "full_name": "Peneliti Aktif",
            "email": "status.check@gmail.com",
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["token"]
    user_id = reg.json()["user"]["id"]

    # Active session succeeds
    me_ok = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_ok.status_code == 200

    # Admin suspends the user
    fake_storage.users[user_id]["status"] = "suspended"
    fake_storage.users[user_id]["suspension_reason"] = "Pelanggaran kebijakan unggah."

    # Wrong password on suspended user must still yield generic 401 (no status enumeration)
    wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "status.check@gmail.com", "password": "WrongPassword1"},
    )
    assert wrong_pw.status_code == 401

    # Valid password on suspended user returns 403 with reason
    login_suspended = client.post(
        "/api/auth/login",
        json={"email": "status.check@gmail.com", "password": "Password123"},
    )
    assert login_suspended.status_code == 403
    assert "Pelanggaran kebijakan unggah." in login_suspended.json()["detail"]

    # Existing active JWT is immediately rejected by /auth/me
    me_suspended = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_suspended.status_code == 401

    # Deactivated account enforcement
    fake_storage.users[user_id]["status"] = "deactivated"
    login_deactivated = client.post(
        "/api/auth/login",
        json={"email": "status.check@gmail.com", "password": "Password123"},
    )
    assert login_deactivated.status_code == 403


def test_get_current_user_token_validation_and_db_outage_503(
    client: TestClient, fake_storage: InMemoryUserStorage
) -> None:
    # Malformed & non-UUID subject token -> 401
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

    # Expired token -> 401
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

    # Database outage returns 503 (must NOT force 401 logout)
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

    # In production mode, dev reset link must NOT leak
    monkeypatch.setattr(auth_router_module, "APP_ENV", "production")
    forgot_prod = client.post(
        "/api/auth/forgot-password",
        json={"email": "cahayu@modellyng.ac.id"},
    )
    assert forgot_prod.status_code == 200
    assert forgot_prod.json()["details"] is None

    # Reset flow in development mode
    auth_security.forgot_rate_limiter.attempts.clear()
    monkeypatch.setattr(auth_router_module, "APP_ENV", "development")
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
