"""
Pydantic models untuk database makanan TensiMenu.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class FoodItem(BaseModel):
    """Representasi satu item makanan dari database."""

    id: str
    food_code: str
    name: str
    category: str
    data_source: str
    energy_kcal: float
    protein_g: Optional[float] = None
    fat_total_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    potassium_mg: Optional[float] = None
    calcium_mg: Optional[float] = None
    phosphorus_mg: Optional[float] = None
    # Field tambahan (opsional, dari enrichment USDA/Nutrisurvey)
    magnesium_mg: Optional[float] = None
    fat_saturated_g: Optional[float] = None
    glycemic_index: Optional[int] = None
    # Metadata
    region: Optional[str] = None
    meal_category: Optional[str] = None  # sarapan/makan_siang/makan_malam/camilan
    is_estimated: bool = False
    reference_food: Optional[str] = None
    confidence_level: Optional[Literal["tinggi", "sedang", "rendah"]] = None
    is_active: bool = True
    dash_score: Optional[float] = None


class FoodItemCreate(BaseModel):
    """Request body untuk menambah item makanan baru (admin only)."""

    food_code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=255)
    category: str
    data_source: Literal["DKPI", "USDA", "Nutrisurvey", "Estimasi"]
    energy_kcal: float = Field(..., ge=0)
    protein_g: float = Field(..., ge=0)
    fat_total_g: float = Field(..., ge=0)
    carbs_g: float = Field(..., ge=0)
    fiber_g: float = Field(..., ge=0)
    sodium_mg: float = Field(..., ge=0)
    potassium_mg: float = Field(..., ge=0)
    calcium_mg: float = Field(..., ge=0)
    phosphorus_mg: Optional[float] = Field(None, ge=0)
    magnesium_mg: Optional[float] = Field(None, ge=0)
    fat_saturated_g: Optional[float] = Field(None, ge=0)
    glycemic_index: Optional[int] = Field(None, ge=0, le=100)
    region: Optional[str] = None
    meal_category: Optional[Literal["sarapan", "makan_siang", "makan_malam", "camilan"]] = None
    is_estimated: bool = False
    reference_food: Optional[str] = None
    confidence_level: Optional[Literal["tinggi", "sedang", "rendah"]] = None


class FoodItemUpdate(BaseModel):
    """Request body untuk memperbarui item makanan (admin only)."""

    name: Optional[str] = None
    energy_kcal: Optional[float] = Field(None, ge=0)
    protein_g: Optional[float] = Field(None, ge=0)
    fat_total_g: Optional[float] = Field(None, ge=0)
    carbs_g: Optional[float] = Field(None, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)
    potassium_mg: Optional[float] = Field(None, ge=0)
    calcium_mg: Optional[float] = Field(None, ge=0)
    phosphorus_mg: Optional[float] = Field(None, ge=0)
    magnesium_mg: Optional[float] = Field(None, ge=0)
    fat_saturated_g: Optional[float] = Field(None, ge=0)
    glycemic_index: Optional[int] = Field(None, ge=0, le=100)
    region: Optional[str] = None
    meal_category: Optional[str] = None
    is_estimated: Optional[bool] = None
    reference_food: Optional[str] = None
    confidence_level: Optional[Literal["tinggi", "sedang", "rendah"]] = None
    is_active: Optional[bool] = None
    change_reason: Optional[str] = Field(None, description="Alasan perubahan (untuk audit log)")
