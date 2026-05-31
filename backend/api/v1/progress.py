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
    get_tracker_data,
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
    "/tracker",
    summary="Data lengkap untuk halaman Tracker (period-aware)",
)
async def get_tracker(
    period: int = Query(7, description="Periode dalam hari: 7, 30, atau 90"),
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    """
    Kembalikan agregasi lengkap untuk halaman Tracker sesuai periode:
    tren skor harian, kepatuhan, ringkasan, heatmap nutrisi, dan streak.
    """
    if period not in (7, 30, 90):
        period = 7
    return get_tracker_data(current_user.sub, period_days=period)


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
    progress bar nutrisi (Kalori, Natrium, Kalium, Serat) dan daftar
    makanan yang sudah dicatat hari ini.

    Returns:
        - has_data: bool — apakah user sudah catat makanan hari ini
        - dash_score: float — DASH score harian
        - consumption: dict — total nutrisi yang sudah dikonsumsi
        - meals_logged: int — jumlah makanan yang dicatat
        - items: list — daftar makanan {food_code, name, category, serving_g}
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
            "items": [],
        }

    row = response.data[0]
    food_codes = row.get("food_codes") or []
    servings = row.get("servings_g") or []

    items = _resolve_consumed_items(food_codes, servings)

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
        "items": items,
    }


def _resolve_consumed_items(
    food_codes: list[str], servings: list[float]
) -> list[dict]:
    """
    Resolusi food_code → nama + kategori + image dari dataset.
    Dipakai untuk menampilkan daftar "Sudah dimakan hari ini".

    Mengelompokkan item yang sama (mis. Nasi 2x) menjadi satu baris
    dengan jumlah porsi total.
    """
    if not food_codes:
        return []

    from pathlib import Path
    import pandas as pd
    from core.config import get_settings

    settings = get_settings()
    csv_path = Path(settings.ML_ARTIFACTS_PATH) / "food_items_clean.csv"
    if not csv_path.exists():
        return []

    df = pd.read_csv(csv_path)
    lookup = df.set_index(df["food_code"].astype(str)).to_dict("index")

    # Pad servings agar sama panjang dengan food_codes
    if len(servings) < len(food_codes):
        servings = list(servings) + [100.0] * (len(food_codes) - len(servings))

    # Agregasi item yang sama
    agg: dict[str, dict] = {}
    for code, serving_g in zip(food_codes, servings):
        code = str(code)
        meta = lookup.get(code)
        if meta is None:
            continue
        if code not in agg:
            image_val = meta.get("image_url")
            image_url = (
                str(image_val).strip()
                if isinstance(image_val, str) and str(image_val).startswith("http")
                else None
            )
            agg[code] = {
                "food_code": code,
                "name": str(meta.get("name", "")),
                "category": str(meta.get("category", "")),
                "image_url": image_url,
                "serving_g": 0.0,
                "count": 0,
            }
        agg[code]["serving_g"] += float(serving_g or 0)
        agg[code]["count"] += 1

    return list(agg.values())
