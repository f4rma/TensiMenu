"""
Endpoint profil pengguna TensiMenu.
GET /api/v1/profile  — ambil profil pengguna yang login
POST /api/v1/profile — buat profil baru
PUT /api/v1/profile  — perbarui profil + recalculate target nutrisi
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from core.database import get_supabase
from core.security import TokenPayload, get_current_user
from models.profile import UserProfileCreate, UserProfileResponse, UserProfileUpdate
from services.nutrition_calculator import calculate_personal_targets

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["Profile"])


def _build_profile_response(row: dict) -> UserProfileResponse:
    """Konversi row Supabase ke UserProfileResponse."""
    daily_targets = row.get("daily_targets")
    return UserProfileResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        full_name=row["full_name"],
        age=row["age"],
        gender=row["gender"],
        weight_kg=float(row["weight_kg"]),
        height_cm=float(row["height_cm"]),
        systolic_bp=row.get("systolic_bp"),
        diastolic_bp=row.get("diastolic_bp"),
        comorbidities=row.get("comorbidities") or [],
        food_restrictions=row.get("food_restrictions") or [],
        regional_prefs=row.get("regional_prefs") or [],
        daily_targets=daily_targets,
        is_complete=bool(row.get("is_complete", False)),
        created_at=str(row.get("created_at", "")),
        updated_at=str(row.get("updated_at", "")),
    )


@router.get(
    "",
    response_model=UserProfileResponse,
    summary="Ambil profil pengguna yang sedang login",
)
async def get_profile(
    current_user: TokenPayload = Depends(get_current_user),
) -> UserProfileResponse:
    """
    Ambil profil pengguna berdasarkan JWT yang dikirim.
    - HTTP 200: profil ditemukan
    - HTTP 404: profil belum dibuat
    - HTTP 401: token tidak valid (otomatis dari get_current_user)
    """
    supabase = get_supabase()

    response = (
        supabase.table("user_profiles")
        .select("*")
        .eq("user_id", current_user.sub)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Profil belum dibuat.", "code": "PROFILE_NOT_FOUND"},
        )

    return _build_profile_response(response.data)


@router.post(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat profil pengguna baru",
)
async def create_profile(
    body: UserProfileCreate,
    current_user: TokenPayload = Depends(get_current_user),
) -> UserProfileResponse:
    """
    Buat profil baru untuk pengguna yang sedang login.
    Target nutrisi personal dihitung otomatis (Mifflin-St Jeor).
    - HTTP 201: profil berhasil dibuat
    - HTTP 409: profil sudah ada
    - HTTP 422: validasi field gagal
    """
    supabase = get_supabase()

    # Cek apakah profil sudah ada
    existing = (
        supabase.table("user_profiles")
        .select("id")
        .eq("user_id", current_user.sub)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "Profil sudah ada. Gunakan PUT untuk memperbarui.", "code": "PROFILE_ALREADY_EXISTS"},
        )

    # Hitung target nutrisi personal
    daily_targets = calculate_personal_targets(
        gender=body.gender,
        weight_kg=body.weight_kg,
        height_cm=body.height_cm,
        age=body.age,
        comorbidities=body.comorbidities,
        systolic_bp=body.systolic_bp,
    )

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "user_id": current_user.sub,
        "full_name": body.full_name,
        "age": body.age,
        "gender": body.gender,
        "weight_kg": body.weight_kg,
        "height_cm": body.height_cm,
        "systolic_bp": body.systolic_bp,
        "diastolic_bp": body.diastolic_bp,
        "comorbidities": body.comorbidities,
        "food_restrictions": body.food_restrictions,
        "regional_prefs": body.regional_prefs,
        "daily_targets": daily_targets,
        "is_complete": True,
        "created_at": now,
        "updated_at": now,
    }

    response = supabase.table("user_profiles").insert(payload).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal menyimpan profil.", "code": "PROFILE_CREATE_FAILED"},
        )

    logger.info("Profil dibuat untuk user: %s", current_user.sub)
    return _build_profile_response(response.data[0])


@router.put(
    "",
    response_model=UserProfileResponse,
    summary="Perbarui profil + recalculate target nutrisi",
)
async def update_profile(
    body: UserProfileUpdate,
    current_user: TokenPayload = Depends(get_current_user),
) -> UserProfileResponse:
    """
    Perbarui profil pengguna. Target nutrisi dihitung ulang otomatis.
    - HTTP 200: profil berhasil diperbarui
    - HTTP 404: profil belum dibuat
    - HTTP 422: validasi field gagal
    """
    supabase = get_supabase()

    # Ambil profil yang ada
    existing_resp = (
        supabase.table("user_profiles")
        .select("*")
        .eq("user_id", current_user.sub)
        .single()
        .execute()
    )

    if not existing_resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Profil belum dibuat. Gunakan POST untuk membuat.", "code": "PROFILE_NOT_FOUND"},
        )

    existing = existing_resp.data

    # Merge: gunakan nilai baru jika ada, fallback ke nilai lama
    merged_gender = body.gender or existing["gender"]
    merged_weight = body.weight_kg or existing["weight_kg"]
    merged_height = body.height_cm or existing["height_cm"]
    merged_age = body.age or existing["age"]
    merged_comorbidities = body.comorbidities if body.comorbidities is not None else (existing.get("comorbidities") or [])
    merged_systolic = body.systolic_bp if body.systolic_bp is not None else existing.get("systolic_bp")

    # Recalculate target nutrisi
    daily_targets = calculate_personal_targets(
        gender=merged_gender,
        weight_kg=merged_weight,
        height_cm=merged_height,
        age=merged_age,
        comorbidities=merged_comorbidities,
        systolic_bp=merged_systolic,
    )

    # Bangun payload update (hanya field yang dikirim)
    update_payload: dict = {"daily_targets": daily_targets, "updated_at": datetime.now(timezone.utc).isoformat()}
    if body.full_name is not None:
        update_payload["full_name"] = body.full_name
    if body.age is not None:
        update_payload["age"] = body.age
    if body.gender is not None:
        update_payload["gender"] = body.gender
    if body.weight_kg is not None:
        update_payload["weight_kg"] = body.weight_kg
    if body.height_cm is not None:
        update_payload["height_cm"] = body.height_cm
    if body.systolic_bp is not None:
        update_payload["systolic_bp"] = body.systolic_bp
    if body.diastolic_bp is not None:
        update_payload["diastolic_bp"] = body.diastolic_bp
    if body.comorbidities is not None:
        update_payload["comorbidities"] = body.comorbidities
    if body.food_restrictions is not None:
        update_payload["food_restrictions"] = body.food_restrictions
    if body.regional_prefs is not None:
        update_payload["regional_prefs"] = body.regional_prefs

    response = (
        supabase.table("user_profiles")
        .update(update_payload)
        .eq("user_id", current_user.sub)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal memperbarui profil.", "code": "PROFILE_UPDATE_FAILED"},
        )

    logger.info("Profil diperbarui untuk user: %s", current_user.sub)
    return _build_profile_response(response.data[0])
