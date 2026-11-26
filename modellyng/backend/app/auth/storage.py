import logging
import secrets
from typing import Optional, Tuple

import psycopg2
from psycopg2.extras import RealDictCursor

from ..database import ensure_tables, get_db
from .security import constant_time_equals, hash_password

logger = logging.getLogger("modellyng.auth.storage")


class DuplicateEmailError(ValueError):
    """Raised when attempting to register an already existing email address."""


class UnverifiedEmailExistsError(DuplicateEmailError):
    """Raised when attempting to register an email that already exists but is unverified."""


USER_SELECT_COLUMNS = """
    id,
    full_name,
    email,
    password_hash,
    institution,
    role,
    status,
    suspension_reason,
    subscription_tier,
    citation_format,
    ai_confidence_threshold,
    admin_role,
    admin_permissions,
    email_verified,
    email_verified_at,
    created_at,
    updated_at
"""


def _serialize_user_row(row: dict) -> dict:
    """Normalizes a public.users record while avoiding leaking admin defaults onto researchers."""
    role = row.get("role") or "researcher"
    is_admin = role == "admin"
    raw_threshold = row.get("ai_confidence_threshold")
    raw_permissions = row.get("admin_permissions")
    created_at = row.get("created_at")
    verified_at = row.get("email_verified_at")

    return {
        "id": str(row["id"]),
        "full_name": row["full_name"],
        "email": row["email"],
        "password_hash": row.get("password_hash"),
        "institution": row.get("institution"),
        "role": role,
        "status": row.get("status") or "active",
        "suspension_reason": row.get("suspension_reason"),
        "subscription_tier": row.get("subscription_tier") or "free",
        "citation_format": row.get("citation_format") or "APA",
        "ai_confidence_threshold": float(raw_threshold) if raw_threshold is not None else 0.80,
        "admin_role": (row.get("admin_role") or "admin") if is_admin else None,
        "admin_permissions": (
            raw_permissions if isinstance(raw_permissions, list) else ["all"]
        )
        if is_admin
        else [],
        "email_verified": bool(row.get("email_verified", True)),
        "email_verified_at": (
            verified_at.isoformat()
            if hasattr(verified_at, "isoformat")
            else (str(verified_at) if verified_at else None)
        ),
        "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
    }


