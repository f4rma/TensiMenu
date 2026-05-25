"""
Loader artefak model ML TensiMenu.
Memuat scaler.pkl, item_matrix.npy, food_ids.json, metadata.json
satu kali saat startup FastAPI, kemudian menyimpannya di memori.
"""

import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler

from core.config import get_settings

logger = logging.getLogger(__name__)


class ModelArtifacts:
    # Container untuk semua artefak model yang dimuat

    def __init__(
        self,
        scaler: StandardScaler,
        item_matrix: np.ndarray,
        food_ids: list[str],
        metadata: dict,
    ):
        self.scaler = scaler
        self.item_matrix = item_matrix
        self.food_ids = food_ids
        self.metadata = metadata
        self.version: str = metadata.get("version", "unknown")
        self.n_items: int = metadata.get("n_items", len(food_ids))
        self.features: list[str] = metadata.get("features", [])

    def __repr__(self) -> str:
        return (
            f"ModelArtifacts(version={self.version}, "
            f"n_items={self.n_items}, features={self.features})"
        )


# Singleton — dimuat sekali saat startup
_artifacts: Optional[ModelArtifacts] = None


def load_model_artifacts(artifacts_path: Optional[str] = None) -> ModelArtifacts:
    # Muat semua artefak model dari disk.
    # Dipanggil sekali saat startup FastAPI (lifespan handler di main.py).
    """
    Args:
        artifacts_path: path ke folder artifacts. Jika None, ambil dari config.

    Returns:
        ModelArtifacts yang sudah dimuat

    Raises:
        FileNotFoundError: jika salah satu artefak tidak ditemukan
        RuntimeError: jika artefak tidak konsisten
    """
    global _artifacts

    settings = get_settings()
    path = Path(artifacts_path or settings.ML_ARTIFACTS_PATH)

    required_files = ["scaler.pkl", "item_matrix.npy", "food_ids.json", "metadata.json"]
    for fname in required_files:
        if not (path / fname).exists():
            raise FileNotFoundError(
                f"Artefak model tidak ditemukan: {path / fname}. "
                "Jalankan notebook preprocessing terlebih dahulu."
            )

    logger.info("Memuat artefak model dari: %s", path.resolve())

    scaler: StandardScaler = joblib.load(path / "scaler.pkl")
    item_matrix: np.ndarray = np.load(path / "item_matrix.npy")

    with open(path / "food_ids.json", encoding="utf-8") as f:
        food_ids: list[str] = json.load(f)

    with open(path / "metadata.json", encoding="utf-8") as f:
        metadata: dict = json.load(f)

    # Validasi konsistensi
    if item_matrix.shape[0] != len(food_ids):
        raise RuntimeError(
            f"Inkonsistensi artefak: item_matrix memiliki {item_matrix.shape[0]} baris "
            f"tapi food_ids memiliki {len(food_ids)} entri."
        )

    _artifacts = ModelArtifacts(
        scaler=scaler,
        item_matrix=item_matrix,
        food_ids=food_ids,
        metadata=metadata,
    )

    logger.info(
        "Model dimuat: v%s | %d item | %d fitur",
        _artifacts.version,
        _artifacts.n_items,
        item_matrix.shape[1],
    )
    return _artifacts


def get_model_artifacts() -> ModelArtifacts:
    """
    Kembalikan artefak model yang sudah dimuat.
    Digunakan sebagai FastAPI dependency.

    Raises:
        RuntimeError: jika model belum dimuat (load_model_artifacts belum dipanggil)
    """
    if _artifacts is None:
        raise RuntimeError(
            "Model belum dimuat. Pastikan load_model_artifacts() "
            "dipanggil saat startup aplikasi."
        )
    return _artifacts


def is_model_loaded() -> bool:
    """Cek apakah model sudah dimuat. Digunakan oleh health check."""
    return _artifacts is not None
