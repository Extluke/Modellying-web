import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from contextlib import contextmanager
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

# Load .env file from modellyng/backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("modellyng.database")

# Dedicated Supabase PostgreSQL connection string for modellying-web (Port 28022)
# Strictly isolated from legacy Flutter ports (18021-18027)
DEFAULT_DB_URL = "postgresql://postgres:modellying_web_password@127.0.0.1:28022/postgres"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

_pool: ThreadedConnectionPool = None

def get_connection_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        try:
            _pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=DATABASE_URL,
            )
            logger.info("Successfully established connection pool to Supabase PostgreSQL (modellying-web).")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase PostgreSQL at {DATABASE_URL}: {e}")
            raise e
    return _pool

@contextmanager
def get_db():
    """
    Context manager yielding a database connection from the pool with RealDictCursor.
    Automatically commits on success or rolls back on exception.
    """
    pool = get_connection_pool()
    conn = pool.getconn()
    try:
        conn.autocommit = False
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        pool.putconn(conn)

def ensure_tables():
    """
    Ensures essential auth tables and extension dependencies exist in public schema.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            # Additive email verification columns (existing & seeded accounts remain verified)
            cur.execute("""
            ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

            UPDATE public.users
            SET email_verified_at = COALESCE(email_verified_at, created_at, NOW())
            WHERE email_verified = TRUE AND email_verified_at IS NULL;
            """)

            # Create password_reset_tokens if it doesn't already exist
            cur.execute("""
            CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
                token TEXT PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON public.password_reset_tokens(expires_at);
            CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON public.password_reset_tokens(user_id);
            """)

            # Create email_verification_tokens if it doesn't already exist
            cur.execute("""
            CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                otp_code_hash TEXT NOT NULL,
                attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
                expires_at TIMESTAMPTZ NOT NULL,
                consumed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_email_verif_user_id ON public.email_verification_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_email_verif_email ON public.email_verification_tokens(LOWER(email));
            CREATE INDEX IF NOT EXISTS idx_email_verif_expires ON public.email_verification_tokens(expires_at);
            """)

    # Defensively ensure case-insensitive unique email index without altering public.users columns/constraints
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique
                ON public.users (LOWER(email));
                """)
    except Exception as exc:
        logger.warning(f"Could not ensure idx_users_email_lower_unique on startup ({exc}).")
