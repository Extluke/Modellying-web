import os
import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

BASIC_EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
GMAIL_EMAIL_REGEX = re.compile(r"^(?!.*\.\.)[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?@gmail\.com$")
INTERNAL_LOCAL_PART_REGEX = re.compile(r"^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$")


def _get_internal_login_domains() -> set[str]:
    raw = os.getenv("AUTH_INTERNAL_EMAIL_DOMAINS", "modellyng.ac.id")
    return {part.strip().lower() for part in raw.split(",") if part.strip()}


def validate_gmail_only(value: str) -> str:
    """Strictly permits Google (@gmail.com) addresses for public registration."""
    cleaned = value.strip().lower()
    if not cleaned or len(cleaned) > 255 or not BASIC_EMAIL_REGEX.match(cleaned):
        raise ValueError("Format email tidak valid (contoh: nama@gmail.com).")
    if not GMAIL_EMAIL_REGEX.match(cleaned):
        raise ValueError("Hanya alamat email Google (@gmail.com) yang diperbolehkan untuk mendaftar.")
    return cleaned


def validate_login_email(value: str) -> str:
    """
    Permits Google (@gmail.com) addresses and configured internal seeded domains
    (e.g. @modellyng.ac.id) for login and password recovery.
    """
    cleaned = value.strip().lower()
    if not cleaned or len(cleaned) > 255 or not BASIC_EMAIL_REGEX.match(cleaned):
        raise ValueError("Format email tidak valid (contoh: nama@gmail.com).")
    if GMAIL_EMAIL_REGEX.match(cleaned):
        return cleaned

    local, domain = cleaned.rsplit("@", 1)
    if (
        domain in _get_internal_login_domains()
        and ".." not in local
        and INTERNAL_LOCAL_PART_REGEX.match(local)
    ):
        return cleaned

    raise ValueError("Hanya alamat email Google (@gmail.com) yang diperbolehkan.")


def _validate_password_strength_rules(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Kata sandi harus minimal 8 karakter.")
    if len(password) > 128:
        raise ValueError("Kata sandi maksimal 128 karakter.")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Kata sandi harus mengandung minimal 1 huruf.")
    if not re.search(r"\d", password):
        raise ValueError("Kata sandi harus mengandung minimal 1 angka.")
    return password


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Nama lengkap pengguna")
    email: str = Field(..., max_length=255, description="Alamat email Google (@gmail.com) valid")
    institution: Optional[str] = Field(default=None, max_length=150, description="Institusi atau universitas (opsional)")
    password: str = Field(..., min_length=8, max_length=128, description="Kata sandi minimal 8 karakter")
    confirm_password: str = Field(..., max_length=128, description="Konfirmasi kata sandi")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Nama lengkap minimal 2 karakter.")
        if len(cleaned) > 100:
            raise ValueError("Nama lengkap maksimal 100 karakter.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        return validate_gmail_only(v)

    @field_validator("institution")
    @classmethod
    def normalize_institution(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if len(cleaned) > 150:
            raise ValueError("Nama institusi maksimal 150 karakter.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        return _validate_password_strength_rules(v)

    @model_validator(mode="after")
    def verify_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Konfirmasi kata sandi tidak cocok dengan kata sandi.")
        return self


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255, description="Alamat email")
    password: str = Field(..., min_length=1, max_length=128, description="Kata sandi")
    remember_me: bool = False

    @field_validator("email")
    @classmethod
    def clean_and_validate_email(cls, v: str) -> str:
        return validate_login_email(v)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., max_length=255, description="Alamat email terdaftar")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return validate_login_email(v)


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=6, description="Token reset kata sandi unik")
    new_password: str = Field(..., min_length=8, max_length=128, description="Kata sandi baru minimal 8 karakter")
    confirm_password: str = Field(..., max_length=128, description="Konfirmasi kata sandi baru")

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        return _validate_password_strength_rules(v)

    @model_validator(mode="after")
    def verify_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.")
        return self


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str = "researcher"
    subscription_tier: str = "free"
    institution: Optional[str] = None
    status: str = "active"
    citation_format: str = "APA"
    ai_confidence_threshold: float = 0.80
    admin_role: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_at: Optional[str] = None
    user: UserResponse


class MessageResponse(BaseModel):
    success: bool = True
    message: str
    details: Optional[str] = None
