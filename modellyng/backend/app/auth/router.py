import logging
import uuid
from typing import Optional

import jwt
import psycopg2
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from .models import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
)
from .security import (
    APP_ENV,
    DUMMY_PASSWORD_HASH,
    create_access_token_with_meta,
    decode_access_token,
    forgot_rate_limiter,
    hash_password,
    login_ip_rate_limiter,
    login_rate_limiter,
    needs_rehash,
    register_rate_limiter,
    verify_password,
)
from .storage import DuplicateEmailError, user_storage

logger = logging.getLogger("modellyng.auth.router")

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_client_ip(request: Request) -> str:
    """Extracts client IP for rate limiting."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def _build_user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        full_name=user["full_name"],
        email=user["email"],
        role=user.get("role") or "researcher",
        subscription_tier=user.get("subscription_tier") or "free",
        institution=user.get("institution"),
        status=user.get("status") or "active",
        citation_format=user.get("citation_format") or "APA",
        ai_confidence_threshold=float(user.get("ai_confidence_threshold") or 0.80),
        admin_role=user.get("admin_role") if user.get("role") == "admin" else None,
        created_at=user["created_at"],
    )


def _format_inactive_status_message(user: dict) -> str:
    user_status = (user.get("status") or "active").lower()
    if user_status == "suspended":
        reason = (user.get("suspension_reason") or "").strip()
        if reason:
            return f"Akun Anda sedang ditangguhkan: {reason}"
        return "Akun Anda sedang ditangguhkan. Silakan hubungi administrator untuk informasi lebih lanjut."
    return "Akun Anda telah dinonaktifkan. Silakan hubungi administrator untuk bantuan."


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency that extracts, validates JWT Bearer token, and enforces active account status."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak ditemukan atau tidak valid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split(" ", 1)
    token = parts[1].strip() if len(parts) > 1 else ""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak ditemukan atau tidak valid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi Anda telah berakhir. Silakan masuk kembali.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak sah. Silakan masuk kembali.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    raw_user_id = payload.get("sub")
    try:
        normalized_user_id = str(uuid.UUID(str(raw_user_id)))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak sah.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = user_storage.find_by_id(normalized_user_id)
    except psycopg2.Error as exc:
        logger.error(f"Database error in get_current_user: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Layanan basis data sedang tidak tersedia. Silakan coba beberapa saat lagi.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun tidak ditemukan atau telah dihapus.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if (user.get("status") or "active") != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_format_inactive_status_message(user),
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@auth_router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, request: Request):
    """
    Registers a new researcher user with @gmail.com email, Argon2id-hashed password,
    and returns an initial JWT token.
    """
    client_ip = get_client_ip(request)
    is_limited, retry_after = register_rate_limiter.is_rate_limited(client_ip)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan pendaftaran. Silakan coba kembali dalam {retry_after} detik.",
            headers={"Retry-After": str(retry_after)},
        )

    register_rate_limiter.record_attempt(client_ip)

    try:
        user = user_storage.create_user(
            full_name=req.full_name,
            email=req.email,
            plain_password=req.password,
            institution=req.institution,
        )
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )
    except psycopg2.Error as exc:
        logger.error(f"Database error during registration: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Layanan pendaftaran sedang mengalami gangguan koneksi basis data. Silakan coba lagi.",
        )

    token, expires_at = create_access_token_with_meta(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
        remember_me=False,
    )

    return AuthResponse(
        token=token,
        token_type="bearer",
        expires_at=expires_at,
        user=_build_user_response(user),
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, request: Request):
    """
    Validates user credentials with dual-key Rate Limiting protection,
    constant-time password check, account status enforcement, and returns JWT token.
    """
    client_ip = get_client_ip(request)
    rate_key = f"{client_ip}:{req.email}"

    # 1. Check Rate Limiters (per IP+email and global IP ceiling)
    is_limited_pair, retry_after_pair = login_rate_limiter.is_rate_limited(rate_key)
    is_limited_ip, retry_after_ip = login_ip_rate_limiter.is_rate_limited(client_ip)
    if is_limited_pair or is_limited_ip:
        retry_after = max(retry_after_pair, retry_after_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan gagal. Silakan coba kembali dalam {retry_after} detik.",
            headers={"Retry-After": str(retry_after)},
        )

    # 2. Fetch User & Exact Argon2id Verification (constant-time mitigation)
    try:
        user = user_storage.find_by_email(req.email)
    except psycopg2.Error as exc:
        logger.error(f"Database error during login: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Layanan autentikasi sedang mengalami gangguan koneksi basis data. Silakan coba lagi.",
        )

    if user and user.get("password_hash"):
        valid_password = verify_password(req.password, user["password_hash"])
    else:
        verify_password(req.password, DUMMY_PASSWORD_HASH)
        valid_password = False

    if not user or not valid_password:
        login_rate_limiter.record_attempt(rate_key)
        login_ip_rate_limiter.record_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau kata sandi salah.",
        )

    # 3. Enforce account status only after password is verified (prevents enumeration)
    if (user.get("status") or "active") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_format_inactive_status_message(user),
        )

    # 4. Successful login: Reset rate limiter and transparently upgrade Argon2 parameters if needed
    login_rate_limiter.reset(rate_key)

    if user.get("password_hash") and needs_rehash(user["password_hash"]):
        try:
            user_storage.update_password_hash(user["id"], hash_password(req.password))
        except Exception as exc:
            logger.warning(f"Non-fatal Argon2 rehash failure for user {user['id']}: {exc}")

    token, expires_at = create_access_token_with_meta(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
        remember_me=bool(req.remember_me),
    )

    return AuthResponse(
        token=token,
        token_type="bearer",
        expires_at=expires_at,
        user=_build_user_response(user),
    )


@auth_router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Acknowledges user logout so frontend clients can clear tokens and caches cleanly.
    """
    return MessageResponse(
        success=True,
        message="Anda berhasil keluar dari sesi Modellyng.",
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
            headers={"Retry-After": str(retry_after)},
        )

    forgot_rate_limiter.record_attempt(client_ip)

    user = user_storage.find_by_email(req.email)
    dev_reset_url = None

    if user and (user.get("status") or "active") == "active":
        token = user_storage.create_reset_token(req.email, valid_seconds=3600)
        if APP_ENV == "development":
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
    return _build_user_response(current_user)
