"""
Endpoint database makanan TensiMenu.

GET  /api/v1/foods              — daftar semua makanan aktif (filter region, category)
GET  /api/v1/foods/{food_code}  — detail satu item makanan
POST /api/v1/foods              — tambah item baru (admin only)
PUT  /api/v1/foods/{food_code}  — perbarui item + simpan audit log (admin only)
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.database import get_supabase
from core.security import TokenPayload, get_current_user
from models.food import FoodItem, FoodItemCreate, FoodItemUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/foods", tags=["Food Database"])

# Role admin — cek dari JWT role claim
ADMIN_ROLE = "admin"


def _require_admin(current_user: TokenPayload) -> TokenPayload:
    """Pastikan pengguna memiliki role admin."""
    if current_user.role != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Akses ditolak. Hanya admin yang dapat melakukan operasi ini.", "code": "FORBIDDEN"},
        )
    return current_user


def _row_to_food_item(row: dict) -> FoodItem:
    return FoodItem(
        id=str(row.get("id", "")),
        food_code=str(row.get("food_code", "")),
        name=str(row.get("name", "")),
        category=str(row.get("category", "")),
        data_source=str(row.get("data_source", "")),
        energy_kcal=float(row.get("energy_kcal", 0)),
        protein_g=row.get("protein_g"),
        fat_total_g=row.get("fat_total_g"),
        carbs_g=row.get("carbs_g"),
        fiber_g=row.get("fiber_g"),
        sodium_mg=row.get("sodium_mg"),
        potassium_mg=row.get("potassium_mg"),
        calcium_mg=row.get("calcium_mg"),
        phosphorus_mg=row.get("phosphorus_mg"),
        magnesium_mg=row.get("magnesium_mg"),
        fat_saturated_g=row.get("fat_saturated_g"),
        glycemic_index=row.get("glycemic_index"),
        region=row.get("region"),
        meal_category=row.get("meal_category"),
        is_estimated=bool(row.get("is_estimated", False)),
        reference_food=row.get("reference_food"),
        confidence_level=row.get("confidence_level"),
        is_active=bool(row.get("is_active", True)),
        dash_score=row.get("dash_score"),
    )


@router.get(
    "",
    response_model=list[FoodItem],
    summary="Daftar semua makanan aktif",
)
async def list_foods(
    region: Optional[str] = Query(None, description="Filter asal daerah"),
    category: Optional[str] = Query(None, description="Filter kategori TKPI"),
    meal_category: Optional[str] = Query(None, description="Filter waktu makan"),
    current_user: TokenPayload = Depends(get_current_user),
) -> list[FoodItem]:
    """
    Kembalikan daftar semua makanan aktif.
    Mendukung filter opsional: region, category, meal_category.
    """
    supabase = get_supabase()

    query = supabase.table("food_items").select("*").eq("is_active", True)

    if region:
        query = query.eq("region", region)
    if category:
        query = query.eq("category", category)
    if meal_category:
        query = query.eq("meal_category", meal_category)

    response = query.order("name").execute()
    return [_row_to_food_item(r) for r in (response.data or [])]


@router.get(
    "/{food_code}",
    response_model=FoodItem,
    summary="Detail satu item makanan",
)
async def get_food(
    food_code: str,
    current_user: TokenPayload = Depends(get_current_user),
) -> FoodItem:
    """Kembalikan detail satu item makanan berdasarkan food_code."""
    supabase = get_supabase()

    response = (
        supabase.table("food_items")
        .select("*")
        .eq("food_code", food_code)
        .maybe_single()
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Makanan '{food_code}' tidak ditemukan.", "code": "FOOD_NOT_FOUND"},
        )

    return _row_to_food_item(response.data)


@router.post(
    "",
    response_model=FoodItem,
    status_code=status.HTTP_201_CREATED,
    summary="Tambah item makanan baru (admin only)",
)
async def create_food(
    body: FoodItemCreate,
    current_user: TokenPayload = Depends(get_current_user),
) -> FoodItem:
    """
    Tambah item makanan baru ke database.
    Hanya dapat dilakukan oleh admin.
    """
    _require_admin(current_user)
    supabase = get_supabase()

    # Cek duplikat food_code
    existing = (
        supabase.table("food_items")
        .select("id")
        .eq("food_code", body.food_code)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": f"food_code '{body.food_code}' sudah ada.", "code": "FOOD_CODE_EXISTS"},
        )

    now = datetime.now(timezone.utc).isoformat()
    payload = body.model_dump()
    payload["created_at"] = now
    payload["updated_at"] = now
    payload["is_active"] = True

    response = supabase.table("food_items").insert(payload).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal menyimpan item makanan.", "code": "FOOD_CREATE_FAILED"},
        )

    logger.info("Item makanan baru ditambahkan: %s oleh %s", body.food_code, current_user.sub)
    return _row_to_food_item(response.data[0])


@router.put(
    "/{food_code}",
    response_model=FoodItem,
    summary="Perbarui item makanan + audit log (admin only)",
)
async def update_food(
    food_code: str,
    body: FoodItemUpdate,
    current_user: TokenPayload = Depends(get_current_user),
) -> FoodItem:
    """
    Perbarui data nutrisi item makanan.
    Menyimpan audit log otomatis (old_data vs new_data).
    Hanya dapat dilakukan oleh admin.
    """
    _require_admin(current_user)
    supabase = get_supabase()

    # Ambil data lama
    existing_resp = (
        supabase.table("food_items")
        .select("*")
        .eq("food_code", food_code)
        .maybe_single()
        .execute()
    )

    if not existing_resp or not existing_resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Makanan '{food_code}' tidak ditemukan.", "code": "FOOD_NOT_FOUND"},
        )

    old_data = existing_resp.data
    food_id = old_data["id"]

    # Bangun payload update (hanya field yang dikirim)
    update_payload = {
        k: v for k, v in body.model_dump(exclude={"change_reason"}).items()
        if v is not None
    }
    update_payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Update item
    update_resp = (
        supabase.table("food_items")
        .update(update_payload)
        .eq("food_code", food_code)
        .execute()
    )

    if not update_resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Gagal memperbarui item makanan.", "code": "FOOD_UPDATE_FAILED"},
        )

    # Simpan audit log
    try:
        supabase.table("food_items_audit_log").insert({
            "food_item_id": food_id,
            "changed_by": current_user.sub,
            "changed_at": datetime.now(timezone.utc).isoformat(),
            "old_data": old_data,
            "new_data": update_resp.data[0],
            "change_reason": body.change_reason,
        }).execute()
    except Exception as exc:
        logger.warning("Gagal simpan audit log untuk %s: %s", food_code, str(exc))

    logger.info("Item makanan diperbarui: %s oleh %s", food_code, current_user.sub)
    return _row_to_food_item(update_resp.data[0])



@router.get(
    "/search/query",
    summary="Pencarian makanan dari dataset CSV (lightweight)",
)
async def search_foods(
    q: str = Query(..., min_length=1, max_length=100, description="Kata kunci pencarian"),
    limit: int = Query(20, ge=1, le=50, description="Jumlah maksimal hasil"),
    region: Optional[str] = Query(None, description="Filter asal daerah"),
    current_user: TokenPayload = Depends(get_current_user),
) -> dict:
    """
    Pencarian makanan ringan dari food_items_clean.csv.

    Algoritma:
    - Case-insensitive substring match pada kolom 'name'
    - Boost score untuk match prefix (mulai dengan kata kunci)
    - Filter opsional region
    - Sort by relevance score lalu DASH score

    Returns:
        dict dengan items dan metadata
    """
    from pathlib import Path
    import pandas as pd
    from core.config import get_settings

    settings = get_settings()
    csv_path = Path(settings.ML_ARTIFACTS_PATH) / "food_items_clean.csv"

    if not csv_path.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "Dataset makanan tidak tersedia.", "code": "DATASET_UNAVAILABLE"},
        )

    df = pd.read_csv(csv_path)
    query_lower = q.lower().strip()

    # Filter berdasarkan match name (case-insensitive)
    name_lower = df["name"].astype(str).str.lower()
    mask = name_lower.str.contains(query_lower, na=False, regex=False)
    matches = df[mask].copy()

    # Filter region (kalau ada kolom dan parameter dikirim)
    if region and "region" in matches.columns:
        region_lower = region.lower()
        matches = matches[
            matches["region"].astype(str).str.lower().str.contains(region_lower, na=False, regex=False)
        ]

    # Compute relevance score: prefix match dapat boost
    def relevance(name: str) -> float:
        n = name.lower()
        if n.startswith(query_lower):
            return 100.0  # Highest priority
        if f" {query_lower}" in n:
            return 80.0   # Word boundary match
        return 50.0       # Substring match

    matches["_relevance"] = matches["name"].apply(relevance)

    # Sort: relevance desc, dash_score desc (kalau ada)
    sort_cols = ["_relevance"]
    if "dash_score" in matches.columns:
        sort_cols.append("dash_score")

    matches = matches.sort_values(sort_cols, ascending=[False] * len(sort_cols))

    # Ambil top N
    matches = matches.head(limit)

    # Build response
    items = []
    for _, row in matches.iterrows():
        image_url_val = row.get("image_url") if "image_url" in matches.columns else None
        image_url = (
            str(image_url_val).strip()
            if isinstance(image_url_val, str) and image_url_val.strip()
            else None
        )
        items.append({
            "food_code": str(row.get("food_code", "")),
            "name": str(row.get("name", "")),
            "category": str(row.get("category", "")),
            "region": str(row.get("region", "") or "") if "region" in row else None,
            "image_url": image_url,
            "energy_kcal": float(row.get("energy_kcal", 0) or 0),
            "sodium_mg": float(row.get("sodium_mg", 0) or 0),
            "potassium_mg": float(row.get("potassium_mg", 0) or 0),
            "fiber_g": float(row.get("fiber_g", 0) or 0),
            "fat_total_g": float(row.get("fat_total_g", 0) or 0),
            "dash_score": float(row.get("dash_score", 0) or 0) if "dash_score" in row else None,
            "dash_category": str(row.get("dash_category", "") or "") if "dash_category" in row else None,
            "is_estimated": bool(row.get("is_estimated", False)) if "is_estimated" in row else False,
        })

    return {
        "query": q,
        "count": len(items),
        "items": items,
    }
