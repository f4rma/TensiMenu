"""
Pydantic models untuk riwayat tekanan darah TensiMenu.
"""

from typing import Optional
from pydantic import BaseModel, Field


class BloodPressureCreate(BaseModel):
    """Request body untuk mencatat tekanan darah baru."""

    systolic_mmhg: int = Field(..., ge=70, le=250, description="Tekanan sistolik (mmHg)")
    diastolic_mmhg: int = Field(..., ge=40, le=150, description="Tekanan diastolik (mmHg)")
    measured_at: str = Field(..., description="Waktu pengukuran (ISO 8601)")
    notes: Optional[str] = Field(None, max_length=500)


class BloodPressureResponse(BaseModel):
    """Response satu catatan tekanan darah."""

    id: str
    user_id: str
    systolic_mmhg: int
    diastolic_mmhg: int
    measured_at: str
    notes: Optional[str] = None
    is_critical: bool  # True jika sistolik >= 180 atau diastolik >= 120
    created_at: str


class BloodPressureListResponse(BaseModel):
    """Response daftar riwayat tekanan darah."""

    items: list[BloodPressureResponse]
    total: int
