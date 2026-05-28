"""
Pydantic models untuk autentikasi pengguna TensiMenu.
"""

from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Request body untuk registrasi pengguna baru."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)


class UserRegisterResponse(BaseModel):
    """Response setelah registrasi berhasil."""

    user_id: str
    email: str
    message: str = "Registrasi berhasil. Silakan login."


class UserLoginRequest(BaseModel):
    """Request body untuk login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class UserLoginResponse(BaseModel):
    """Response setelah login berhasil."""

    user_id: str
    email: str
    name: str | None = None
    access_token: str
    refresh_token: str | None = None
    expires_at: int | None = None  # Unix timestamp (detik) kapan access_token expired
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Request body untuk refresh token."""

    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Request body untuk reset password."""

    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    """Request body untuk konfirmasi reset password dengan token dari email."""

    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
