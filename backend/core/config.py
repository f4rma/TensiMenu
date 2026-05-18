# Konfigurasi aplikasi TensiMenu Backend. Memuat semua environtment variabel  yang diperlukan dari file .env

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):

    # Informasi Aplikasi
    APP_NAME: str = "TensiMenu API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Supabase 
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # JWT (Supabase JWT Secret) 
    SUPABASE_JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # CORS 
    # Daftar origin yang diizinkan, dipisahkan koma
    CORS_ORIGINS: str = "http://localhost:3000"

    # Rate Limiting 
    RATE_LIMIT_PER_MINUTE: int = 100

    # Database Retry 
    DB_RETRY_ATTEMPTS: int = 3
    DB_RETRY_BASE_DELAY: float = 1.0  # detik, jeda eksponensial: 1s, 2s, 4s

    # Artefak ML 
    ML_ARTIFACTS_PATH: str = "ml/artifacts"

    @property
    def cors_origins_list(self) -> List[str]:
        """Kembalikan daftar CORS origins dari string yang dipisahkan koma."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Kembalikan instance Settings yang di-cache.
    Menggunakan lru_cache agar .env hanya dibaca sekali saat startup.
    """
    return Settings()
