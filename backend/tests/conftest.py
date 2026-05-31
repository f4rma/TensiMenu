"""
Shared pytest fixtures untuk semua test ML TensiMenu.
"""

import sys
from pathlib import Path

import pandas as pd
import pytest

# Tambahkan backend/ ke sys.path agar `import ml.X` dapat ditemukan saat test
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.model_loader import ModelArtifacts, load_model_artifacts  # noqa: E402


@pytest.fixture(scope="session")
def artifacts() -> ModelArtifacts:
    """Muat model artifacts sekali untuk seluruh test session."""
    return load_model_artifacts(str(BACKEND_DIR / "ml" / "artifacts"))


@pytest.fixture(scope="session")
def food_df() -> pd.DataFrame:
    """Muat dataset makanan bersih sekali untuk seluruh session."""
    csv_path = BACKEND_DIR / "ml" / "artifacts" / "food_items_clean.csv"
    return pd.read_csv(csv_path)


@pytest.fixture(scope="session")
def base_targets() -> dict:
    """
    Target nutrisi untuk persona standar:
    laki-laki sehat, 35 tahun, 70 kg, 170 cm, no comorbid.
    """
    from services.nutrition_calculator import calculate_personal_targets

    return calculate_personal_targets(
        gender="laki-laki",
        weight_kg=70,
        height_cm=170,
        age=35,
        comorbidities=[],
        systolic_bp=120,
    )
