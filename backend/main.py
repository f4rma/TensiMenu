# Entry point utama TensiMenu Backend (FastAPI).
# Mengonfigurasi aplikasi, CORS middleware, rate limiting, dan mendaftarkan semua router.

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from api.v1.router import api_router
from core.config import get_settings
from core.rate_limiter import limiter, rate_limit_exceeded_handler

# Konfigurasi logging dasar
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lifecycle handler aplikasi. Dijalankan saat startup dan shutdown.
    settings = get_settings()
    logger.info("TensiMenu Backend v%s sedang dimulai...", settings.APP_VERSION)
    logger.info("Mode debug: %s", settings.DEBUG)
    logger.info("CORS origins yang diizinkan: %s", settings.cors_origins_list)
    yield
    logger.info("TensiMenu Backend sedang dimatikan.")


def create_app() -> FastAPI:
    # Buat dan konfigurasi instance FastAPI. Dipisahkan ke fungsi ini agar mudah diuji.
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "API Backend TensiMenu — Sistem Rekomendasi Makanan Lokal "
            "Berbasis DASH Diet untuk Penderita Hipertensi."
        ),
        docs_url="/docs",       # Swagger UI (Req. 12.2)
        redoc_url="/redoc",     # ReDoc alternatif
        openapi_url="/openapi.json",
        lifespan=lifespan,
        debug=settings.DEBUG,
    )

    # Rate Limiter 
    # Pasang state limiter ke aplikasi (diperlukan oleh slowapi)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # CORS Middleware
    # Izinkan frontend Next.js (localhost:3000) dan origin yang dikonfigurasi via env
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )

    # Exception Handler Global
    # Pastikan semua error 4xx/5xx mengembalikan JSON terstruktur tanpa stack trace
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "Error tidak tertangani pada %s %s: %s",
            request.method,
            request.url.path,
            str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Terjadi kesalahan internal pada server.",
                "code": "INTERNAL_SERVER_ERROR",
            },
        )

    # Daftarkan Router
    app.include_router(api_router)

    return app


# Instance aplikasi utama
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
