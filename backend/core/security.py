"""
Keamanan dan validasi JWT untuk TensiMenu Backend.
Memvalidasi token JWT yang diterbitkan oleh Supabase Auth.
Mengembalikan HTTP 401 untuk token tidak valid atau kedaluwarsa (Req. 10.3).
"""

import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from .config import get_settings

logger = logging.getLogger(__name__)

# Skema autentikasi Bearer token
bearer_scheme = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    # Payload JWT Supabase yang telah divalidasi. Field 'sub' berisi user_id (UUID) dari Supabase Auth.
    sub: str          # user_id (UUID)
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None


def _decode_jwt(token: str) -> TokenPayload:
    # Dekode dan validasi token JWT menggunakan Supabase JWT secret. Melempar HTTPException 401 jika token tidak valid atau kedaluwarsa.
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False},  # Supabase tidak selalu menyertakan 'aud'
        )
        return TokenPayload(**payload)
    except JWTError as exc:
        logger.warning("Validasi JWT gagal: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Token autentikasi tidak valid atau telah kedaluwarsa.",
                "code": "INVALID_TOKEN",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> TokenPayload:
    # Dependency FastAPI untuk mendapatkan pengguna yang sedang login. Memvalidasi Bearer token dari header Authorization.
    """
    Mengembalikan TokenPayload berisi user_id dan informasi sesi.
    Kemudian melempar HTTPException 401 jika:
    - Header Authorization tidak ada
    - Token tidak valid
    - Token telah kedaluwarsa

    Digunakan sebagai dependency di semua endpoint yang memerlukan autentikasi.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Header Authorization tidak ditemukan. Sertakan Bearer token.",
                "code": "MISSING_TOKEN",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _decode_jwt(credentials.credentials)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[TokenPayload]:
    # Dependency opsional — tidak melempar error jika token tidak ada. Digunakan untuk endpoint yang dapat diakses dengan atau tanpa autentikasi.
    if credentials is None:
        return None
    try:
        return _decode_jwt(credentials.credentials)
    except HTTPException:
        return None
