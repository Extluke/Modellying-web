from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
import re
from typing import Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Nama lengkap pengguna")
    email: str = Field(..., description="Alamat email valid")
    password: str = Field(..., min_length=8, description="Kata sandi minimal 8 karakter")
    confirm_password: str = Field(..., description="Konfirmasi kata sandi")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v.strip()):
            raise ValueError("Format email tidak valid.")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Kata sandi harus minimal 8 karakter.")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Kata sandi harus mengandung minimal 1 huruf.")
        if not re.search(r"\d", v):
            raise ValueError("Kata sandi harus mengandung minimal 1 angka.")
        return v

    @model_validator(mode="after")
    def verify_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Konfirmasi kata sandi tidak cocok dengan kata sandi.")
        return self


class LoginRequest(BaseModel):
    email: str = Field(..., description="Alamat email")
    password: str = Field(..., description="Kata sandi")
    remember_me: Optional[bool] = False

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return v.strip().lower()


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Alamat email terdaftar")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v.strip()):
            raise ValueError("Format email tidak valid.")
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=6, description="Token reset kata sandi unik")
    new_password: str = Field(..., min_length=8, description="Kata sandi baru minimal 8 karakter")
    confirm_password: str = Field(..., description="Konfirmasi kata sandi baru")

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Kata sandi harus minimal 8 karakter.")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Kata sandi harus mengandung minimal 1 huruf.")
        if not re.search(r"\d", v):
            raise ValueError("Kata sandi harus mengandung minimal 1 angka.")
        return v

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
    created_at: str


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    success: bool = True
    message: str
    details: Optional[str] = None
