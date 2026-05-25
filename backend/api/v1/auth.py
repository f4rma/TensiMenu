"""
Endpoint autentikasi TensiMenu.
POST /api/v1/auth/register  — registrasi pengguna baru
POST /api/v1/auth/login     — login email/password
POST /api/v1/auth/logout    — invalidasi sesi
POST /api/v1/auth/refresh   — refresh JWT token
POST /api/v1/auth/reset-password — kirim email reset
"""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request, status

from core.database import get_supabase
from core.rate_limiter import limiter
from models.user import (
    PasswordResetRequest,
    TokenRefreshRequest,
    UserLoginRequest,
    UserLoginResponse,
    UserRegisterRequest,
    UserRegisterResponse,
)
from services.login_guard import is_ip_blocked, record_failed_login, reset_failed_login

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

# Pesan error generik — tidak mengekspos detail spesifik (Req. 1.5)
_INVALID_CREDENTIALS_MSG = "Email atau kata sandi salah."
_INVALID_CREDENTIALS_CODE = "INVALID_CREDENTIALS"


@router.post(
    "/register",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrasi pengguna baru",
)
@limiter.limit("10/minute")
async def register(request: Request, body: UserRegisterRequest) -> UserRegisterResponse:
    """
    Buat akun pengguna baru via Supabase Auth.

    - HTTP 201: registrasi berhasil
    - HTTP 409: email sudah terdaftar
    - HTTP 422: validasi field gagal (otomatis dari Pydantic)
    """
    supabase = get_supabase()

    try:
        response = supabase.auth.sign_up(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        error_msg = str(exc).lower()
        if "already registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "detail": "Email sudah terdaftar.",
                    "error_code": "EMAIL_ALREADY_EXISTS",
                },
            )
        logger.error("Registrasi gagal untuk %s: %s", body.email, str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Registrasi gagal. Silakan coba lagi.", "code": "REGISTER_FAILED"},
        )

    if response.user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": "Email sudah terdaftar.",
                "error_code": "EMAIL_ALREADY_EXISTS",
            },
        )

    logger.info("Pengguna baru terdaftar: %s", body.email)
    return UserRegisterResponse(
        user_id=str(response.user.id),
        email=response.user.email or body.email,
    )


@router.post(
    "/login",
    response_model=UserLoginResponse,
    summary="Login email/password",
)
@limiter.limit("20/minute")
async def login(request: Request, body: UserLoginRequest) -> UserLoginResponse:
    """
    Login dengan email dan password via Supabase Auth.
    Blokir IP selama 15 menit setelah 5 kegagalan dalam 10 menit.

    - HTTP 200: login berhasil, kembalikan access_token
    - HTTP 401: kredensial tidak valid (pesan generik)
    - HTTP 429: IP diblokir sementara
    """
    supabase = get_supabase()
    client_ip = request.client.host if request.client else "unknown"

    # Cek apakah IP sedang diblokir
    if is_ip_blocked(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
                "code": "IP_BLOCKED",
            },
        )

    try:
        response = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        logger.warning("Login gagal untuk %s: %s", body.email, str(exc))
        record_failed_login(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": _INVALID_CREDENTIALS_MSG,
                "code": _INVALID_CREDENTIALS_CODE,
            },
        )

    if response.user is None or response.session is None:
        record_failed_login(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": _INVALID_CREDENTIALS_MSG,
                "code": _INVALID_CREDENTIALS_CODE,
            },
        )

    # Login berhasil — reset counter
    reset_failed_login(client_ip)

    user = response.user
    session = response.session
    name: str | None = None
    if user.user_metadata:
        name = user.user_metadata.get("full_name") or user.user_metadata.get("name")

    logger.info("Login berhasil: %s", body.email)
    return UserLoginResponse(
        user_id=str(user.id),
        email=user.email or body.email,
        name=name,
        access_token=session.access_token,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout / invalidasi sesi",
)
async def logout(request: Request) -> None:
    """
    Invalidasi sesi aktif pengguna.
    Token yang sudah di-logout tidak dapat digunakan lagi.
    """
    supabase = get_supabase()
    try:
        supabase.auth.sign_out()
    except Exception as exc:
        logger.warning("Logout error (diabaikan): %s", str(exc))
    # Selalu kembalikan 204 meskipun token sudah tidak valid


@router.post(
    "/refresh",
    response_model=UserLoginResponse,
    summary="Refresh JWT token",
)
async def refresh_token(body: TokenRefreshRequest) -> UserLoginResponse:
    """
    Perbarui access_token menggunakan refresh_token yang masih valid.
    """
    supabase = get_supabase()

    try:
        response = supabase.auth.refresh_session(body.refresh_token)
    except Exception as exc:
        logger.warning("Refresh token gagal: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Refresh token tidak valid atau kedaluwarsa.", "code": "INVALID_REFRESH_TOKEN"},
        )

    if response.user is None or response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Refresh token tidak valid.", "code": "INVALID_REFRESH_TOKEN"},
        )

    user = response.user
    session = response.session
    name: str | None = None
    if user.user_metadata:
        name = user.user_metadata.get("full_name") or user.user_metadata.get("name")

    return UserLoginResponse(
        user_id=str(user.id),
        email=user.email or "",
        name=name,
        access_token=session.access_token,
    )


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Kirim email reset password",
)
@limiter.limit("5/minute")
async def reset_password(request: Request, body: PasswordResetRequest) -> None:
    """
    Kirim email reset password ke alamat yang diberikan.
    Link reset kedaluwarsa dalam 60 menit.
    Selalu kembalikan 204 meskipun email tidak terdaftar (mencegah user enumeration).
    """
    supabase = get_supabase()
    try:
        supabase.auth.reset_password_email(body.email)
        logger.info("Email reset password dikirim ke: %s", body.email)
    except Exception as exc:
        # Log tapi jangan ekspos ke client
        logger.warning("Reset password error untuk %s: %s", body.email, str(exc))
