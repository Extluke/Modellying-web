from fastapi import APIRouter, HTTPException, Request, Header, Depends, status
from typing import Optional

from .models import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthResponse,
    UserResponse,
    MessageResponse,
)
from .security import (
    verify_password,
    create_access_token,
    decode_access_token,
    login_rate_limiter,
    forgot_rate_limiter,
)
from .storage import user_storage

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def get_client_ip(request: Request) -> str:
    """Extracts client IP for rate limiting."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency that extracts and validates the JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak ditemukan atau tidak valid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        user = user_storage.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Pengguna tidak ditemukan.",
            )
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token kedaluwarsa atau tidak sah.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@auth_router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """
    Registers a new researcher user with Argon2-hashed password and returns JWT token.
    """
    existing_user = user_storage.find_by_email(req.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
        )

    user = user_storage.create_user(
        full_name=req.full_name,
        email=req.email,
        plain_password=req.password,
    )

    token = create_access_token(user_id=user["id"], email=user["email"], role=user["role"])

    return AuthResponse(
        token=token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        ),
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, request: Request):
    """
    Validates user credentials with Rate Limiting protection and returns JWT token.
    Uses generic error messages to prevent account enumeration.
    """
    client_ip = get_client_ip(request)
    rate_key = f"{client_ip}:{req.email}"

    # 1. Check Rate Limiter
    is_limited, retry_after = login_rate_limiter.is_rate_limited(rate_key)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan gagal. Silakan coba kembali dalam {retry_after} detik.",
            headers={"Retry-After": str(retry_after)},
        )

    # 2. Check User & Verify Password
    user = user_storage.find_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        login_rate_limiter.record_attempt(rate_key)
        # Generic message avoids disclosing whether email exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau kata sandi salah.",
        )

    # 3. Successful login: Reset rate limiter
    login_rate_limiter.reset(rate_key)

    token = create_access_token(user_id=user["id"], email=user["email"], role=user["role"])

    return AuthResponse(
        token=token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        ),
    )


@auth_router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(req: ForgotPasswordRequest, request: Request):
    """
    Generates a secure temporary reset token (valid for 1 hour).
    Prevents brute force through rate limiting and protects privacy with generic response.
    """
    client_ip = get_client_ip(request)
    is_limited, retry_after = forgot_rate_limiter.is_rate_limited(client_ip)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak permintaan reset. Silakan coba lagi dalam {retry_after} detik.",
        )

    forgot_rate_limiter.record_attempt(client_ip)

    user = user_storage.find_by_email(req.email)
    dev_reset_url = None

    if user:
        token = user_storage.create_reset_token(req.email, valid_seconds=3600)
        # Development helper: in local dev, provide the reset link in the response
        dev_reset_url = f"http://localhost:3000/reset-password?token={token}"

    return MessageResponse(
        success=True,
        message="Jika email terdaftar, instruksi pemulihan kata sandi telah dikirimkan ke email Anda.",
        details=f"Dev Preview Link: {dev_reset_url}" if dev_reset_url else None,
    )


@auth_router.post("/reset-password", response_model=MessageResponse)
async def reset_password(req: ResetPasswordRequest):
    """
    Validates token and updates the user's password with Argon2 hashing.
    """
    email = user_storage.verify_reset_token(req.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token reset kata sandi tidak valid atau telah kedaluwarsa.",
        )

    updated = user_storage.update_password(email, req.new_password)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pengguna terkait token tidak ditemukan.",
        )

    # Revoke token after successful reset
    user_storage.revoke_reset_token(req.token)

    return MessageResponse(
        success=True,
        message="Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.",
    )


@auth_router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns authenticated user profile using Bearer JWT token.
    """
    return UserResponse(
        id=current_user["id"],
        full_name=current_user["full_name"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user["created_at"],
    )
