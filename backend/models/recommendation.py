"""
Pydantic models untuk endpoint rekomendasi dan DASH Score.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# ─── DASH Score ───────────────────────────────────────────────────────────────

class DashScoreItem(BaseModel):
    food_code: str
    food_name: str
    dash_score: float
    dash_category: str


class ImprovementTip(BaseModel):
    nutrient: str
    nutrient_label: str
    actual_value: float
    target_value: float
    gap: float
    suggested_foods: List[str] = []


class DashScoreRequest(BaseModel):
    """Request untuk menghitung DASH Score beberapa item sekaligus."""
    items: List[dict] = Field(
        ...,
        description="List of {food_code: str, serving_g: float}",
        example=[{"food_code": "AP001", "serving_g": 150}],
    )


class DashScoreResponse(BaseModel):
    items: List[DashScoreItem]
    daily_dash_score: float
    daily_dash_category: str
    improvement_tips: Optional[List[ImprovementTip]] = None


# ─── Rekomendasi Makanan ──────────────────────────────────────────────────────

class FoodItemRecommended(BaseModel):
    food_code: str
    name: str
    category: str
    similarity: float
    dash_score: Optional[float] = None
    dash_category: Optional[str] = None
    is_repeated: bool = False  # True jika fallback anti-repetisi

    # Informasi tambahan untuk display di UI
    region: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_estimated: bool = False  # True untuk masakan olahan dengan estimasi nutrisi

    # Nutrisi per 100 gram (ditampilkan di kartu rekomendasi)
    energy_kcal: float = 0.0
    sodium_mg: float = 0.0
    potassium_mg: float = 0.0
    fiber_g: float = 0.0
    fat_total_g: float = 0.0
    phosphorus_mg: float = 0.0

    # Porsi default untuk kategori ini (gram per 1 sajian standar). Frontend
    # memakai ini saat membangun payload /confirm supaya kalori/natrium yang
    # dicatat realistis (mis. ikan 50 g, bukan flat 100 g).
    default_serving_g: float = 100.0


class MealPlanResponse(BaseModel):
    """Rencana makan harian yang dihasilkan oleh CBF pipeline."""
    recommendations: List[FoodItemRecommended]
    total_dash_score: float
    total_dash_category: str
    nutrition_warnings: List[str] = []
    note: Optional[str] = None


class ConfirmConsumptionRequest(BaseModel):
    """Request untuk konfirmasi konsumsi rencana makan."""
    food_codes: List[str] = Field(..., description="Daftar food_code yang dikonsumsi")
    servings_g: Optional[List[float]] = Field(
        None, description="Porsi dalam gram per item (urutan sama dengan food_codes)"
    )
    notes: Optional[str] = None


class ConfirmConsumptionResponse(BaseModel):
    log_id: str
    log_date: str
    dash_score: float
    message: str = "Konsumsi berhasil dicatat."
