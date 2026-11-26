import hashlib
import hmac
import logging
import os
import secrets
import time
from datetime import datetime, timezone
from typing import Dict, List, Tuple

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

logger = logging.getLogger("modellyng.auth.security")

# Environment & JWT configuration (uses safe dev fallback when unset)
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
_DEV_FALLBACK_JWT_SECRET = "modellyng-super-secret-jwt-key-change-in-production"
_configured_secret = os.getenv("JWT_SECRET_KEY", "").strip()
if _configured_secret:
    JWT_SECRET_KEY = _configured_secret
else:
    JWT_SECRET_KEY = _DEV_FALLBACK_JWT_SECRET
    logger.warning(
        "JWT_SECRET_KEY is not set; using development fallback secret. Set JWT_SECRET_KEY in production."
    )

JWT_ALGORITHM = "HS256"


def _parse_positive_int_env(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        parsed = int(raw)
        return parsed if parsed > 0 else default
    except ValueError:
        return default


JWT_EXPIRATION_HOURS = _parse_positive_int_env("JWT_EXPIRATION_HOURS", 24)
JWT_REMEMBER_EXPIRATION_HOURS = _parse_positive_int_env("JWT_REMEMBER_EXPIRATION_HOURS", 24 * 7)

# Initialize Argon2id Password Hasher
ph = PasswordHasher()

# Constant-time mitigation dummy hash evaluated when login email is not registered
DUMMY_PASSWORD_HASH = ph.hash("modellyng-constant-time-dummy-guard")


def hash_password(password: str) -> str:
    """Hashes a password using Argon2id algorithm."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2 hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False


def needs_rehash(hashed_password: str) -> bool:
    """Returns True when an Argon2 hash should be transparently upgraded."""
    try:
        return ph.check_needs_rehash(hashed_password)
    except Exception:
        return False


def create_access_token_with_meta(
    user_id: str,
    email: str,
    role: str = "researcher",
    remember_me: bool = False,
) -> Tuple[str, str]:
    """Creates a signed JWT access token and returns (token, expires_at_iso_utc)."""
    ttl_hours = JWT_REMEMBER_EXPIRATION_HOURS if remember_me else JWT_EXPIRATION_HOURS
    now = time.time()
    expire = now + (ttl_hours * 3600)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": expire,
        "jti": secrets.token_hex(16),
        "type": "access",
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    expires_at = datetime.fromtimestamp(expire, tz=timezone.utc).isoformat()
    return token, expires_at


def create_access_token(
    user_id: str,
    email: str,
    role: str = "researcher",
    remember_me: bool = False,
) -> str:
    """Creates a signed JWT access token for authentication."""
    token, _ = create_access_token_with_meta(
        user_id=user_id,
        email=email,
        role=role,
        remember_me=remember_me,
    )
    return token


def decode_access_token(token: str) -> Dict:
    """Decodes and validates a JWT access token. Raises jwt.PyJWTError if invalid."""
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat"]},
    )


def generate_verification_credentials() -> Tuple[str, str]:
    """Generates (raw_magic_link_token, 6_digit_numeric_otp)."""
    raw_token = secrets.token_urlsafe(32)
    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    return raw_token, otp_code


def hash_verification_secret(raw_value: str, salt: str = "") -> str:
    """Computes a deterministic SHA-256 hex digest for storing verification secrets safely."""
    payload = f"{salt}:{raw_value}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def constant_time_equals(a: str, b: str) -> bool:
    """Constant-time string comparison for verification digests."""
    return hmac.compare_digest(a, b)


class RateLimiter:
    """
    In-memory rate limiter to prevent brute force and spam attacks on auth endpoints.
    Tracks timestamped attempts within a rolling window with automatic stale pruning.
    """

    def __init__(self, max_attempts: int, window_seconds: int, prune_threshold: int = 1000):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.prune_threshold = prune_threshold
        self.attempts: Dict[str, List[float]] = {}

    def _prune_stale_entries(self, now: float) -> None:
        if len(self.attempts) <= self.prune_threshold:
            return
        stale_keys = [
            key
            for key, timestamps in self.attempts.items()
            if not any(now - t < self.window_seconds for t in timestamps)
        ]
        for key in stale_keys:
            del self.attempts[key]

    def is_rate_limited(self, key: str) -> Tuple[bool, int]:
        """
        Checks if the given key has exceeded the maximum attempts.
        Returns (is_limited, seconds_until_reset).
        """
        now = time.time()
        self._prune_stale_entries(now)

        timestamps = self.attempts.get(key, [])
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        if valid_timestamps:
            self.attempts[key] = valid_timestamps
        elif key in self.attempts:
            del self.attempts[key]

        if len(valid_timestamps) >= self.max_attempts:
            oldest = valid_timestamps[0]
            retry_after = int(self.window_seconds - (now - oldest))
            return True, max(1, retry_after)

        return False, 0

    def record_attempt(self, key: str) -> None:
        """Records a new attempt for the key."""
        now = time.time()
        self._prune_stale_entries(now)
        timestamps = self.attempts.get(key, [])
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        valid_timestamps.append(now)
        self.attempts[key] = valid_timestamps

    def reset(self, key: str) -> None:
        """Resets the recorded attempts for a key upon successful action."""
        if key in self.attempts:
            del self.attempts[key]


# Global rate limiters
login_rate_limiter = RateLimiter(max_attempts=5, window_seconds=60)                     # Max 5 attempts / 1 min per IP+email
login_ip_rate_limiter = RateLimiter(max_attempts=20, window_seconds=60)                 # Max 20 attempts / 1 min per IP
register_rate_limiter = RateLimiter(max_attempts=5, window_seconds=300)                 # Max 5 registrations / 5 min per IP
forgot_rate_limiter = RateLimiter(max_attempts=3, window_seconds=300)                   # Max 3 attempts / 5 min per IP
verify_email_rate_limiter = RateLimiter(max_attempts=10, window_seconds=300)            # Max 10 attempts / 5 min per IP
resend_verification_rate_limiter = RateLimiter(max_attempts=1, window_seconds=60)       # Max 1 resend / 60s per IP+email
resend_verification_ip_rate_limiter = RateLimiter(max_attempts=5, window_seconds=900)   # Max 5 resends / 15 min per IP
