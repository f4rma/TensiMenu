"""
Pelacakan gagal login dan blokir IP TensiMenu.
Blokir IP selama 15 menit setelah 5 kegagalan dalam 10 menit.
"""

import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 5          # Maksimal gagal login sebelum diblokir
WINDOW_MINUTES = 10       # Jendela waktu penghitungan kegagalan (menit)
BLOCK_MINUTES = 15        # Durasi blokir (menit)


def is_ip_blocked(ip_address: str) -> bool:
    """
    Cek apakah IP sedang diblokir.

    Returns:
        True jika IP diblokir, False jika tidak
    """
    from core.database import get_supabase
    supabase = get_supabase()

    now = datetime.now(timezone.utc).isoformat()

    try:
        response = (
            supabase.table("failed_login_attempts")
            .select("blocked_until")
            .eq("ip_address", ip_address)
            .gt("blocked_until", now)
            .limit(1)
            .execute()
        )
        return bool(response.data)
    except Exception as exc:
        logger.warning("Gagal cek blokir IP %s: %s", ip_address, str(exc))
        return False


def record_failed_login(ip_address: str) -> bool:
    """
    Catat satu kegagalan login untuk IP ini.
    Jika sudah >= MAX_ATTEMPTS dalam WINDOW_MINUTES, blokir IP.

    Returns:
        True jika IP baru saja diblokir, False jika belum
    """
    from core.database import get_supabase
    supabase = get_supabase()

    now = datetime.now(timezone.utc)
    window_start = (now - timedelta(minutes=WINDOW_MINUTES)).isoformat()

    try:
        # Ambil record yang ada untuk IP ini
        response = (
            supabase.table("failed_login_attempts")
            .select("*")
            .eq("ip_address", ip_address)
            .limit(1)
            .execute()
        )

        if response.data:
            record = response.data[0]
            attempt_count = int(record.get("attempt_count", 0)) + 1
            first_attempt = record.get("first_attempt", now.isoformat())

            # Reset jika sudah di luar jendela waktu
            if first_attempt < window_start:
                attempt_count = 1
                first_attempt = now.isoformat()

            blocked_until = None
            just_blocked = False

            if attempt_count >= MAX_ATTEMPTS:
                blocked_until = (now + timedelta(minutes=BLOCK_MINUTES)).isoformat()
                just_blocked = True
                logger.warning(
                    "IP %s diblokir selama %d menit setelah %d kegagalan login.",
                    ip_address, BLOCK_MINUTES, attempt_count,
                )

            supabase.table("failed_login_attempts").update({
                "attempt_count": attempt_count,
                "first_attempt": first_attempt,
                "blocked_until": blocked_until,
                "updated_at": now.isoformat(),
            }).eq("ip_address", ip_address).execute()

            return just_blocked

        else:
            # Buat record baru
            supabase.table("failed_login_attempts").insert({
                "ip_address": ip_address,
                "attempt_count": 1,
                "first_attempt": now.isoformat(),
                "blocked_until": None,
                "updated_at": now.isoformat(),
            }).execute()
            return False

    except Exception as exc:
        logger.warning("Gagal catat kegagalan login untuk IP %s: %s", ip_address, str(exc))
        return False


def reset_failed_login(ip_address: str) -> None:
    """Reset counter kegagalan login setelah login berhasil."""
    from core.database import get_supabase
    supabase = get_supabase()

    try:
        supabase.table("failed_login_attempts").update({
            "attempt_count": 0,
            "blocked_until": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("ip_address", ip_address).execute()
    except Exception as exc:
        logger.warning("Gagal reset login counter untuk IP %s: %s", ip_address, str(exc))
