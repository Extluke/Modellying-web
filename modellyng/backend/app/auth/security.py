import time
import jwt
from typing import Dict, List, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Secret key and algorithm for JWT (in production, loaded from environment variables)
JWT_SECRET_KEY = "modellyng-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Initialize Argon2 Password Hasher
ph = PasswordHasher()

def hash_password(password: str) -> str:
    """Hashes a password using Argon2id algorithm."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an Argon2 hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False

def create_access_token(user_id: str, email: str, role: str = "researcher") -> str:
    """Creates a signed JWT access token for authentication."""
    expire = time.time() + (JWT_EXPIRATION_HOURS * 3600)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": time.time(),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Dict:
    """Decodes and validates a JWT access token. Raises jwt.PyJWTError if invalid."""
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


class RateLimiter:
    """
    In-memory rate limiter to prevent brute force attacks on sensitive endpoints.
    Tracks timestamped attempts within a rolling window.
    """
    def __init__(self, max_attempts: int, window_seconds: int):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: Dict[str, List[float]] = {}

    def is_rate_limited(self, key: str) -> Tuple[bool, int]:
        """
        Checks if the given key has exceeded the maximum attempts.
        Returns (is_limited, seconds_until_reset).
        """
        now = time.time()
        timestamps = self.attempts.get(key, [])
        # Filter only timestamps within the rolling window
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        self.attempts[key] = valid_timestamps

        if len(valid_timestamps) >= self.max_attempts:
            oldest = valid_timestamps[0]
            retry_after = int(self.window_seconds - (now - oldest))
            return True, max(1, retry_after)

        return False, 0

    def record_attempt(self, key: str):
        """Records a new attempt for the key."""
        now = time.time()
        if key not in self.attempts:
            self.attempts[key] = []
        self.attempts[key].append(now)

    def reset(self, key: str):
        """Resets the recorded attempts for a key upon successful action."""
        if key in self.attempts:
            del self.attempts[key]


# Global rate limiters
login_rate_limiter = RateLimiter(max_attempts=5, window_seconds=60)        # Max 5 attempts per 1 minute
forgot_rate_limiter = RateLimiter(max_attempts=3, window_seconds=300)      # Max 3 attempts per 5 minutes
