"""
Agregasi semua router API v1 untuk TensiMenu Backend.
Semua endpoint berada di bawah prefix /api/v1.
"""

from fastapi import APIRouter

from .health import router as health_router

# Router utama v1 — semua sub-router didaftarkan di sini
api_router = APIRouter(prefix="/api/v1")

# Health check (tidak memerlukan autentikasi)
api_router.include_router(health_router)

# Router lain akan ditambahkan seiring implementasi fase berikutnya:
# from .auth import router as auth_router
# from .profile import router as profile_router
# from .recommendations import router as recommendations_router
# from .dash_score import router as dash_score_router
# from .logs import router as logs_router
# from .progress import router as progress_router
# from .blood_pressure import router as blood_pressure_router
# from .food_database import router as food_database_router
