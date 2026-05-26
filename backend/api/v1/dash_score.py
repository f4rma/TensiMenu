"""
Endpoint kalkulasi DASH Score TensiMenu.

POST /api/v1/dash-score       — hitung DASH Score untuk list makanan + porsi
GET  /api/v1/dash-score/daily — DASH Score harian dari log konsumsi hari ini
"""

import logging
from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_supabase
from core.security import TokenPayload, get_current_user
from ml.model_loader import ModelArtifacts, get_model_artifacts
from models.recommendation import DashScoreRequest, DashScoreResponse, DashScoreItem, ImprovementTip
from services.dash_score_service import (
    calculate_daily_dash_score,
    calculate_dash_score,
    get_dash_category,
    get_improvement_tips,
)
from services.nutrition_calculator import calculate_personal_targets

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dash-score", tags=["DASH Score"])

DEFAULT_SERVING_G = 100.0


def _load_food_df(artifacts: ModelArtifacts) -> pd.DataFrame:
    from pathlib import Path
    from core.config import get_settings
    settings = get_settings()
    csv_path = Path(settings.ML_ARTIFACTS_PATH) / "food_items_clean.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"food_items_clean.csv tidak ditemukan di {csv_path}")
    return pd.read_csv(csv_path)


def _get_user_targets(user_id: str) -> dict:
    """Ambil atau hitung target nutrisi pengguna."""
    supabase = get_supabase()
    response = (
        supabase.table("user_profiles")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Pengguna tidak ditemukan.", "code": "USER_NOT_FOUND"},
        )
    profile = response.data
    return profile.get("daily_targets") or calculate_personal_targets(
        gender=profile["gender"],
        weight_kg=float(profile["weight_kg"]),
        height_cm=float(profile["height_cm"]),
        age=int(profile["age"]),
        comorbidities=profile.get("comorbidities") or [],
        systolic_bp=profile.get("systolic_bp"),
    )


@router.post(
    "",
    response_model=DashScoreResponse,
    summary="Hitung DASH Score untuk daftar makanan + porsi",
)
async def calculate_dash_score_endpoint(
    body: DashScoreRequest,
    current_user: TokenPayload = Depends(get_current_user),
    artifacts: ModelArtifacts = Depends(get_model_artifacts),
) -> DashScoreResponse:
    """
    Hitung DASH Score per item dan agregat harian.

    Request body:
        items: [{"food_code": "AP001", "serving_g": 150}, ...]

    Response:
        - DASH Score per item
        - DASH Score agregat harian
        - improvement_tips jika skor harian < 40
    """
    user_targets = _get_user_targets(current_user.sub)
    food_df = _load_food_df(artifacts)

    score_items: list[DashScoreItem] = []
    portions_for_daily: list[dict] = []
    actual_nutrients_total: dict = {
        "sodium_mg": 0.0, "potassium_mg": 0.0,
        "calcium_mg": 0.0, "fiber_g": 0.0, "fat_total_g": 0.0,
    }

    for item in body.items:
        food_code = item.get("food_code", "")
        serving_g = float(item.get("serving_g", DEFAULT_SERVING_G))

        food_row = food_df[food_df["food_code"] == food_code]
        if food_row.empty:
            logger.warning("food_code tidak ditemukan: %s", food_code)
            continue

        factor = serving_g / 100.0
        nutrition = {
            col: float(food_row.iloc[0].get(col, 0.0)) * factor
            for col in ["sodium_mg", "potassium_mg", "calcium_mg", "fiber_g", "fat_total_g"]
        }

        score = calculate_dash_score(nutrition, user_targets)
        category = get_dash_category(score)

        score_items.append(DashScoreItem(
            food_code=food_code,
            food_name=str(food_row.iloc[0].get("name", food_code)),
            dash_score=score,
            dash_category=category,
        ))

        portions_for_daily.append({"nutrition": nutrition, "serving_g": serving_g})
        for k in actual_nutrients_total:
            actual_nutrients_total[k] += nutrition.get(k, 0.0)

    daily_score = calculate_daily_dash_score(portions_for_daily, user_targets)
    daily_category = get_dash_category(daily_score)

    # Improvement tips jika skor < 40
    tips_raw = get_improvement_tips(daily_score, actual_nutrients_total, user_targets, food_df)
    tips = [ImprovementTip(**t) for t in tips_raw]

    return DashScoreResponse(
        items=score_items,
        daily_dash_score=daily_score,
        daily_dash_category=daily_category,
        improvement_tips=tips if tips else None,
    )


@router.get(
    "/daily",
    response_model=DashScoreResponse,
    summary="DASH Score harian dari log konsumsi hari ini",
)
async def get_daily_dash_score(
    current_user: TokenPayload = Depends(get_current_user),
    artifacts: ModelArtifacts = Depends(get_model_artifacts),
) -> DashScoreResponse:
    """
    Ambil DASH Score harian pengguna berdasarkan log konsumsi hari ini.
    Jika belum ada log hari ini, kembalikan skor 0.
    """
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
        return DashScoreResponse(
            items=[],
            daily_dash_score=0.0,
            daily_dash_category="Perlu Perhatian",
            improvement_tips=None,
        )

    # Ambil DASH Score yang sudah tersimpan
    latest_log = response.data[-1]
    daily_score = float(latest_log.get("dash_score", 0.0))
    daily_category = get_dash_category(daily_score)

    # Improvement tips jika skor < 40
    tips: list[ImprovementTip] = []
    if daily_score < 40:
        user_targets = _get_user_targets(current_user.sub)
        food_df = _load_food_df(artifacts)
        tips_raw = get_improvement_tips(daily_score, {}, user_targets, food_df)
        tips = [ImprovementTip(**t) for t in tips_raw]

    return DashScoreResponse(
        items=[],
        daily_dash_score=daily_score,
        daily_dash_category=daily_category,
        improvement_tips=tips if tips else None,
    )
