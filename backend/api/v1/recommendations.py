"""
Endpoint rekomendasi makanan harian TensiMenu.

GET  /api/v1/recommendations                    — hasilkan rencana makan harian
GET  /api/v1/recommendations/{food_code}/alternatives — minimal 3 alternatif
POST /api/v1/recommendations/confirm            — konfirmasi konsumsi
"""

import logging
import math
from datetime import date, datetime, timezone

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status

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
from services.bp_resolver import get_representative_systolic
from services.bp_classifier import classify_bp, get_bp_advisory
from services.nutrition_calculator import calculate_personal_targets
from services.serving_sizes import DEFAULT_SERVING_G, get_default_serving_g

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# Jumlah hari untuk aturan anti-repetisi
ANTI_REPETITION_DAYS = 3
# Top-K rekomendasi per request
TOP_K = 15


def _safe_float(value, default: float = 0.0) -> float:
    """
    Konversi nilai ke float yang aman untuk JSON.

    Menangani NaN/inf (umum di dataset TKPI untuk kolom yang tidak terisi,
    mis. phosphorus_mg). NaN tidak JSON-compliant dan bikin serialisasi
    response gagal — kembalikan default sebagai gantinya.
    """
    try:
        f = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(f) or math.isinf(f):
        return default
    return f


def _load_food_df(artifacts: ModelArtifacts) -> pd.DataFrame:
    """
    Muat DataFrame makanan bersih dari artefak.

    Penting: hanya item dengan `is_dish == True` yang ikut rekomendasi.
    Ini memastikan user dapat saran "menu jadi" (Rendang, Soto, Pepes Ikan,
    Buah, Susu, dll) bukan bahan mentah seperti "Daging Sapi, segar".

    Bahan mentah tetap tersedia via global search (use case berbeda).
    """
    from pathlib import Path
    from core.config import get_settings

    settings = get_settings()
    csv_path = Path(settings.ML_ARTIFACTS_PATH) / "food_items_clean.csv"

    if not csv_path.exists():
        raise FileNotFoundError(f"food_items_clean.csv tidak ditemukan di {csv_path}")

    df = pd.read_csv(csv_path)

    # Filter ke menu jadi saja
    if "is_dish" in df.columns:
        # is_dish bisa boolean atau string "True"/"False" tergantung CSV
        if df["is_dish"].dtype == bool:
            df = df[df["is_dish"]]
        else:
            df = df[df["is_dish"].astype(str).str.lower().isin(["true", "1"])]

    return df.reset_index(drop=True)


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
        .maybe_single()
        .execute()
    )
    if not response or not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Pengguna tidak ditemukan.", "code": "USER_NOT_FOUND"},
        )
    return response.data


def _resolve_daily_targets(profile: dict, user_id: str) -> dict:
    """
    Ambil daily_targets yang sudah dicache di profil, atau hitung ulang
    kalau belum ada. Sumber sistolik diambil dari blood_pressure_records
    terbaru (rata-rata 3 reading), fallback ke profile.systolic_bp.
    """
    cached = profile.get("daily_targets")
    if cached:
        return cached

    representative_systolic = get_representative_systolic(
        user_id=user_id,
        profile_systolic=profile.get("systolic_bp"),
    )
    return calculate_personal_targets(
        gender=profile["gender"],
        weight_kg=float(profile["weight_kg"]),
        height_cm=float(profile["height_cm"]),
        age=int(profile["age"]),
        comorbidities=profile.get("comorbidities") or [],
        systolic_bp=representative_systolic,
        activity_level=profile.get("activity_level") or "light",
    )


