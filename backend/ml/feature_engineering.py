"""
Feature engineering untuk pipeline ML TensiMenu.
Mendefinisikan fitur DASH, bobot nutrisi, dan fungsi konversi vektor.
"""

import numpy as np

# 5 fitur DASH yang tersedia di dataset TKPI 2017
DASH_FEATURES = [
    "sodium_mg",      # Negatif: lebih rendah lebih baik
    "potassium_mg",   # Positif: lebih tinggi lebih baik
    "calcium_mg",     # Positif
    "fiber_g",        # Positif
    "fat_total_g",    # Negatif
]

# Bobot dan arah optimasi setiap fitur DASH (total bobot = 1.0)
NUTRIENT_WEIGHTS: dict[str, dict] = {
    "sodium_mg":    {"direction": "lower",  "weight": 0.30},
    "potassium_mg": {"direction": "higher", "weight": 0.25},
    "calcium_mg":   {"direction": "higher", "weight": 0.20},
    "fiber_g":      {"direction": "higher", "weight": 0.15},
    "fat_total_g":  {"direction": "lower",  "weight": 0.10},
}


def build_user_nutrition_vector(targets: dict) -> np.ndarray:
    """
    Konversi target nutrisi personal ke vektor numpy 5-dimensi.
    Urutan sesuai DASH_FEATURES.

    Args:
        targets: dict dari calculate_personal_targets()

    Returns:
        np.ndarray shape (5,)
    """
    return np.array([targets[f] for f in DASH_FEATURES], dtype=np.float64)


def extract_food_features(food_items: list[dict]) -> np.ndarray:
    """
    Ekstrak 5 fitur DASH dari list item makanan ke matriks numpy.

    Args:
        food_items: list of dict, setiap dict harus punya key DASH_FEATURES

    Returns:
        np.ndarray shape (N, 5)
    """
    return np.array(
        [[item[f] for f in DASH_FEATURES] for item in food_items],
        dtype=np.float64,
    )
