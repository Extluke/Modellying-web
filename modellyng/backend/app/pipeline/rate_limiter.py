import time
import threading
from datetime import datetime, timezone, timedelta

class TokenBucketRateLimiter:
    """
    Thread-safe Token Bucket rate limiter for LLM provider API quotas (RPM & TPM).
    Optimized for free tiers (e.g. Groq 30 RPM, Gemini 15 RPM).
    """
    def __init__(self, rate: float = 20.0, capacity: float = 20.0):
        self.rate = rate  # Tokens added per minute
        self.capacity = capacity
        self.tokens = capacity
        self.last_check = time.time()
        self.lock = threading.Lock()

    def acquire(self, wait: bool = True) -> bool:
        with self.lock:
            now = time.time()
            elapsed = now - self.last_check
            self.last_check = now
            # Add tokens based on elapsed minutes
            self.tokens = min(self.capacity, self.tokens + elapsed * (self.rate / 60.0))

            if self.tokens >= 1.0:
                self.tokens -= 1.0
                return True

            if not wait:
                return False

            # Wait for next token
            sleep_time = (1.0 - self.tokens) * (60.0 / self.rate)
            time.sleep(max(0.1, min(sleep_time, 30.0)))
            self.tokens = 0.0
            return True

# Shared provider rate limiters
groq_limiter = TokenBucketRateLimiter(rate=25.0, capacity=25.0)
gemini_limiter = TokenBucketRateLimiter(rate=12.0, capacity=12.0)

def calculate_quota_retry_time(attempt: int = 1) -> str:
    """Calculates exponential backoff timestamp with jitter for waiting_quota."""
    backoff_seconds = min(300, (2 ** attempt) * 15)
    retry_time = datetime.now(timezone.utc) + timedelta(seconds=backoff_seconds)
    return retry_time.isoformat()