@router.get(
    "",
    response_model=MealPlanResponse,
    summary="Hasilkan rencana makan harian (≤5 detik)",
)
async def get_recommendations(
    top_k: int = Query(15, ge=1, le=100, description="Jumlah rekomendasi yang dikembalikan"),
    offset: int = Query(0, ge=0, le=500, description="Skip N item teratas (untuk pagination)"),
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
        daily_targets = _resolve_daily_targets(profile, current_user.sub)

        comorbidities = profile.get("comorbidities") or []
        food_restrictions = profile.get("food_restrictions") or []

        # 3. Anti-repetisi
        exclude_ids = _get_recent_food_codes(current_user.sub)

        # 4. Load food DataFrame
        food_df = _load_food_df(artifacts)

        # 5. Jalankan CBF — fetch lebih banyak dari yang diminta agar bisa di-paginate
        fetch_size = top_k + offset
        recs_df = recommend(
            user_targets=daily_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=fetch_size,
            exclude_ids=exclude_ids,
            comorbidities=comorbidities,
            food_restrictions=food_restrictions,
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
                top_k=fetch_size,
                exclude_ids=None,
                comorbidities=comorbidities,
                food_restrictions=food_restrictions,
            )
            is_fallback = True

        # Apply offset (skip N item teratas) lalu ambil top_k
        recs_df = recs_df.iloc[offset : offset + top_k]

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
            dash_score = _safe_float(row.get("dash_score", 0.0))
            dash_cat = str(row.get("dash_category", get_dash_category(dash_score)))

            # Ambil data lengkap dari food_df untuk populate field nutrisi
            food_row = food_df[food_df["food_code"] == food_code]
            nutrition = {
                "sodium_mg": 0.0,
                "potassium_mg": 0.0,
                "calcium_mg": 0.0,
                "fiber_g": 0.0,
                "fat_total_g": 0.0,
                "phosphorus_mg": 0.0,
            }
            energy_kcal = 0.0
            region: str | None = None
            image_url: str | None = None
            is_estimated = False
            category = str(row.get("category", ""))
            serving_g = get_default_serving_g(category)

            if not food_row.empty:
                src = food_row.iloc[0]
                for col in nutrition:
                    nutrition[col] = _safe_float(src.get(col, 0.0))
                energy_kcal = _safe_float(src.get("energy_kcal", 0.0))
                region_val = src.get("region")
                if isinstance(region_val, str) and region_val.strip():
                    region = region_val
                image_val = src.get("image_url")
                if isinstance(image_val, str) and image_val.strip():
                    image_url = image_val.strip()
                est_val = src.get("is_estimated")
                # Bisa berupa bool atau string "True"/"False"
                is_estimated = bool(est_val) if isinstance(est_val, bool) else str(est_val).lower() == "true"

                portions_for_daily.append(
                    {"nutrition": nutrition, "serving_g": serving_g}
                )

            # Skala nutrisi dari per-100g ke per-porsi standar.
            # Nilai di dataset adalah per 100 g; kartu menampilkan per porsi
            # standar (serving_g) agar konsisten dengan yang dicatat saat
            # konfirmasi konsumsi.
            scale = serving_g / 100.0

            items.append(
                FoodItemRecommended(
                    food_code=food_code,
                    name=str(row.get("name", "")),
                    category=category,
                    similarity=round(_safe_float(row.get("similarity", 0.0)), 4),
                    dash_score=dash_score,
                    dash_category=dash_cat,
                    is_repeated=is_fallback and food_code in exclude_ids,
                    region=region,
                    image_url=image_url,
                    is_estimated=is_estimated,
                    energy_kcal=round(energy_kcal * scale, 1),
                    sodium_mg=round(nutrition["sodium_mg"] * scale, 1),
                    potassium_mg=round(nutrition["potassium_mg"] * scale, 1),
                    fiber_g=round(nutrition["fiber_g"] * scale, 2),
                    fat_total_g=round(nutrition["fat_total_g"] * scale, 2),
                    phosphorus_mg=round(nutrition["phosphorus_mg"] * scale, 1),
                    default_serving_g=serving_g,
                )
            )

        # 7. DASH Score harian agregat
        daily_score = calculate_daily_dash_score(portions_for_daily, daily_targets)
        daily_category = get_dash_category(daily_score)

        # 8. Nutrition warnings — kalkulasi total per porsi standar
        warnings: list[str] = []

        # Advisory sesuai kategori tekanan darah (hipotensi / stage 1 / 2 / krisis).
        # Pakai sistolik representatif (rata-rata 3 reading terakhir) + diastolik
        # profil agar selaras dengan kategori yang ditampilkan di UI.
        rep_systolic = get_representative_systolic(
            user_id=current_user.sub,
            profile_systolic=profile.get("systolic_bp"),
        )
        rep_diastolic = profile.get("diastolic_bp")
        if rep_systolic is not None and rep_diastolic is not None:
            bp_category = classify_bp(int(rep_systolic), int(rep_diastolic))
            advisory = get_bp_advisory(bp_category)
            if advisory:
                warnings.append(advisory)

        def _scaled_total(nutrient: str) -> float:
            return sum(
                p["nutrition"].get(nutrient, 0.0) * p["serving_g"] / 100.0
                for p in portions_for_daily
            )

        total_sodium = _scaled_total("sodium_mg")
        total_potassium = _scaled_total("potassium_mg")
        total_phosphorus = _scaled_total("phosphorus_mg")

        sodium_target = float(daily_targets.get("sodium_mg", 2300))
        if total_sodium > sodium_target:
            warnings.append(
                f"Total natrium dari rekomendasi ({total_sodium:.0f} mg) "
                f"melebihi target harian Anda ({sodium_target:.0f} mg)."
            )

        if "ckd" in comorbidities:
            potassium_limit = float(daily_targets.get("potassium_mg", 2000))
            if total_potassium > potassium_limit:
                warnings.append(
                    f"Total kalium ({total_potassium:.0f} mg) melebihi batas "
                    f"CKD ({potassium_limit:.0f} mg). Pertimbangkan porsi lebih kecil."
                )
            phosphorus_limit = float(daily_targets.get("phosphorus_mg", 800))
            if total_phosphorus > phosphorus_limit:
                warnings.append(
                    f"Total fosfor ({total_phosphorus:.0f} mg) melebihi batas "
                    f"CKD ({phosphorus_limit:.0f} mg)."
                )

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
        daily_targets = _resolve_daily_targets(profile, current_user.sub)
        comorbidities = profile.get("comorbidities") or []
        food_restrictions = profile.get("food_restrictions") or []
        food_df = _load_food_df(artifacts)

        alts_df = get_alternatives(
            food_code=food_code,
            food_df=food_df,
            artifacts=artifacts,
            user_targets=daily_targets,
            top_k=5,
            comorbidities=comorbidities,
            food_restrictions=food_restrictions,
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
                similarity=round(_safe_float(row.get("similarity", 0.0)), 4),
                dash_score=_safe_float(row.get("dash_score", 0.0)),
                dash_category=str(row.get("dash_category", "")),
                energy_kcal=round(_safe_float(row.get("energy_kcal", 0.0)), 1),
                sodium_mg=round(_safe_float(row.get("sodium_mg", 0.0)), 1),
                potassium_mg=round(_safe_float(row.get("potassium_mg", 0.0)), 1),
                fiber_g=round(_safe_float(row.get("fiber_g", 0.0)), 2),
                fat_total_g=round(_safe_float(row.get("fat_total_g", 0.0)), 2),
                phosphorus_mg=round(_safe_float(row.get("phosphorus_mg", 0.0)), 1),
                default_serving_g=get_default_serving_g(str(row.get("category", ""))),
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

    Logic:
    - Setiap call menambahkan makanan baru ke log harian (append-only).
    - Total nutrisi harian = akumulasi semua makanan yang sudah dicatat hari ini.
    - DASH score harian dihitung ulang dari SEMUA makanan hari itu (bukan
      hanya batch terbaru), supaya skor stabil dan representatif.
    - Validasi serving_g (1-1500 g) dan jumlah food_codes (max 50) untuk
      mencegah data corrupt.
    """
    supabase = get_supabase()

    # Validasi serving_g — clamp range realistis (1 g sampai 1.5 kg).
    # Kalau frontend tidak kirim servings_g, default per kategori (mis. ikan
    # 50 g, sayur 100 g) lebih akurat daripada flat 100 g untuk semua.
    if body.servings_g and len(body.servings_g) > 0:
        servings_input = list(body.servings_g)
    else:
        # Sementara list kosong dengan placeholder; akan di-resolve setelah
        # food_df dimuat (perlu kategori per item).
        servings_input = []
    if servings_input and len(servings_input) != len(body.food_codes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Panjang food_codes dan servings_g harus sama.", "code": "INVALID_SERVING"},
        )
    for s in servings_input:
        if not (1.0 <= float(s) <= 1500.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": f"Porsi {s} g di luar rentang wajar (1-1500 g).",
                    "code": "INVALID_SERVING",
                },
            )

    try:
        profile = _get_user_profile(current_user.sub)
        daily_targets = _resolve_daily_targets(profile, current_user.sub)

        food_df = _load_food_df(artifacts)

        # Resolve servings_input default berbasis kategori kalau frontend
        # tidak mengirimkan eksplisit.
        if not servings_input:
            servings_input = []
            for fc in body.food_codes:
                fr = food_df[food_df["food_code"] == fc]
                cat = str(fr.iloc[0].get("category", "")) if not fr.empty else ""
                servings_input.append(get_default_serving_g(cat))

        # Hitung kontribusi nutrisi & porsi dari makanan yang BARU dicatat
        new_totals = {
            "energy_kcal": 0.0,
            "sodium_mg": 0.0,
            "potassium_mg": 0.0,
            "calcium_mg": 0.0,
            "fiber_g": 0.0,
            "fat_total_g": 0.0,
        }

        for food_code, serving_g in zip(body.food_codes, servings_input):
            food_row = food_df[food_df["food_code"] == food_code]
            if food_row.empty:
                continue
            src = food_row.iloc[0]
            scale = float(serving_g) / 100.0

            new_totals["energy_kcal"] += _safe_float(src.get("energy_kcal", 0.0)) * scale
            for col in ("sodium_mg", "potassium_mg", "calcium_mg", "fiber_g", "fat_total_g"):
                new_totals[col] += _safe_float(src.get(col, 0.0)) * scale

        today = date.today().isoformat()

        # Cek apakah sudah ada log untuk hari ini
        existing = (
            supabase.table("consumption_logs")
            .select(
                "id, food_codes, servings_g, "
                "total_energy_kcal, total_sodium_mg, total_potassium_mg, "
                "total_calcium_mg, total_fiber_g, total_fat_total_g"
            )
            .eq("user_id", current_user.sub)
            .eq("log_date", today)
            .execute()
        )

        if existing.data:
            # APPEND: gabungkan food_codes dan servings_g, tambahkan totals.
            # Tidak ada deduplikasi — user boleh konsumsi makanan yang sama
            # beberapa kali (mis. nasi pagi + nasi siang). Ini sumber bug
            # double-count sebelumnya: kita filter food_codes tapi tetap
            # tambah totals; sekarang kedua-duanya konsisten append apa adanya.
            row = existing.data[0]
            existing_codes: list[str] = list(row.get("food_codes") or [])
            existing_servings: list[float] = [
                float(s) for s in (row.get("servings_g") or [])
            ]

            # Pad servings lama kalau kurang panjang (data legacy tanpa servings_g).
            # Default per kategori, fallback 100 g kalau kategori tidak dikenal.
            if len(existing_servings) < len(existing_codes):
                missing = existing_codes[len(existing_servings):]
                pad: list[float] = []
                for fc in missing:
                    fr = food_df[food_df["food_code"] == fc]
                    cat = str(fr.iloc[0].get("category", "")) if not fr.empty else ""
                    pad.append(get_default_serving_g(cat))
                existing_servings += pad

            merged_codes = existing_codes + list(body.food_codes)
            merged_servings = existing_servings + [float(s) for s in servings_input]

            # Recompute DASH score harian dari SEMUA makanan hari itu, bukan
            # hanya batch ini. Ini memberi skor yang stabil dan benar-benar
            # mewakili komposisi nutrisi sepanjang hari.
            all_portions: list[dict] = []
            for fc, sg in zip(merged_codes, merged_servings):
                fr = food_df[food_df["food_code"] == fc]
                if fr.empty:
                    continue
                fsrc = fr.iloc[0]
                all_portions.append(
                    {
                        "nutrition": {
                            col: _safe_float(fsrc.get(col, 0.0))
                            for col in (
                                "sodium_mg",
                                "potassium_mg",
                                "calcium_mg",
                                "fiber_g",
                                "fat_total_g",
                            )
                        },
                        "serving_g": float(sg),
                    }
                )
            daily_score = calculate_daily_dash_score(all_portions, daily_targets)

            update_payload = {
                "food_codes": merged_codes,
                "servings_g": merged_servings,
                "total_energy_kcal": round(
                    _safe_float(row.get("total_energy_kcal")) + new_totals["energy_kcal"], 2
                ),
                "total_sodium_mg": round(
                    _safe_float(row.get("total_sodium_mg")) + new_totals["sodium_mg"], 2
                ),
                "total_potassium_mg": round(
                    _safe_float(row.get("total_potassium_mg")) + new_totals["potassium_mg"], 2
                ),
                "total_calcium_mg": round(
                    _safe_float(row.get("total_calcium_mg")) + new_totals["calcium_mg"], 2
                ),
                "total_fiber_g": round(
                    _safe_float(row.get("total_fiber_g")) + new_totals["fiber_g"], 2
                ),
                "total_fat_total_g": round(
                    _safe_float(row.get("total_fat_total_g")) + new_totals["fat_total_g"], 2
                ),
                "dash_score": daily_score,
                "notes": body.notes,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            supabase.table("consumption_logs").update(update_payload).eq(
                "id", row["id"]
            ).execute()
            log_id = str(row["id"])
        else:
            # Insert baru — DASH score = score dari batch ini (yang juga
            # adalah keseluruhan makanan hari itu).
            first_portions = [
                {
                    "nutrition": {
                        col: _safe_float(food_df[food_df["food_code"] == fc].iloc[0].get(col, 0.0))
                        if not food_df[food_df["food_code"] == fc].empty
                        else 0.0
                        for col in (
                            "sodium_mg",
                            "potassium_mg",
                            "calcium_mg",
                            "fiber_g",
                            "fat_total_g",
                        )
                    },
                    "serving_g": float(sg),
                }
                for fc, sg in zip(body.food_codes, servings_input)
                if not food_df[food_df["food_code"] == fc].empty
            ]
            daily_score = calculate_daily_dash_score(first_portions, daily_targets)

            log_payload = {
                "user_id": current_user.sub,
                "food_codes": list(body.food_codes),
                "servings_g": [float(s) for s in servings_input],
                "log_date": today,
                "dash_score": daily_score,
                "total_energy_kcal": round(new_totals["energy_kcal"], 2),
                "total_sodium_mg": round(new_totals["sodium_mg"], 2),
                "total_potassium_mg": round(new_totals["potassium_mg"], 2),
                "total_calcium_mg": round(new_totals["calcium_mg"], 2),
                "total_fiber_g": round(new_totals["fiber_g"], 2),
                "total_fat_total_g": round(new_totals["fat_total_g"], 2),
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

        logger.info(
            "Konsumsi dicatat untuk user %s: DASH=%.1f, Δ Na=%.0fmg, Δ K=%.0fmg",
            current_user.sub, daily_score, new_totals["sodium_mg"], new_totals["potassium_mg"],
        )

        return ConfirmConsumptionResponse(
            log_id=log_id,
            log_date=today,
            dash_score=daily_score,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Gagal konfirmasi konsumsi: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal menyimpan konsumsi.", "code": "CONFIRM_FAILED"},
        )
