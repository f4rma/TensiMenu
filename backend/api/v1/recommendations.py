"""
Endpoint rekomendasi makanan harian TensiMenu.

GET  /api/v1/recommendations                    — hasilkan rencana makan harian
GET  /api/v1/recommendations/{food_code}/alternatives — minimal 3 alternatif
POST /api/v1/recommendations/confirm            — konfirmasi konsumsi
"""

import logging
from datetime import date, datetime, timezone

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_supabase
from core.security import TokenPayload, get_current_user
from ml.content_based_filter import get_alternatives, recommend
from ml.model_loader import ModelArtifacts, get_model_artifacts
from models.recommendation import (
    ConfirmConsumptionRequest,
    ConfirmConsumptionResponse,
    FoodItemRecommended,
    MealPlanResponse,
)
from services.dash_score_service import (
    calculate_daily_dash_score,
    get_dash_category,
)
from services.nutrition_calculator import calculate_personal_targets

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# Porsi default per sajian (gram) jika tidak ada data serving_size
DEFAULT_SERVING_G = 100.0
# Jumlah hari untuk aturan anti-repetisi
ANTI_REPETITION_DAYS = 3
# Top-K rekomendasi per request
TOP_K = 15


def _load_food_df(artifacts: ModelArtifacts) -> pd.DataFrame:
    """
    Muat DataFrame makanan bersih dari artefak.
    Di produksi, ini bisa diganti dengan query Supabase.
    """
    import json
    from pathlib import Path
    from core.config import get_settings

    settings = get_settings()
    csv_path = Path(settings.ML_ARTIFACTS_PATH) / "food_items_clean.csv"

    if not csv_path.exists():
        raise FileNotFoundError(f"food_items_clean.csv tidak ditemukan di {csv_path}")

    return pd.read_csv(csv_path)


def _get_recent_food_codes(user_id: str, days: int = ANTI_REPETITION_DAYS) -> list[str]:
    """
    Ambil food_code yang dikonsumsi pengguna dalam N hari terakhir.
    Digunakan untuk aturan anti-repetisi.
    """
    supabase = get_supabase()
    from datetime import timedelta

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    try:
        response = (
            supabase.table("consumption_logs")
            .select("food_codes")
            .eq("user_id", user_id)
            .gte("log_date", cutoff[:10])
            .execute()
        )
        codes: list[str] = []
        for row in (response.data or []):
            if row.get("food_codes"):
                codes.extend(row["food_codes"])
        return list(set(codes))
    except Exception as exc:
        logger.warning("Gagal ambil riwayat konsumsi: %s", str(exc))
        return []


def _get_user_profile(user_id: str) -> dict:
    """Ambil profil pengguna dari Supabase."""
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
    return response.data


