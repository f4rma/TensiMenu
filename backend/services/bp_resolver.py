"""
Helper untuk menentukan tekanan darah sistolik yang paling representatif
untuk perhitungan target nutrisi.

Strategi:
- Ambil rata-rata sistolik dari N catatan terbaru (default 3) dari tabel
  blood_pressure_records, kalau ada.
- Kalau belum ada catatan, fallback ke profile.systolic_bp (data onboarding).
- Kalau dua-duanya kosong, return None — caller akan pakai target sehat.

Memakai rata-rata (bukan satu reading terakhir) untuk meredam noise:
satu reading tinggi karena stres atau kafein tidak boleh langsung
mengubah target diet user secara drastis.
"""

import logging
from typing import Optional

from core.database import get_supabase

logger = logging.getLogger(__name__)

# Berapa banyak catatan terbaru yang dipertimbangkan saat menghitung rata-rata.
DEFAULT_LOOKBACK_RECORDS = 3


def get_representative_systolic(
    user_id: str,
    profile_systolic: Optional[int] = None,
    lookback: int = DEFAULT_LOOKBACK_RECORDS,
) -> Optional[int]:
    """
    Kembalikan sistolik representatif untuk user.

    Args:
        user_id: UUID user (current_user.sub)
        profile_systolic: nilai sistolik dari user_profiles (fallback)
        lookback: jumlah catatan terbaru yang dirata-rata

    Returns:
        int sistolik (mmHg) atau None kalau tidak ada data sama sekali.
    """
    supabase = get_supabase()

    try:
        response = (
            supabase.table("blood_pressure_records")
            .select("systolic_mmhg")
            .eq("user_id", user_id)
            .order("measured_at", desc=True)
            .limit(lookback)
            .execute()
        )
        rows = response.data or []
    except Exception as exc:
        logger.warning("Gagal fetch blood_pressure_records: %s", str(exc))
        rows = []

    if rows:
        values = [int(r["systolic_mmhg"]) for r in rows if r.get("systolic_mmhg") is not None]
        if values:
            avg = round(sum(values) / len(values))
            logger.debug(
                "Sistolik representatif user %s: %d mmHg (rata-rata dari %d reading)",
                user_id, avg, len(values),
            )
            return avg

    # Fallback ke profile
    if profile_systolic is not None:
        return int(profile_systolic)

    return None
