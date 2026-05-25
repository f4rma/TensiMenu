"""
Kalkulasi target nutrisi personal berbasis DASH Diet.
Menggunakan rumus Mifflin-St Jeor untuk BMR dengan penyesuaian komorbid.
"""

from typing import List, Optional


def calculate_personal_targets(
    gender: str,
    weight_kg: float,
    height_cm: float,
    age: int,
    comorbidities: Optional[List[str]] = None,
    systolic_bp: Optional[int] = None,
) -> dict:
    """
    Hitung target nutrisi harian personal berdasarkan profil pengguna.

    Rumus BMR (Mifflin-St Jeor):
      Laki-laki: BMR = (10 × BB) + (6.25 × TB) − (5 × usia) + 5
      Perempuan: BMR = (10 × BB) + (6.25 × TB) − (5 × usia) − 161

    Returns:
        dict target nutrisi harian (mg/g/kkal)
    """
    if comorbidities is None:
        comorbidities = []

    # Hitung BMR
    if gender == "laki-laki":
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161

    # Target dasar DASH
    targets = {
        "sodium_mg": 2300.0,
        "potassium_mg": 4000.0,
        "calcium_mg": 1200.0 if age > 50 else 1000.0,
        "fiber_g": 38.0 if gender == "laki-laki" else 25.0,
        "fat_total_g": round(bmr * 0.27 / 9, 1),   # 27% energi dari lemak
        "energy_kcal": round(bmr),
        "phosphorus_mg": 1250.0,
    }

    # Penyesuaian CKD
    if "ckd" in comorbidities:
        targets["sodium_mg"] = 1500.0
        targets["potassium_mg"] = 2000.0
        targets["phosphorus_mg"] = 800.0

    # Penyesuaian hipertensi berat (sistolik >= 150)
    if systolic_bp is not None and systolic_bp >= 150:
        targets["sodium_mg"] = 1500.0

    return targets
