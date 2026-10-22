import logging
import secrets
from typing import Optional, Dict
import psycopg2
from psycopg2.extras import RealDictCursor

from ..database import get_db, ensure_tables
from .security import hash_password

logger = logging.getLogger("modellyng.auth.storage")


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
            ("Cahayu UI Specialist", "cahayu@modellyng.ac.id", "Password123"),
            ("Arby Tech Lead", "arby@modellyng.ac.id", "Password123"),
            ("Faqih Core Developer", "faqih@modellyng.ac.id", "Password123"),
            ("Fatih AI Specialist", "fatih@modellyng.ac.id", "Password123"),
            ("Demo Researcher", "demo@modellyng.ac.id", "Password123"),
        ]
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                for name, email, pwd in defaults:
                    email_clean = email.strip().lower()
                    cur.execute("SELECT id FROM public.users WHERE lower(email) = %s;", (email_clean,))
                    if not cur.fetchone():
                        pwd_hash = hash_password(pwd)
                        cur.execute("""
                            INSERT INTO public.users (email, password_hash, full_name, role)
                            VALUES (%s, %s, %s, 'researcher')
                            ON CONFLICT (email) DO NOTHING;
                        """, (email_clean, pwd_hash, name))

    def create_user(self, full_name: str, email: str, plain_password: str, role: str = "researcher") -> dict:
        email_clean = email.strip().lower()
        pwd_hash = hash_password(plain_password)
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM public.users WHERE lower(email) = %s;", (email_clean,))
                if cur.fetchone():
                    raise ValueError("Email sudah terdaftar.")

                cur.execute("""
                    INSERT INTO public.users (email, password_hash, full_name, role)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, full_name, email, role, created_at;
                """, (email_clean, pwd_hash, full_name.strip(), role))
                row = cur.fetchone()
                return {
                    "id": str(row["id"]),
                    "full_name": row["full_name"],
                    "email": row["email"],
                    "password_hash": pwd_hash,
                    "role": row["role"],
                    "created_at": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
                }

    def find_by_email(self, email: str) -> Optional[dict]:
        email_clean = email.strip().lower()
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, full_name, email, password_hash, role, created_at
                    FROM public.users
                    WHERE lower(email) = %s;
                """, (email_clean,))
                row = cur.fetchone()
                if not row:
                    return None
                return {
                    "id": str(row["id"]),
                    "full_name": row["full_name"],
                    "email": row["email"],
                    "password_hash": row["password_hash"],
                    "role": row["role"],
                    "created_at": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
                }

    def find_by_id(self, user_id: str) -> Optional[dict]:
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, full_name, email, password_hash, role, created_at
                    FROM public.users
                    WHERE id = %s;
                """, (user_id,))
                row = cur.fetchone()
                if not row:
                    return None
                return {
                    "id": str(row["id"]),
                    "full_name": row["full_name"],
                    "email": row["email"],
                    "password_hash": row["password_hash"],
                    "role": row["role"],
                    "created_at": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
                }

    def update_password(self, email: str, new_plain_password: str) -> bool:
        email_clean = email.strip().lower()
        new_hash = hash_password(new_plain_password)
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE public.users
                    SET password_hash = %s, updated_at = NOW()
                    WHERE lower(email) = %s;
                """, (new_hash, email_clean))
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

                # Insert fresh token with expiry
                cur.execute("""
                    INSERT INTO public.password_reset_tokens (token, user_id, email, expires_at)
                    VALUES (%s, %s, %s, NOW() + INTERVAL '%s seconds');
                """, (token, user_id, email_clean, valid_seconds))
                return token

    def verify_reset_token(self, token: str) -> Optional[str]:
        """
        Verifies token existence and ensures it has not expired yet.
        """
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT email, expires_at
                    FROM public.password_reset_tokens
                    WHERE token = %s AND expires_at > NOW();
                """, (token,))
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
