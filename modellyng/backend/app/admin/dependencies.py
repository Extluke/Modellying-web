from fastapi import Depends, HTTPException, status
from app.auth.router import get_current_user

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Security guard dependency ensuring the requesting user has 'admin' privileges.
    Raises HTTP 403 Forbidden with clear localized messaging if access is denied.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Operasi ini membutuhkan hak akses Administrator Sistem."
        )
    return current_user
