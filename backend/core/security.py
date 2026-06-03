"""
Keamanan dan validasi JWT untuk TensiMenu Backend.

Mendukung dua skema JWT Supabase:
1. **Legacy HS256** (Shared Secret) — versi lama, dipakai sampai 2024
2. **Modern ES256** (ECDSA P-256) — versi baru, default Supabase 2025+

Validasi otomatis pilih skema berdasarkan header `alg` di token.
Public key untuk ES256 di-fetch dari JWKS endpoint Supabase dan di-cache.

Mengembalikan HTTP 401 untuk token tidak valid atau kedaluwarsa (Req. 10.3).
"""

import logging
from typing import Any, Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwk, jwt
from jose.exceptions import JWTError
from pydantic import BaseModel

from .config import get_settings

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)

# Algoritma yang didukung
SUPPORTED_ALGORITHMS = ["HS256", "ES256", "RS256"]

# Cache JWKS (public keys) — di-fetch sekali saat startup atau saat key rotation
_jwks_cache: Optional[dict[str, Any]] = None


def _get_jwks_url() -> str:
    """Bangun URL JWKS endpoint Supabase berdasarkan SUPABASE_URL."""
    settings = get_settings()
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}/auth/v1/.well-known/jwks.json"


def _fetch_jwks() -> dict[str, Any]:
    """
    Fetch JWKS dari Supabase endpoint dan cache hasilnya.
    Refresh otomatis kalau key tidak ditemukan (kasus rotation).
    """
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    url = _get_jwks_url()
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(url)
            response.raise_for_status()
            _jwks_cache = response.json()
            logger.info(
                "JWKS dimuat dari %s (%d keys)",
                url,
                len(_jwks_cache.get("keys", [])),
            )
            return _jwks_cache
    except Exception as exc:
        logger.error("Gagal fetch JWKS dari %s: %s", url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Tidak dapat memvalidasi token autentikasi.",
                "code": "AUTH_SERVICE_UNAVAILABLE",
            },
        )


def _find_key(kid: str) -> Optional[dict[str, Any]]:
    """Cari public key dengan key ID yang cocok dari JWKS cache."""
    jwks = _fetch_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    
    # Tidak ketemu — refresh cache (kasus rotation)
    logger.info("Key kid '%s' tidak ditemukan di cache, refresh JWKS...", kid)
    global _jwks_cache
    _jwks_cache = None
    jwks = _fetch_jwks()
    
    # Log semua kid yang tersedia untuk debugging
    available_kids = [k.get("kid") for k in jwks.get("keys", [])]
    logger.warning(
        "Kid '%s' tidak ditemukan. Available kids: %s",
        kid,
        available_kids,
    )
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


class TokenPayload(BaseModel):
    """
    Payload JWT Supabase yang telah divalidasi.
    Field 'sub' berisi user_id (UUID) dari Supabase Auth.
    """

    sub: str
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None


def _decode_jwt(token: str) -> TokenPayload:
    """
    Dekode dan validasi token JWT.
    Otomatis pilih skema HS256 (legacy) atau ES256 (modern) berdasarkan header.
    
    Fallback strategy:
    1. Coba dengan public key dari JWKS (jika ada kid)
    2. Jika kid tidak ditemukan, fallback ke HS256 dengan JWT_SECRET
    """
    settings = get_settings()

    # Baca header tanpa verifikasi untuk identifikasi alg dan kid
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        logger.warning("Gagal baca JWT header: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Format token tidak valid.",
                "code": "INVALID_TOKEN_FORMAT",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = header.get("alg", "HS256")
    kid = header.get("kid")

    if alg not in SUPPORTED_ALGORITHMS:
        logger.warning("Algoritma JWT tidak didukung: %s", alg)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Algoritma token tidak didukung.",
                "code": "UNSUPPORTED_ALG",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        if alg == "HS256":
            # Legacy: verify dengan SUPABASE_JWT_SECRET (shared secret)
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Modern (ES256/RS256): verify dengan public key dari JWKS
            if not kid:
                raise JWTError("Token modern tanpa key ID (kid)")

            key_data = _find_key(kid)
            if key_data is None:
                # Fallback: Coba dengan HS256 untuk token lama yang masih valid
                logger.warning("⚠️  Kid '%s' tidak ditemukan di JWKS, mencoba fallback HS256...", kid)
                try:
                    payload = jwt.decode(
                        token,
                        settings.SUPABASE_JWT_SECRET,
                        algorithms=["HS256"],
                        options={"verify_aud": False},
                    )
                    logger.info("✅ Token berhasil divalidasi dengan fallback HS256")
                except JWTError as fallback_exc:
                    logger.warning("❌ Fallback HS256 juga gagal: %s", str(fallback_exc))
                    raise JWTError(f"Public key dengan kid '{kid}' tidak ditemukan dan fallback HS256 gagal")
            else:
                public_key = jwk.construct(key_data)
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=[alg],
                    options={"verify_aud": False},
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
    """
    Dependency FastAPI untuk mendapatkan pengguna yang sedang login.
    Memvalidasi Bearer token dari header Authorization.

    Mengembalikan TokenPayload berisi user_id dan informasi sesi.
    Melempar HTTPException 401 jika:
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
    """
    Dependency opsional — tidak melempar error jika token tidak ada.
    Digunakan untuk endpoint yang dapat diakses dengan atau tanpa autentikasi.
    """
    if credentials is None:
        return None
    try:
        return _decode_jwt(credentials.credentials)
    except HTTPException:
        return None
