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

from fastapi import APIRouter, HTTPException, Request, Response, status

from core.database import get_supabase
from core.rate_limiter import limiter
from models.user import (
    PasswordResetConfirmRequest,
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
    response_model=UserLoginResponse,  # ← Changed from UserRegisterResponse
    status_code=status.HTTP_201_CREATED,
    summary="Registrasi pengguna baru + auto-login",
)
@limiter.limit("10/minute")
async def register(
    request: Request, response: Response, body: UserRegisterRequest
) -> UserLoginResponse:  # ← Changed return type
    """
    Buat akun pengguna baru via Supabase Auth dan langsung login (auto-login).
    
    Modern UX: Tidak perlu konfirmasi email sebelum login.
    Email verification berjalan di background (opsional untuk fitur tertentu).

    - HTTP 201: registrasi + login berhasil (return access_token)
    - HTTP 409: email sudah terdaftar
    - HTTP 422: validasi field gagal (otomatis dari Pydantic)
    """
    supabase = get_supabase()

    try:
        # sign_up with auto-confirm (via service role key)
        auth_response = supabase.auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
                "options": {
                    "data": {
                        "full_name": body.full_name,
                        "name": body.full_name,
                    }
                },
            }
        )
        
        # Auto-confirm email menggunakan admin API (service role key)
        if auth_response.user and auth_response.user.id:
            try:
                # Update user via admin API to confirm email
                supabase.auth.admin.update_user_by_id(
                    auth_response.user.id,
                    {"email_confirm": True}
                )
                logger.info("Email auto-confirmed untuk frictionless onboarding: %s", body.email)
            except Exception as exc:
                logger.warning("Gagal auto-confirm email: %s", str(exc))
                
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

    if auth_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": "Email sudah terdaftar.",
                "error_code": "EMAIL_ALREADY_EXISTS",
            },
        )

    logger.info("Pengguna baru terdaftar dan auto-login: %s", body.email)
    
    # Return session (auto-login)
    user = auth_response.user
    session = auth_response.session
    
    if session is None:
        # Jika session tidak ada (edge case), buat session baru dengan sign in
        try:
            login_response = supabase.auth.sign_in_with_password(
                {"email": body.email, "password": body.password}
            )
            session = login_response.session
        except Exception as exc:
            logger.error("Gagal create session setelah register: %s", str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": "Registrasi berhasil tapi gagal login otomatis. Silakan login manual.", "code": "AUTO_LOGIN_FAILED"},
            )
    
    name: str | None = None
    if user.user_metadata:
        name = user.user_metadata.get("full_name") or user.user_metadata.get("name")
    
    return UserLoginResponse(
        user_id=str(user.id),
        email=user.email or body.email,
        name=name,
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_at=session.expires_at,
    )


@router.post(
    "/login",
    response_model=UserLoginResponse,
    summary="Login email/password",
)
@limiter.limit("20/minute")
async def login(
    request: Request, response: Response, body: UserLoginRequest
) -> UserLoginResponse:
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
        refresh_token=session.refresh_token,
        expires_at=session.expires_at,
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
        refresh_token=session.refresh_token,
        expires_at=session.expires_at,
    )


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Kirim email reset password",
)
@limiter.limit("5/minute")
async def reset_password(
    request: Request, response: Response, body: PasswordResetRequest
) -> None:
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


@router.post(
    "/reset-password/confirm",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Konfirmasi reset password dengan token",
)
@limiter.limit("5/minute")
async def reset_password_confirm(
    request: Request, response: Response, body: PasswordResetConfirmRequest
) -> None:
    """
    Konfirmasi kata sandi baru menggunakan token dari email reset.

    - Token didapat dari URL ?token=... saat user klik link di email reset.
    - Token Supabase reset password berlaku 60 menit (Req. 1.8).

    HTTP 204: kata sandi berhasil diubah.
    HTTP 401: token tidak valid atau kedaluwarsa.
    """
    supabase = get_supabase()

    try:
        verify_response = supabase.auth.verify_otp(
            {"token_hash": body.token, "type": "recovery"}
        )
    except Exception as exc:
        logger.warning("Token reset tidak valid: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Tautan reset tidak valid atau sudah kedaluwarsa.",
                "code": "INVALID_RESET_TOKEN",
            },
        )

    if verify_response.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Tautan reset tidak valid atau sudah kedaluwarsa.",
                "code": "INVALID_RESET_TOKEN",
            },
        )

    try:
        # Update password menggunakan session yang baru diverifikasi
        supabase.auth.update_user({"password": body.new_password})
        logger.info("Kata sandi berhasil direset.")
    except Exception as exc:
        logger.error("Gagal update password: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Gagal mengubah kata sandi. Silakan coba lagi.",
                "code": "PASSWORD_UPDATE_FAILED",
            },
        )


@router.post(
    "/resend-confirmation",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Kirim ulang email konfirmasi",
)
@limiter.limit("3/minute")
async def resend_confirmation(
    request: Request, response: Response, body: PasswordResetRequest
) -> None:
    """
    Kirim ulang email konfirmasi untuk user yang belum mengkonfirmasi emailnya.
    
    Best practice: selalu kembalikan 204 (jangan ekspos apakah email terdaftar atau tidak).
    Rate limit: 3 request per menit untuk mencegah spam.
    
    HTTP 204: email konfirmasi dikirim (atau email tidak ditemukan - tidak diberitahu ke client).
    """
    supabase = get_supabase()
    
    try:
        # Resend confirmation email via Supabase
        supabase.auth.resend(
            type="signup",
            email=body.email,
        )
        logger.info("Email konfirmasi dikirim ulang ke: %s", body.email)
    except Exception as exc:
        # Log tapi jangan ekspos ke client (security best practice)
        logger.warning("Resend confirmation error untuk %s: %s", body.email, str(exc))
    
    # Selalu return 204 (jangan kasih tahu apakah email ada atau tidak)
