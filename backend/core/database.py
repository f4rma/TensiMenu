# Koneksi ke Supabase untuk TensiMenu Backend.
import asyncio
import logging
from typing import Optional

from fastapi import HTTPException, status
from supabase import create_client, Client

from .config import get_settings

logger = logging.getLogger(__name__)

# Instance Supabase client (singleton)
_supabase_client: Optional[Client] = None


def _create_supabase_client() -> Client:
    """
    Buat instance Supabase client menggunakan service role key.
    Service role key digunakan untuk operasi server-side yang melewati RLS
    saat diperlukan, namun RLS tetap aktif untuk operasi berbasis user_id.
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
    )


def get_supabase() -> Client:
    """
    Kembalikan Supabase client singleton.
    Buat client baru jika belum ada.
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = _create_supabase_client()
    return _supabase_client


async def get_supabase_with_retry() -> Client:
    """
    Kembalikan Supabase client dengan retry logic eksponensial.
    Percobaan: 3 kali dengan jeda 1s, 2s, 4s.
    Melempar HTTPException 503 jika semua percobaan gagal (Req. 11.3).
    """
    settings = get_settings()
    max_attempts = settings.DB_RETRY_ATTEMPTS
    base_delay = settings.DB_RETRY_BASE_DELAY
    last_error: Optional[Exception] = None

    for attempt in range(1, max_attempts + 1):
        try:
            client = get_supabase()
            # Lakukan ping ringan untuk memverifikasi koneksi aktif
            await _ping_database(client)
            return client
        except Exception as exc:
            last_error = exc
            delay = base_delay * (2 ** (attempt - 1))  # 1s, 2s, 4s
            logger.warning(
                "Koneksi database gagal (percobaan %d/%d). "
                "Mencoba ulang dalam %.1f detik. Error: %s",
                attempt,
                max_attempts,
                delay,
                str(exc),
            )
            if attempt < max_attempts:
                await asyncio.sleep(delay)

    # Semua percobaan gagal — kembalikan HTTP 503
    logger.error(
        "Koneksi database gagal setelah %d percobaan. Error terakhir: %s",
        max_attempts,
        str(last_error),
    )
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "error": "Layanan database tidak tersedia. Silakan coba lagi nanti.",
            "code": "DATABASE_UNAVAILABLE",
        },
    )


async def _ping_database(client: Client) -> None:
    # Lakukan query ringan untuk memverifikasi koneksi database aktif. Menggunakan tabel food_items karena tidak memerlukan autentikasi khusus.
    # Query minimal: ambil 1 baris dari tabel yang selalu ada
    response = client.table("food_items").select("id").limit(1).execute()
    # Jika tidak ada exception, koneksi berhasil
    _ = response


async def check_database_connectivity() -> bool:
    """
    Periksa konektivitas database tanpa melempar exception.
    Digunakan oleh health check endpoint (Req. 12.6).
    Mengembalikan True jika terhubung, False jika tidak.
    """
    try:
        client = get_supabase()
        await _ping_database(client)
        return True
    except Exception as exc:
        logger.warning("Health check database gagal: %s", str(exc))
        return False
