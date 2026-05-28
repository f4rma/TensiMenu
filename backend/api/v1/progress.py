"""
Endpoint tracker progres DASH Score TensiMenu.

GET /api/v1/progress                        — ringkasan progres pengguna
GET /api/v1/progress/trend?period=7|30|90   — tren DASH Score
GET /api/v1/progress/weekly-summary         — ringkasan mingguan
"""

import logging

from fastapi import APIRouter, Depends, Query

from core.security import TokenPayload, get_current_user
from services.progress_service import (
    check_reminder_needed,
    get_compliance_percentage,
    get_progress_trend,
    get_weekly_summary,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get(
    "",
    summary="Ringkasan progres pengguna",
)
async def get_progress_summary(
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    """
    Kembalikan ringkasan progres lengkap:
    - Tren DASH Score 7 hari terakhir
    - Ringkasan mingguan
    - Statistik kepatuhan kumulatif
    - Flag pengingat jika tidak mencatat 2 hari berturut-turut
    """
    trend = get_progress_trend(current_user.sub, period_days=7)
    weekly = get_weekly_summary(current_user.sub)
    compliance = get_compliance_percentage(current_user.sub)
    reminder = check_reminder_needed(current_user.sub)

    return {
        "trend": trend,
        "weekly_summary": weekly,
        "compliance": compliance,
        "reminder_needed": reminder,
    }


@router.get(
    "/trend",
    summary="Tren DASH Score untuk periode tertentu",
)
async def get_trend(
    period: int = Query(7, description="Periode dalam hari: 7, 30, atau 90"),
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    """
    Kembalikan tren DASH Score harian untuk periode 7, 30, atau 90 hari.
    Jika tidak ada data, kembalikan pesan informatif (bukan array kosong).
    """
    if period not in (7, 30, 90):
        period = 7

    trend = get_progress_trend(current_user.sub, period_days=period)

    # Cek apakah ada data sama sekali
    has_data = any(p["dash_score"] is not None for p in trend)

    return {
        "period_days": period,
        "trend": trend,
        "has_data": has_data,
        "message": None if has_data else "Belum ada data untuk periode ini",
    }


@router.get(
    "/weekly-summary",
    summary="Ringkasan mingguan DASH Score",
)
async def get_weekly(
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    """
    Kembalikan ringkasan 7 hari terakhir:
    rata-rata DASH Score, total natrium, total kalium, jumlah hari dicatat.
    """
    return get_weekly_summary(current_user.sub)



@router.get(
    "/today",
    summary="Konsumsi & DASH Score hari ini",
)
async def get_today_progress(
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    """
    Kembalikan konsumsi nutrisi hari ini berdasarkan consumption_logs.
    Dipakai oleh halaman Rekomendasi & Beranda untuk menampilkan
    progress bar nutrisi (Kalori, Natrium, Kalium, Serat).

    Returns:
        - has_data: bool — apakah user sudah catat makanan hari ini
        - dash_score: float — DASH score harian
        - consumption: dict — total nutrisi yang sudah dikonsumsi
        - meals_logged: int — jumlah makanan yang dicatat
    """
    from datetime import date
    from core.database import get_supabase

    supabase = get_supabase()
    today = date.today().isoformat()

    response = (
        supabase.table("consumption_logs")
        .select("*")
        .eq("user_id", current_user.sub)
        .eq("log_date", today)
        .execute()
    )

    if not response.data:
        return {
            "has_data": False,
            "dash_score": 0.0,
            "consumption": {
                "energy_kcal": 0,
                "sodium_mg": 0,
                "potassium_mg": 0,
                "calcium_mg": 0,
                "fiber_g": 0,
                "fat_total_g": 0,
            },
            "meals_logged": 0,
        }

    row = response.data[0]
    food_codes = row.get("food_codes") or []

    return {
        "has_data": True,
        "dash_score": float(row.get("dash_score", 0)),
        "consumption": {
            "energy_kcal": round(float(row.get("total_energy_kcal", 0)), 1),
            "sodium_mg": round(float(row.get("total_sodium_mg", 0)), 1),
            "potassium_mg": round(float(row.get("total_potassium_mg", 0)), 1),
            "calcium_mg": round(float(row.get("total_calcium_mg", 0)), 1),
            "fiber_g": round(float(row.get("total_fiber_g", 0)), 1),
            "fat_total_g": round(float(row.get("total_fat_total_g", 0)), 1),
        },
        "meals_logged": len(food_codes) if isinstance(food_codes, list) else 0,
    }