@router.get(
    "",
    response_model=MealPlanResponse,
    summary="Hasilkan rencana makan harian (≤5 detik)",
)
async def get_recommendations(
    current_user: TokenPayload = Depends(get_current_user),
    artifacts: ModelArtifacts = Depends(get_model_artifacts),
) -> MealPlanResponse:
    """
    Hasilkan rekomendasi makanan harian berdasarkan profil pengguna.

    Pipeline:
    1. Ambil profil + daily_targets dari database
    2. Ambil riwayat konsumsi 3 hari terakhir (anti-repetisi)
    3. Jalankan CBF pipeline (filter komorbid → cosine similarity → ranking)
    4. Hitung DASH Score per item dan agregat
    5. Kembalikan rencana makan + warnings

    - HTTP 200: rekomendasi berhasil
    - HTTP 404: profil pengguna tidak ditemukan
    - HTTP 500: ML pipeline gagal
    """
    try:
        # 1. Ambil profil
        profile = _get_user_profile(current_user.sub)

        # 2. Hitung target nutrisi (gunakan yang tersimpan atau hitung ulang)
        daily_targets = profile.get("daily_targets") or calculate_personal_targets(
            gender=profile["gender"],
            weight_kg=float(profile["weight_kg"]),
            height_cm=float(profile["height_cm"]),
            age=int(profile["age"]),
            comorbidities=profile.get("comorbidities") or [],
            systolic_bp=profile.get("systolic_bp"),
        )

        comorbidities = profile.get("comorbidities") or []

        # 3. Anti-repetisi
        exclude_ids = _get_recent_food_codes(current_user.sub)

        # 4. Load food DataFrame
        food_df = _load_food_df(artifacts)

        # 5. Jalankan CBF
        recs_df = recommend(
            user_targets=daily_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=TOP_K,
            exclude_ids=exclude_ids,
            comorbidities=comorbidities,
        )

        # Fallback: jika hasil < 4 item, abaikan anti-repetisi
        is_fallback = False
        if len(recs_df) < 4 and exclude_ids:
            logger.info(
                "Kandidat < 4 setelah anti-repetisi untuk user %s. Mengabaikan anti-repetisi.",
                current_user.sub,
            )
            recs_df = recommend(
                user_targets=daily_targets,
                food_df=food_df,
                artifacts=artifacts,
                top_k=TOP_K,
                exclude_ids=None,
                comorbidities=comorbidities,
            )
            is_fallback = True

        if recs_df.empty:
            return MealPlanResponse(
                recommendations=[],
                total_dash_score=0.0,
                total_dash_category="Perlu Perhatian",
                nutrition_warnings=["Tidak ada makanan yang memenuhi batasan nutrisi profil Anda."],
                note="Coba perbarui preferensi makanan di halaman profil.",
            )

        # 6. Bangun response
        items: list[FoodItemRecommended] = []
        portions_for_daily: list[dict] = []

        for _, row in recs_df.iterrows():
            food_code = str(row["food_code"])
            dash_score = float(row.get("dash_score", 0.0))
            dash_cat = str(row.get("dash_category", get_dash_category(dash_score)))

            # Ambil nutrisi per sajian untuk kalkulasi daily score
            food_row = food_df[food_df["food_code"] == food_code]
            if not food_row.empty:
                nutrition = {
                    col: float(food_row.iloc[0].get(col, 0.0))
                    for col in ["sodium_mg", "potassium_mg", "calcium_mg", "fiber_g", "fat_total_g"]
                }
                portions_for_daily.append({"nutrition": nutrition, "serving_g": DEFAULT_SERVING_G})

            items.append(FoodItemRecommended(
                food_code=food_code,
                name=str(row.get("name", "")),
                category=str(row.get("category", "")),
                similarity=round(float(row["similarity"]), 4),
                dash_score=dash_score,
                dash_category=dash_cat,
                is_repeated=is_fallback and food_code in exclude_ids,
            ))

        # 7. DASH Score harian agregat
        daily_score = calculate_daily_dash_score(portions_for_daily, daily_targets)
        daily_category = get_dash_category(daily_score)

        # 8. Nutrition warnings
        warnings: list[str] = []
        if "ckd" in comorbidities:
            total_k = sum(p["nutrition"].get("potassium_mg", 0) for p in portions_for_daily)
            if total_k > 2000:
                warnings.append(f"Total kalium ({total_k:.0f} mg) melebihi batas CKD (2000 mg).")

        return MealPlanResponse(
            recommendations=items,
            total_dash_score=daily_score,
            total_dash_category=daily_category,
            nutrition_warnings=warnings,
            note="Sudah pernah direkomendasikan" if is_fallback else None,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("ML pipeline gagal untuk user %s: %s", current_user.sub, str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Sistem rekomendasi gagal. Silakan coba lagi.", "code": "ML_PIPELINE_FAILED"},
        )


@router.get(
    "/{food_code}/alternatives",
    response_model=list[FoodItemRecommended],
    summary="Dapatkan minimal 3 alternatif untuk satu makanan",
)
async def get_food_alternatives(
    food_code: str,
    current_user: TokenPayload = Depends(get_current_user),
    artifacts: ModelArtifacts = Depends(get_model_artifacts),
) -> list[FoodItemRecommended]:
    """
    Kembalikan minimal 3 alternatif makanan dengan kategori sama.
    Digunakan saat pengguna menekan tombol "Tolak & Ganti".
    """
    try:
        profile = _get_user_profile(current_user.sub)
        daily_targets = profile.get("daily_targets") or calculate_personal_targets(
            gender=profile["gender"],
            weight_kg=float(profile["weight_kg"]),
            height_cm=float(profile["height_cm"]),
            age=int(profile["age"]),
            comorbidities=profile.get("comorbidities") or [],
            systolic_bp=profile.get("systolic_bp"),
        )
        comorbidities = profile.get("comorbidities") or []
        food_df = _load_food_df(artifacts)

        alts_df = get_alternatives(
            food_code=food_code,
            food_df=food_df,
            artifacts=artifacts,
            user_targets=daily_targets,
            top_k=5,
            comorbidities=comorbidities,
        )

        if len(alts_df) < 3:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Tidak cukup alternatif tersedia.", "code": "NO_ALTERNATIVES"},
            )

        return [
            FoodItemRecommended(
                food_code=str(row["food_code"]),
                name=str(row.get("name", "")),
                category=str(row.get("category", "")),
                similarity=round(float(row["similarity"]), 4),
                dash_score=float(row.get("dash_score", 0.0)),
                dash_category=str(row.get("dash_category", "")),
            )
            for _, row in alts_df.iterrows()
        ]

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Gagal ambil alternatif untuk %s: %s", food_code, str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal mengambil alternatif.", "code": "ALTERNATIVES_FAILED"},
        )


