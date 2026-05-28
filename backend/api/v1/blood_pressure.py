"""
Endpoint riwayat tekanan darah TensiMenu.

POST /api/v1/blood-pressure         — catat tekanan darah baru
GET  /api/v1/blood-pressure         — daftar riwayat (filter periode)
GET  /api/v1/blood-pressure/export  — ekspor CSV
"""

import csv
import io
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from core.database import get_supabase
from core.security import TokenPayload, get_current_user
from models.blood_pressure import (
    BloodPressureCreate,
    BloodPressureListResponse,
    BloodPressureResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/blood-pressure", tags=["Blood Pressure"])

# Nilai kritis: sistolik >= 180 atau diastolik >= 120
CRITICAL_SYSTOLIC = 180
CRITICAL_DIASTOLIC = 120


def _is_critical(systolic: int, diastolic: int) -> bool:
    return systolic >= CRITICAL_SYSTOLIC or diastolic >= CRITICAL_DIASTOLIC


def _row_to_response(row: dict) -> BloodPressureResponse:
    return BloodPressureResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        systolic_mmhg=int(row["systolic_mmhg"]),
        diastolic_mmhg=int(row["diastolic_mmhg"]),
        measured_at=str(row["measured_at"]),
        notes=row.get("notes"),
        is_critical=bool(row.get("is_critical", False)),
        created_at=str(row.get("created_at", "")),
    )


@router.post(
    "",
    response_model=BloodPressureResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Catat tekanan darah baru",
)
async def create_blood_pressure(
    body: BloodPressureCreate,
    current_user: TokenPayload = Depends(get_current_user),
) -> BloodPressureResponse:
    """
    Simpan catatan tekanan darah baru.
    Field `is_critical` dihitung otomatis: True jika sistolik >= 180 atau diastolik >= 120.

    Side effect (Req. 2.8 + 2.11):
    - Update `systolic_bp` dan `diastolic_bp` di profile pengguna
    - Re-calculate `daily_targets` agar rekomendasi selalu sync dengan
      kondisi BP terkini (mis. natrium turun ke 1500 mg jika sistolik >= 150)

    - HTTP 201: berhasil disimpan
    - HTTP 422: nilai di luar rentang valid
    """
    supabase = get_supabase()

    is_crit = _is_critical(body.systolic_mmhg, body.diastolic_mmhg)

    payload = {
        "user_id": current_user.sub,
        "systolic_mmhg": body.systolic_mmhg,
        "diastolic_mmhg": body.diastolic_mmhg,
        "measured_at": body.measured_at,
        "notes": body.notes,
        "is_critical": is_crit,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    response = supabase.table("blood_pressure_records").insert(payload).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal menyimpan catatan tekanan darah.", "code": "BP_SAVE_FAILED"},
        )

    logger.info(
        "Tekanan darah dicatat untuk user %s: %d/%d (kritis=%s)",
        current_user.sub, body.systolic_mmhg, body.diastolic_mmhg, is_crit,
    )

    # Auto-sync ke profile + re-calculate daily_targets
    _sync_bp_to_profile(
        user_id=current_user.sub,
        systolic=body.systolic_mmhg,
        diastolic=body.diastolic_mmhg,
    )

    return _row_to_response(response.data[0])


def _sync_bp_to_profile(user_id: str, systolic: int, diastolic: int) -> None:
    """
    Update BP terbaru di profile + re-calculate daily_targets.

    Idempotent: dipanggil setelah setiap insert BP record.
    Tidak melempar exception kalau gagal — log saja untuk avoid block POST.
    """
    from services.nutrition_calculator import calculate_personal_targets

    supabase = get_supabase()

    try:
        # Ambil profile untuk dapat parameter lain (gender, BB, TB, age, comorbid)
        profile_resp = (
            supabase.table("user_profiles")
            .select("gender, weight_kg, height_cm, age, comorbidities")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not profile_resp or not profile_resp.data:
            logger.warning("Profile tidak ditemukan saat sync BP untuk user %s", user_id)
            return

        profile = profile_resp.data

        # Re-calculate daily_targets dengan BP terbaru
        new_targets = calculate_personal_targets(
            gender=profile["gender"],
            weight_kg=float(profile["weight_kg"]),
            height_cm=float(profile["height_cm"]),
            age=int(profile["age"]),
            comorbidities=profile.get("comorbidities") or [],
            systolic_bp=systolic,
        )

        # Update profile
        supabase.table("user_profiles").update({
            "systolic_bp": systolic,
            "diastolic_bp": diastolic,
            "daily_targets": new_targets,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("user_id", user_id).execute()

        logger.info(
            "Profile BP & daily_targets di-sync untuk user %s: %d/%d, sodium target = %s mg",
            user_id, systolic, diastolic, new_targets.get("sodium_mg"),
        )

    except Exception as exc:
        # Tidak fatal — BP record tetap tersimpan
        logger.error("Gagal sync BP ke profile untuk user %s: %s", user_id, str(exc))


@router.get(
    "",
    response_model=BloodPressureListResponse,
    summary="Daftar riwayat tekanan darah",
)
async def list_blood_pressure(
    period: int = Query(30, ge=7, le=365, description="Periode dalam hari (7, 30, 90, 365)"),
    current_user: TokenPayload = Depends(get_current_user),
) -> BloodPressureListResponse:
    """
    Ambil riwayat tekanan darah pengguna untuk periode tertentu.
    Diurutkan dari terbaru ke terlama.
    """
    supabase = get_supabase()

    from datetime import timedelta, date
    cutoff = (datetime.now(timezone.utc) - timedelta(days=period)).isoformat()

    response = (
        supabase.table("blood_pressure_records")
        .select("*")
        .eq("user_id", current_user.sub)
        .gte("measured_at", cutoff)
        .order("measured_at", desc=True)
        .execute()
    )

    rows = response.data or []
    items = [_row_to_response(r) for r in rows]

    return BloodPressureListResponse(items=items, total=len(items))


@router.get(
    "/export",
    summary="Ekspor riwayat tekanan darah sebagai CSV",
    response_class=StreamingResponse,
)
async def export_blood_pressure_csv(
    period: int = Query(90, ge=7, le=365),
    current_user: TokenPayload = Depends(get_current_user),
) -> StreamingResponse:
    """
    Ekspor riwayat tekanan darah sebagai file CSV.
    Header: id, systolic_mmhg, diastolic_mmhg, measured_at, notes, is_critical
    """
    supabase = get_supabase()

    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(days=period)).isoformat()

    response = (
        supabase.table("blood_pressure_records")
        .select("id, systolic_mmhg, diastolic_mmhg, measured_at, notes, is_critical")
        .eq("user_id", current_user.sub)
        .gte("measured_at", cutoff)
        .order("measured_at", desc=True)
        .execute()
    )

    rows = response.data or []

    # Buat CSV di memori
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "systolic_mmhg", "diastolic_mmhg", "measured_at", "notes", "is_critical"],
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    filename = f"tensimenu_blood_pressure_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
