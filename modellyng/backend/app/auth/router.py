import logging
import uuid
from typing import Optional

import jwt
import psycopg2
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from .email_service import (
    EmailDeliveryError,
    build_password_reset_url,
    build_verification_url,
    send_password_reset_email,
    send_verification_email,
)
from .models import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    UserResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from .security import (
    APP_ENV,
    DUMMY_PASSWORD_HASH,
    create_access_token_with_meta,
    decode_access_token,
    forgot_rate_limiter,
    generate_verification_credentials,
    hash_password,
    hash_verification_secret,
    login_ip_rate_limiter,
    login_rate_limiter,
    needs_rehash,
    register_rate_limiter,
    resend_verification_ip_rate_limiter,
    resend_verification_rate_limiter,
    verify_email_rate_limiter,
    verify_password,
)
from .storage import DuplicateEmailError, UnverifiedEmailExistsError, user_storage

logger = logging.getLogger("modellyng.auth.router")

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

VERIFICATION_TTL_SECONDS = 900  # 15 minutes
RESEND_COOLDOWN_SECONDS = 60    # 60 seconds
MAX_OTP_ATTEMPTS = 5


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
        email_verified=bool(user.get("email_verified", True)),
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


def _issue_and_send_verification(user: dict) -> tuple[str, Optional[str], Optional[str]]:
    """
    Generates fresh OTP + Magic Link token, stores SHA-256 hashes, sends email,
    and returns (delivery_channel, dev_code, dev_url).
    """
    raw_token, otp_code = generate_verification_credentials()
    token_hash = hash_verification_secret(raw_token)
    otp_hash = hash_verification_secret(otp_code, salt=user["email"])

    user_storage.create_email_verification(
        user_id=user["id"],
        email=user["email"],
        token_hash=token_hash,
        otp_code_hash=otp_hash,
        valid_seconds=VERIFICATION_TTL_SECONDS,
    )

    verification_url = build_verification_url(raw_token)
    delivery = send_verification_email(
        to_email=user["email"],
        full_name=user.get("full_name") or "Peneliti",
        otp_code=otp_code,
        verification_url=verification_url,
        expires_minutes=VERIFICATION_TTL_SECONDS // 60,
    )

    is_dev_preview = APP_ENV == "development" and delivery.channel == "dev_preview"
    return (
        delivery.channel,
        otp_code if is_dev_preview else None,
        verification_url if is_dev_preview else None,
    )


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency that extracts and validates JWT Bearer token,
    and enforces both active account status and verified email.
    """
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

    if not user.get("email_verified", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email Anda belum diverifikasi. Silakan selesaikan verifikasi email terlebih dahulu.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@auth_router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, request: Request):
    """
    Registers a new researcher user with @gmail.com email, Argon2id-hashed password,
    sends a verification email (6-digit OTP + 1-click Magic Link), and requires
    verification before login (no JWT issued at registration).
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
            email_verified=False,
        )
    except UnverifiedEmailExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "EMAIL_UNVERIFIED",
                "message": str(exc),
                "email": req.email,
            },
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

    try:
        channel, dev_code, dev_url = _issue_and_send_verification(user)
    except EmailDeliveryError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except psycopg2.Error as exc:
        logger.error(f"Database error creating verification token: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gagal menyiapkan kode verifikasi email. Silakan gunakan tombol kirim ulang verifikasi.",
        )

    return RegisterResponse(
        requires_verification=True,
        message=(
            f"Pendaftaran berhasil! Kode verifikasi 6 digit dan tautan konfirmasi telah dikirim ke {user['email']}."
        ),
        email=user["email"],
        expires_in_seconds=VERIFICATION_TTL_SECONDS,
        resend_cooldown_seconds=RESEND_COOLDOWN_SECONDS,
        delivery_channel=channel,
        dev_verification_code=dev_code,
        dev_verification_url=dev_url,
        user=_build_user_response(user),
    )


