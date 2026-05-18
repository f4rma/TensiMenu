"""
Endpoint health check untuk TensiMenu Backend.
GET /api/v1/health — mengembalikan status sistem dan konektivitas database (Req. 12.6).
"""

from fastapi import APIRouter
from pydantic import BaseModel

from core.database import check_database_connectivity
from core.config import get_settings

router = APIRouter()


class HealthResponse(BaseModel):
    """Skema respons health check."""

    status: str          # "ok" atau "degraded"
    database: str        # "connected" atau "disconnected"
    version: str         # Versi aplikasi


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description=(
        "Periksa status sistem dan konektivitas database. "
        "Mengembalikan 'ok' jika semua layanan berjalan normal."
    ),
    tags=["System"],
)
async def health_check() -> HealthResponse:
    """
    Endpoint health check.

    Mengembalikan:
    - status: "ok" jika database terhubung, "degraded" jika tidak
    - database: "connected" atau "disconnected"
    - version: versi aplikasi saat ini
    """
    settings = get_settings()

    # Periksa konektivitas database tanpa melempar exception
    db_connected = await check_database_connectivity()

    return HealthResponse(
        status="ok" if db_connected else "degraded",
        database="connected" if db_connected else "disconnected",
        version=settings.APP_VERSION,
    )
