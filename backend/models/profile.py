"""
Pydantic models untuk profil pengguna TensiMenu.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from typing import Literal


# Physical Activity Level options. Disinkronkan dengan
# services.nutrition_calculator.PAL_FACTORS.
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]


class UserProfileCreate(BaseModel):
    """Request body untuk membuat profil baru."""

    full_name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=18, le=90)
    gender: Literal["laki-laki", "perempuan"]
    weight_kg: float = Field(..., gt=0)
    height_cm: float = Field(..., gt=0)
    systolic_bp: Optional[int] = Field(None, ge=70, le=250)
    diastolic_bp: Optional[int] = Field(None, ge=40, le=150)
    activity_level: ActivityLevel = "light"
    comorbidities: List[str] = Field(default_factory=list)
    food_restrictions: List[str] = Field(default_factory=list)
    regional_prefs: List[str] = Field(default_factory=list)
    avatar_style: Optional[str] = Field(None, max_length=50)


class UserProfileUpdate(BaseModel):
    """Request body untuk memperbarui profil (semua field opsional)."""

    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=18, le=90)
    gender: Optional[Literal["laki-laki", "perempuan"]] = None
    weight_kg: Optional[float] = Field(None, gt=0)
    height_cm: Optional[float] = Field(None, gt=0)
    systolic_bp: Optional[int] = Field(None, ge=70, le=250)
    diastolic_bp: Optional[int] = Field(None, ge=40, le=150)
    activity_level: Optional[ActivityLevel] = None
    comorbidities: Optional[List[str]] = None
    food_restrictions: Optional[List[str]] = None
    regional_prefs: Optional[List[str]] = None
    avatar_style: Optional[str] = Field(None, max_length=50)


class NutritionTargets(BaseModel):
    """Target nutrisi harian personal."""

    sodium_mg: float
    potassium_mg: float
    calcium_mg: float
    fiber_g: float
    fat_total_g: float
    energy_kcal: float
    phosphorus_mg: float


class UserProfileResponse(BaseModel):
    """Response profil pengguna lengkap."""

    id: str
    user_id: str
    full_name: str
    age: int
    gender: str
    weight_kg: float
    height_cm: float
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    activity_level: ActivityLevel = "light"
    comorbidities: List[str] = []
    food_restrictions: List[str] = []
    regional_prefs: List[str] = []
    avatar_style: Optional[str] = None
    daily_targets: Optional[NutritionTargets] = None
    is_complete: bool
    created_at: str
    updated_at: str
