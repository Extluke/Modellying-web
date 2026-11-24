import logging
import secrets
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor

from ..database import ensure_tables, get_db
from .security import hash_password

logger = logging.getLogger("modellyng.auth.storage")


class DuplicateEmailError(ValueError):
    """Raised when attempting to register an already existing email address."""


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
        "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
    }


class PostgresUserStorage:
    """
    Persistent Supabase PostgreSQL User and Reset Token Repository.
    Interacts directly with 'public.users' and 'public.password_reset_tokens' in modellying_web_db (Port 28022).
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
                            INSERT INTO public.users (email, password_hash, full_name, role)
                            VALUES (%s, %s, %s, %s)
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
    ) -> dict:
        email_clean = email.strip().lower()
        name_clean = full_name.strip()
        inst_clean = institution.strip() if institution and institution.strip() else None
        pwd_hash = hash_password(plain_password)

        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM public.users WHERE lower(email) = %s;", (email_clean,))
                if cur.fetchone():
                    raise DuplicateEmailError(
                        "Email sudah terdaftar. Silakan masuk atau gunakan alamat email Google lain."
                    )

                try:
                    cur.execute(
                        f"""
                        INSERT INTO public.users (
                            email, password_hash, full_name, institution, role, status, subscription_tier
                        )
                        VALUES (%s, %s, %s, %s, %s, 'active', 'free')
                        RETURNING {USER_SELECT_COLUMNS};
                        """,
                        (email_clean, pwd_hash, name_clean, inst_clean, role),
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