@auth_router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(req: VerifyEmailRequest, request: Request):
    """
    Verifies a registered Gmail address via either a 1-click magic link token
    or a 6-digit OTP code, then redirects user to /login.
    """
    client_ip = get_client_ip(request)
    is_limited, retry_after = verify_email_rate_limiter.is_rate_limited(client_ip)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan verifikasi. Silakan coba kembali dalam {retry_after} detik.",
            headers={"Retry-After": str(retry_after)},
        )

    verified_user: Optional[dict] = None

    try:
        if req.token and req.token.strip():
            token_hash = hash_verification_secret(req.token.strip())
            verified_user = user_storage.verify_email_by_token_hash(token_hash)
            if not verified_user:
                verify_email_rate_limiter.record_attempt(client_ip)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tautan verifikasi tidak valid atau telah kedaluwarsa. Silakan minta kode verifikasi baru.",
                )
        else:
            assert req.email is not None and req.code is not None
            otp_hash = hash_verification_secret(req.code, salt=req.email)
            outcome, verified_user = user_storage.verify_email_by_otp(
                email=req.email,
                otp_code_hash=otp_hash,
                max_attempts=MAX_OTP_ATTEMPTS,
            )
            if outcome == "expired":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Kode verifikasi telah kedaluwarsa. Silakan kirim ulang kode verifikasi baru.",
                )
            if outcome == "too_many_attempts":
                verify_email_rate_limiter.record_attempt(client_ip)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Batas percobaan kode salah (5 kali) tercapai. Kode lama dibatalkan, silakan kirim ulang kode baru.",
                )
            if outcome != "verified" or not verified_user:
                verify_email_rate_limiter.record_attempt(client_ip)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Kode verifikasi tidak valid. Periksa kembali 6 digit kode pada kotak masuk Gmail Anda.",
                )
    except HTTPException:
        raise
    except psycopg2.Error as exc:
        logger.error(f"Database error during verify_email: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Layanan verifikasi sedang mengalami gangguan koneksi basis data. Silakan coba lagi.",
        )

    verify_email_rate_limiter.reset(client_ip)

    return VerifyEmailResponse(
        success=True,
        verified=True,
        email=verified_user["email"],
        message="Email berhasil diverifikasi! Silakan masuk menggunakan email dan kata sandi Anda.",
    )


@auth_router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(req: ResendVerificationRequest, request: Request):
    """
    Resends a fresh 6-digit OTP & magic link with 60s per-email cooldown.
    Uses generic response for unknown/already-verified emails to avoid account enumeration.
    """
    client_ip = get_client_ip(request)
    rate_key = f"{client_ip}:{req.email}"

    is_limited_pair, retry_after_pair = resend_verification_rate_limiter.is_rate_limited(rate_key)
    is_limited_ip, retry_after_ip = resend_verification_ip_rate_limiter.is_rate_limited(client_ip)
    if is_limited_pair or is_limited_ip:
        retry_after = max(retry_after_pair, retry_after_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Mohon tunggu {retry_after} detik sebelum mengirim ulang kode verifikasi.",
            headers={"Retry-After": str(retry_after)},
        )

    resend_verification_rate_limiter.record_attempt(rate_key)
    resend_verification_ip_rate_limiter.record_attempt(client_ip)

    try:
        user = user_storage.find_by_email(req.email)
    except psycopg2.Error as exc:
        logger.error(f"Database error during resend_verification: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Layanan verifikasi sedang mengalami gangguan koneksi basis data. Silakan coba lagi.",
        )

    channel: Optional[str] = None
    dev_code: Optional[str] = None
    dev_url: Optional[str] = None

    if user and not user.get("email_verified", True) and (user.get("status") or "active") == "active":
        try:
            channel, dev_code, dev_url = _issue_and_send_verification(user)
        except EmailDeliveryError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            )

    return ResendVerificationResponse(
        success=True,
        message="Jika email terdaftar dan belum diverifikasi, kode verifikasi baru telah dikirim ke kotak masuk Gmail Anda.",
        resend_cooldown_seconds=RESEND_COOLDOWN_SECONDS,
        expires_in_seconds=VERIFICATION_TTL_SECONDS,
        delivery_channel=channel,
        dev_verification_code=dev_code,
        dev_verification_url=dev_url,
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, request: Request):
    """
    Validates user credentials with dual-key Rate Limiting protection,
    constant-time password check, account status enforcement, verified-email check,
    and returns JWT token.
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

    # 4. Enforce email verification only after password & status checks pass
    if not user.get("email_verified", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "EMAIL_NOT_VERIFIED",
                "message": "Email Anda belum diverifikasi. Silakan periksa kotak masuk Gmail Anda atau selesaikan verifikasi sekarang.",
                "email": user["email"],
            },
        )

    # 5. Successful login: Reset rate limiter and transparently upgrade Argon2 parameters if needed
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
    Generates a secure temporary reset token (valid for 1 hour) and delivers via SMTP/Mailpit when available.
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
        reset_url = build_password_reset_url(token)
        try:
            delivery = send_password_reset_email(
                to_email=user["email"],
                reset_url=reset_url,
                expires_minutes=60,
            )
            if APP_ENV == "development" and delivery.channel == "dev_preview":
                dev_reset_url = reset_url
        except EmailDeliveryError:
            if APP_ENV == "development":
                dev_reset_url = reset_url

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
