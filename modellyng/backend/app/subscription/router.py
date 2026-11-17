from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg2.extras import RealDictCursor

from app.database import get_db
from app.auth.router import get_current_user
from .service import get_user_quota_status

subscription_router = APIRouter(prefix="/subscription", tags=["Subscription & Quota"])


@subscription_router.get("/quota-status")
async def quota_status_endpoint(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns the real-time subscription status and remaining daily quota for the authenticated user.
    """
    user_id = current_user["id"]
    return get_user_quota_status(user_id)


@subscription_router.get("/plans")
async def list_subscription_plans_endpoint() -> List[Dict[str, Any]]:
    """
    Returns public active subscription plans with full feature specs for display in pricing screens.
    """
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    id, code, name, description, price, currency, billing_period,
                    duration_days, daily_file_limit, daily_token_limit, total_tokens_max,
                    tier_category, features, is_popular, sort_order
                FROM public.subscription_plans
                WHERE is_active = true AND code != 'developer'
                ORDER BY sort_order ASC;
                """
            )
            rows = cur.fetchall()
            return [dict(row) for row in rows]


@subscription_router.get("/usage-logs")
async def list_user_usage_logs_endpoint(
    current_user: dict = Depends(get_current_user),
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Returns the user's latest token consumption and refund audit ledger entries.
    """
    user_id = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, action_type, amount, reference_id, notes, created_at
                FROM public.token_usage_logs
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s;
                """,
                (user_id, limit),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": str(r["id"]),
                    "action_type": r["action_type"],
                    "amount": r["amount"],
                    "reference_id": str(r["reference_id"]) if r["reference_id"] else None,
                    "notes": r["notes"],
                    "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                }
                for r in rows
            ]
