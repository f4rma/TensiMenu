"""
Agregasi semua router API v1 untuk TensiMenu Backend.
Semua endpoint berada di bawah prefix /api/v1.
"""

from fastapi import APIRouter

from .health import router as health_router
from .auth import router as auth_router
from .profile import router as profile_router
from .recommendations import router as recommendations_router
from .dash_score import router as dash_score_router
from .blood_pressure import router as blood_pressure_router
from .progress import router as progress_router
from .food_database import router as food_database_router

# Router utama v1
api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(recommendations_router)
api_router.include_router(dash_score_router)
api_router.include_router(blood_pressure_router)
api_router.include_router(progress_router)
api_router.include_router(food_database_router)
