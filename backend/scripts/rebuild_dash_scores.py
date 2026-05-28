"""
Rebuild DASH scores di food_items_clean.csv menggunakan formula yang sudah diperbaiki.

Pendekatan:
- Untuk pre-computed dataset score (yang dipakai filtering kandidat),
  gunakan target nutrisi REFERENSI populasi dewasa sehat sebagai baseline.
- Score personalisasi tetap dihitung saat runtime via dash_score_service.

Jalankan dari backend root:
    python scripts/rebuild_dash_scores.py
"""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from services.dash_score_service import (
    calculate_dash_score,
    get_dash_category,
)
from services.nutrition_calculator import calculate_personal_targets


def main():
    csv_path = BACKEND / "ml" / "artifacts" / "food_items_clean.csv"
    df = pd.read_csv(csv_path)

    # Target referensi: dewasa sehat (dari guideline DASH umum)
    # Dipakai untuk pre-rank dataset; score personal dihitung runtime
    reference_targets = calculate_personal_targets(
        gender="laki-laki",
        weight_kg=70,
        height_cm=170,
        age=35,
        comorbidities=[],
    )

    print("Reference targets:", reference_targets)
    print(f"Recomputing DASH scores untuk {len(df)} item...")

    def score(row):
        return calculate_dash_score(
            {
                "sodium_mg": row["sodium_mg"],
                "potassium_mg": row["potassium_mg"],
                "calcium_mg": row["calcium_mg"],
                "fiber_g": row["fiber_g"],
                "fat_total_g": row["fat_total_g"],
            },
            reference_targets,
        )

    df["dash_score"] = df.apply(score, axis=1)
    df["dash_category"] = df["dash_score"].apply(get_dash_category)

    # Backup dan save
    backup_path = csv_path.with_suffix(".backup.csv")
    if not backup_path.exists():
        pd.read_csv(csv_path).to_csv(backup_path, index=False)
        print(f"Backup tersimpan: {backup_path}")

    df.to_csv(csv_path, index=False)

    print("\n=== Distribusi Baru ===")
    print(df["dash_score"].describe())
    print()
    print("=== Kategori Baru ===")
    print(df["dash_category"].value_counts())
    print()
    print("=== Top 5 ===")
    print(df.nlargest(5, "dash_score")[["name", "dash_score", "dash_category"]].to_string(index=False))


if __name__ == "__main__":
    main()