@router.post(
    "/confirm",
    response_model=ConfirmConsumptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Konfirmasi konsumsi rencana makan hari ini",
)
async def confirm_consumption(
    body: ConfirmConsumptionRequest,
    current_user: TokenPayload = Depends(get_current_user),
    artifacts: ModelArtifacts = Depends(get_model_artifacts),
) -> ConfirmConsumptionResponse:
    """
    Simpan log konsumsi ke tabel consumption_logs.
    Hitung DASH Score harian berdasarkan makanan yang dikonfirmasi.
    """
    supabase = get_supabase()

    try:
        profile = _get_user_profile(current_user.sub)
        daily_targets = profile.get("daily_targets") or calculate_personal_targets(
            gender=profile["gender"],
            weight_kg=float(profile["weight_kg"]),
            height_cm=float(profile["height_cm"]),
            age=int(profile["age"]),
            comorbidities=profile.get("comorbidities") or [],
            systolic_bp=profile.get("systolic_bp"),
        )

        food_df = _load_food_df(artifacts)

        # Hitung DASH Score dari makanan yang dikonfirmasi
        portions: list[dict] = []
        servings = body.servings_g or [DEFAULT_SERVING_G] * len(body.food_codes)

        for food_code, serving_g in zip(body.food_codes, servings):
            food_row = food_df[food_df["food_code"] == food_code]
            if not food_row.empty:
                nutrition = {
                    col: float(food_row.iloc[0].get(col, 0.0))
                    for col in ["sodium_mg", "potassium_mg", "calcium_mg", "fiber_g", "fat_total_g"]
                }
                portions.append({"nutrition": nutrition, "serving_g": float(serving_g)})

        daily_score = calculate_daily_dash_score(portions, daily_targets)
        today = date.today().isoformat()

        # Simpan ke consumption_logs
        log_payload = {
            "user_id": current_user.sub,
            "food_codes": body.food_codes,
            "log_date": today,
            "dash_score": daily_score,
            "notes": body.notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        response = supabase.table("consumption_logs").insert(log_payload).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": "Gagal menyimpan log konsumsi.", "code": "LOG_SAVE_FAILED"},
            )

        log_id = str(response.data[0].get("id", ""))
        logger.info("Konsumsi dicatat untuk user %s: DASH Score %.1f", current_user.sub, daily_score)

        return ConfirmConsumptionResponse(
            log_id=log_id,
            log_date=today,
            dash_score=daily_score,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Gagal konfirmasi konsumsi: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal menyimpan konsumsi.", "code": "CONFIRM_FAILED"},
        )
