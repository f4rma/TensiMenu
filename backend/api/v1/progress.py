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