class PostgresUserStorage:
    """
    Persistent Supabase PostgreSQL User, Email Verification, and Reset Token Repository.
    Interacts directly with 'public.users', 'public.email_verification_tokens',
    and 'public.password_reset_tokens' in modellying_web_db (Port 28022).
    """

    def __init__(self):
        try:
            ensure_tables()
            self._seed_default_users()
            logger.info("PostgresUserStorage initialized with public.users.")
        except Exception as e:
            logger.warning(f"Could not initialize PostgreSQL immediately on startup ({e}). Retrying on demand.")

    def _seed_default_users(self):
        defaults = [
            ("Cahayu UI Specialist", "cahayu@modellyng.ac.id", "Password123", "researcher"),
            ("Lawren Researcher", "lawren@modellyng.ac.id", "Password123", "researcher"),
            ("Arby Tech Lead", "arby@modellyng.ac.id", "Password123", "researcher"),
            ("Faqih Core Developer", "faqih@modellyng.ac.id", "Password123", "researcher"),
            ("Fatih AI Specialist", "fatih@modellyng.ac.id", "Password123", "researcher"),
            ("Demo Researcher", "demo@modellyng.ac.id", "Password123", "researcher"),
            ("Super Administrator", "admin@modellyng.ac.id", "Password123", "admin"),
        ]
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                for name, email, pwd, role in defaults:
                    email_clean = email.strip().lower()
                    cur.execute("SELECT id FROM public.users WHERE lower(email) = %s;", (email_clean,))
                    if not cur.fetchone():
                        pwd_hash = hash_password(pwd)
                        cur.execute(
                            """
                            INSERT INTO public.users (
                                email, password_hash, full_name, role, email_verified, email_verified_at
                            )
                            VALUES (%s, %s, %s, %s, TRUE, NOW())
                            ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;
                            """,
                            (email_clean, pwd_hash, name, role),
                        )

    def create_user(
        self,
        full_name: str,
        email: str,
        plain_password: str,
        role: str = "researcher",
        institution: Optional[str] = None,
        email_verified: bool = False,
    ) -> dict:
        email_clean = email.strip().lower()
        name_clean = full_name.strip()
        inst_clean = institution.strip() if institution and institution.strip() else None
        pwd_hash = hash_password(plain_password)

        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, email_verified FROM public.users WHERE lower(email) = %s;",
                    (email_clean,),
                )
                existing = cur.fetchone()
                if existing:
                    if not bool(existing.get("email_verified", True)):
                        raise UnverifiedEmailExistsError(
                            "Email ini sudah terdaftar namun belum diverifikasi. Silakan lanjutkan verifikasi email Anda."
                        )
                    raise DuplicateEmailError(
                        "Email sudah terdaftar. Silakan masuk atau gunakan alamat email Google lain."
                    )

                try:
                    cur.execute(
                        f"""
                        INSERT INTO public.users (
                            email, password_hash, full_name, institution, role, status,
                            subscription_tier, email_verified, email_verified_at
                        )
                        VALUES (
                            %s, %s, %s, %s, %s, 'active', 'free', %s,
                            CASE WHEN %s THEN NOW() ELSE NULL END
                        )
                        RETURNING {USER_SELECT_COLUMNS};
                        """,
                        (email_clean, pwd_hash, name_clean, inst_clean, role, email_verified, email_verified),
                    )
                except psycopg2.errors.UniqueViolation as exc:
                    raise DuplicateEmailError(
                        "Email sudah terdaftar. Silakan masuk atau gunakan alamat email Google lain."
                    ) from exc

                row = cur.fetchone()
                return _serialize_user_row(row)

    def find_by_email(self, email: str) -> Optional[dict]:
        email_clean = email.strip().lower()
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"""
                    SELECT {USER_SELECT_COLUMNS}
                    FROM public.users
                    WHERE lower(email) = %s;
                    """,
                    (email_clean,),
                )
                row = cur.fetchone()
                if not row:
                    return None
                return _serialize_user_row(row)

    def find_by_id(self, user_id: str) -> Optional[dict]:
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"""
                    SELECT {USER_SELECT_COLUMNS}
                    FROM public.users
                    WHERE id = %s;
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
                if not row:
                    return None
                return _serialize_user_row(row)

    def create_email_verification(
        self,
        user_id: str,
        email: str,
        token_hash: str,
        otp_code_hash: str,
        valid_seconds: int = 900,
    ) -> None:
        """Persists a fresh verification token + 6-digit OTP hash, replacing any previous token."""
        email_clean = email.strip().lower()
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM public.email_verification_tokens WHERE user_id = %s;",
                    (user_id,),
                )
                cur.execute(
                    """
                    INSERT INTO public.email_verification_tokens (
                        user_id, email, token_hash, otp_code_hash, attempts, expires_at
                    )
                    VALUES (%s, %s, %s, %s, 0, NOW() + make_interval(secs => %s));
                    """,
                    (user_id, email_clean, token_hash, otp_code_hash, int(valid_seconds)),
                )

    def verify_email_by_token_hash(self, token_hash: str) -> Optional[dict]:
        """Verifies a user via single-use magic link token hash."""
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id, user_id
                    FROM public.email_verification_tokens
                    WHERE token_hash = %s AND consumed_at IS NULL AND expires_at > NOW()
                    FOR UPDATE;
                    """,
                    (token_hash,),
                )
                token_row = cur.fetchone()
                if not token_row:
                    return None

                user_id = token_row["user_id"]
                cur.execute(
                    f"""
                    UPDATE public.users
                    SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
                    WHERE id = %s
                    RETURNING {USER_SELECT_COLUMNS};
                    """,
                    (user_id,),
                )
                user_row = cur.fetchone()
                cur.execute(
                    "DELETE FROM public.email_verification_tokens WHERE user_id = %s;",
                    (user_id,),
                )
                return _serialize_user_row(user_row) if user_row else None

    def verify_email_by_otp(
        self,
        email: str,
        otp_code_hash: str,
        max_attempts: int = 5,
    ) -> Tuple[str, Optional[dict]]:
        """
        Verifies a user via 6-digit OTP code hash.
        Returns status: 'verified' | 'invalid_code' | 'expired' | 'too_many_attempts' | 'not_found'.
        """
        email_clean = email.strip().lower()
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id, user_id, otp_code_hash, attempts, (expires_at <= NOW()) AS is_expired
                    FROM public.email_verification_tokens
                    WHERE lower(email) = %s AND consumed_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                    FOR UPDATE;
                    """,
                    (email_clean,),
                )
                token_row = cur.fetchone()
                if not token_row:
                    return "not_found", None

                token_id = token_row["id"]
                user_id = token_row["user_id"]

                if token_row["is_expired"]:
                    cur.execute(
                        "DELETE FROM public.email_verification_tokens WHERE id = %s;",
                        (token_id,),
                    )
                    return "expired", None

                current_attempts = int(token_row.get("attempts") or 0)
                if current_attempts >= max_attempts:
                    cur.execute(
                        "DELETE FROM public.email_verification_tokens WHERE id = %s;",
                        (token_id,),
                    )
                    return "too_many_attempts", None

                if not constant_time_equals(token_row["otp_code_hash"], otp_code_hash):
                    new_attempts = current_attempts + 1
                    if new_attempts >= max_attempts:
                        cur.execute(
                            "DELETE FROM public.email_verification_tokens WHERE id = %s;",
                            (token_id,),
                        )
                        return "too_many_attempts", None
                    cur.execute(
                        "UPDATE public.email_verification_tokens SET attempts = %s WHERE id = %s;",
                        (new_attempts, token_id),
                    )
                    return "invalid_code", None

                cur.execute(
                    f"""
                    UPDATE public.users
                    SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
                    WHERE id = %s
                    RETURNING {USER_SELECT_COLUMNS};
                    """,
                    (user_id,),
                )
                user_row = cur.fetchone()
                cur.execute(
                    "DELETE FROM public.email_verification_tokens WHERE user_id = %s;",
                    (user_id,),
                )
                if not user_row:
                    return "not_found", None
                return "verified", _serialize_user_row(user_row)

    def update_password_hash(self, user_id: str, new_hash: str) -> None:
        """Transparently upgrades stored Argon2 hash parameters upon successful login."""
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE public.users
                    SET password_hash = %s, updated_at = NOW()
                    WHERE id = %s;
                    """,
                    (new_hash, user_id),
                )

    def update_password(self, email: str, new_plain_password: str) -> bool:
        email_clean = email.strip().lower()
        new_hash = hash_password(new_plain_password)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE public.users
                    SET password_hash = %s, updated_at = NOW()
                    WHERE lower(email) = %s;
                    """,
                    (new_hash, email_clean),
                )
                return cur.rowcount > 0

    def create_reset_token(self, email: str, valid_seconds: int = 900) -> str:
        """
        Creates a secure cryptographic reset token expiring in 15 minutes (default: 900s).
        Persists token directly in public.password_reset_tokens table.
        """
        email_clean = email.strip().lower()
        token = secrets.token_urlsafe(32)
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM public.users WHERE lower(email) = %s;", (email_clean,))
                user_row = cur.fetchone()
                if not user_row:
                    raise ValueError("Pengguna tidak ditemukan.")
                user_id = user_row["id"]

                # Delete any older tokens for this user
                cur.execute("DELETE FROM public.password_reset_tokens WHERE user_id = %s;", (user_id,))

                # Insert fresh token with parameterized expiry interval
                cur.execute(
                    """
                    INSERT INTO public.password_reset_tokens (token, user_id, email, expires_at)
                    VALUES (%s, %s, %s, NOW() + make_interval(secs => %s));
                    """,
                    (token, user_id, email_clean, int(valid_seconds)),
                )
                return token

    def verify_reset_token(self, token: str) -> Optional[str]:
        """
        Verifies token existence and ensures it has not expired yet.
        """
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT email, expires_at
                    FROM public.password_reset_tokens
                    WHERE token = %s AND expires_at > NOW();
                    """,
                    (token,),
                )
                row = cur.fetchone()
                if not row:
                    return None
                return row["email"]

    def revoke_reset_token(self, token: str):
        """
        Single-use disposal: removes used or expired token.
        """
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("DELETE FROM public.password_reset_tokens WHERE token = %s;", (token,))


# Singleton storage instance backed by Supabase PostgreSQL
user_storage = PostgresUserStorage()
