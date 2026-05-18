"""
Rate limiting untuk TensiMenu Backend menggunakan slowapi.
Batas: 100 permintaan per menit per pengguna terautentikasi.
Menggunakan user_id dari JWT sebagai kunci rate limit agar per-pengguna.
"""

import logging
from typing import Optional

from fastapi import Request, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


def _get_user_identifier(request: Request) -> str:
    """
    Tentukan kunci rate limit berdasarkan user_id dari JWT.
    Jika pengguna belum terautentikasi, gunakan alamat IP sebagai fallback.

    Strategi ini memastikan rate limit diterapkan per pengguna terautentikasi.
    """
    # Coba ambil user_id dari state request (diisi oleh middleware autentikasi)
    user_id: Optional[str] = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    # Fallback ke alamat IP jika tidak terautentikasi
    return f"ip:{get_remote_address(request)}"


# Instance Limiter utama aplikasi 
limiter = Limiter(
    key_func=_get_user_identifier, # menentukan bagaimana kunci rate limit diidentifikasi
    default_limits=["100/minute"],
    headers_enabled=True,  # Tambahkan header X-RateLimit-* ke respons
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:   
    # Mengembalikan respons JSON terstruktur (bukan HTML default slowapi).

    logger.warning(
        "Rate limit terlampaui untuk %s pada endpoint %s",
        _get_user_identifier(request),
        request.url.path,
    )
    return JSONResponse(
        status_code=429,
        content={
            "error": "Terlalu banyak permintaan. Batas: 100 permintaan per menit.",
            "code": "RATE_LIMIT_EXCEEDED",
            "retry_after": "60",
        },
        headers={
            "Retry-After": "60",
            "X-RateLimit-Limit": "100",
        },
    )
