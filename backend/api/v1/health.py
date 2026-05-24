"""
Endpoint health check untuk TensiMenu Backend.
GET /api/v1/health — mengembalikan status sistem dan konektivitas database (Req. 12.6).
"""

from fastapi import APIRouter
from pydantic import BaseModel

from core.database import check_database_connectivity
from core.config import get_settings
from ml.model_loader import is_model_loaded

router = APIRouter()


class HealthResponse(BaseModel):
    """Skema respons health check."""

    status: str       # "ok" atau "degraded"
    database: str     # "connected" atau "disconnected"
    ml_model: str     # "loaded" atau "not_loaded"
    version: str      # Versi aplikasi


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description=(
        "Periksa status sistem, konektivitas database, dan status model ML. "
        "Mengembalikan 'ok' jika semua layanan berjalan normal."
    ),
    tags=["System"],
)
async def health_check() -> HealthResponse:
    """
    Endpoint health check.

    Mengembalikan:
    - status: "ok" jika database terhubung dan model dimuat, "degraded" jika tidak
    - database: "connected" atau "disconnected"
    - ml_model: "loaded" atau "not_loaded"
    - version: versi aplikasi saat ini
    """
    settings = get_settings()

    db_connected = await check_database_connectivity()
    model_loaded = is_model_loaded()

    overall_ok = db_connected and model_loaded

    return HealthResponse(
        status="ok" if overall_ok else "degraded",
        database="connected" if db_connected else "disconnected",
        ml_model="loaded" if model_loaded else "not_loaded",
        version=settings.APP_VERSION,
    )
