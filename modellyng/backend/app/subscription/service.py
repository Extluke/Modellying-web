import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import zoneinfo
from psycopg2.extras import RealDictCursor

from app.database import get_db

logger = logging.getLogger("modellyng.subscription")
JAKARTA_TZ = zoneinfo.ZoneInfo("Asia/Jakarta")


def get_wib_now() -> datetime:
    """Returns current datetime in Asia/Jakarta (WIB) timezone."""
    return datetime.now(JAKARTA_TZ)


def get_next_wib_midnight_iso() -> str:
    """Calculates the ISO string for next midnight 00:00:00 WIB (when daily quota resets)."""
    now_wib = get_wib_now()
    tomorrow_wib = (now_wib + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow_wib.isoformat()


def get_user_quota_status(user_id: str) -> Dict[str, Any]:
    """
    Fetches the user's active subscription tier and daily usage metrics.
    Timezone for daily usage is strictly aligned to Asia/Jakarta (WIB).
    """
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    vas.user_id,
                    vas.plan_code,
                    vas.plan_name,
                    vas.tier_category,
                    vas.daily_file_limit,
                    vas.daily_token_limit,
                    vas.days_remaining,
                    COALESCE(udu.files_uploaded_count, 0) AS files_uploaded_today,
                    COALESCE(udu.tokens_used_count, 0) AS tokens_used_today
                FROM public.v_user_active_subscription vas
                LEFT JOIN public.user_daily_usage udu 
                    ON udu.user_id = vas.user_id 
                    AND udu.usage_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::DATE
                WHERE vas.user_id = %s;
                """,
                (user_id,),
            )
            row = cur.fetchone()

    if not row:
        # Fallback to free defaults if user record is missing
        return {
            "tier": "free",
            "tier_name": "Free Plan",
            "tier_category": "free",
            "daily_file_limit": 3,
            "files_uploaded_today": 0,
            "remaining_files": 3,
            "daily_token_limit": 3,
            "tokens_used_today": 0,
            "remaining_tokens": 3,
            "days_remaining": None,
            "resets_at": get_next_wib_midnight_iso(),
            "can_upload": True,
            "is_developer": False,
        }

    is_developer = (row["tier_category"] == "developer" or row["plan_code"] == "developer")
    daily_file_limit = row["daily_file_limit"]
    daily_token_limit = row["daily_token_limit"]
    files_uploaded = row["files_uploaded_today"]
    tokens_used = row["tokens_used_today"]

    if is_developer:
        remaining_files = 999999
        remaining_tokens = 999999
        can_upload = True
    else:
        remaining_files = max(0, daily_file_limit - files_uploaded)
        remaining_tokens = max(0, daily_token_limit - tokens_used)
        can_upload = remaining_files > 0

    return {
        "tier": row["plan_code"],
        "tier_name": row["plan_name"],
        "tier_category": row["tier_category"],
        "daily_file_limit": daily_file_limit if not is_developer else 999999,
        "files_uploaded_today": files_uploaded,
        "remaining_files": remaining_files,
        "daily_token_limit": daily_token_limit if not is_developer else 999999,
        "tokens_used_today": tokens_used,
        "remaining_tokens": remaining_tokens,
        "days_remaining": row["days_remaining"],
        "resets_at": get_next_wib_midnight_iso(),
        "can_upload": can_upload,
        "is_developer": is_developer,
    }


def consume_user_quota(
    user_id: str,
    quota_type: str = "paper_upload",
    amount: int = 1,
    reference_id: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calls the PostgreSQL atomic function public.fn_consume_daily_quota.
    Returns:
        {
            "success": bool,
            "current_used": int,
            "daily_limit": int,
            "remaining": int,
            "message": str
        }
    """
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT * FROM public.fn_consume_daily_quota(%s, %s, %s, %s, %s);
                """,
                (user_id, quota_type, amount, reference_id, notes),
            )
            result = cur.fetchone()
            return dict(result) if result else {
                "success": False,
                "current_used": 0,
                "daily_limit": 0,
                "remaining": 0,
                "message": "Gagal memproses kuota.",
            }


def refund_user_quota(
    user_id: str,
    quota_type: str = "paper_upload",
    amount: int = 1,
    reference_id: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calls the PostgreSQL atomic function public.fn_refund_daily_quota.
    """
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT * FROM public.fn_refund_daily_quota(%s, %s, %s, %s, %s);
                """,
                (user_id, quota_type, amount, reference_id, notes),
            )
            result = cur.fetchone()
            return dict(result) if result else {
                "success": False,
                "current_used": 0,
                "daily_limit": 0,
                "remaining": 0,
                "message": "Gagal mengembalikan kuota.",
            }
