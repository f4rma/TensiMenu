"""Debug script untuk memahami kenapa DASH score rendah."""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from services.dash_score_service import calculate_dash_score
from services.nutrition_calculator import calculate_personal_targets


def categorize(score):
    if score >= 80:
        return "Sangat Baik"
    if score >= 60:
        return "Baik"
    if score >= 40:
        return "Cukup"
    return "Perlu Perhatian"


def main():
    df = pd.read_csv(BACKEND / "ml" / "artifacts" / "food_items_clean.csv")
    targets = calculate_personal_targets("laki-laki", 70, 170, 30, [])

    print("=" * 70)
    print("Target nutrisi personal (dewasa sehat, laki-laki, 30 thn):")
    for k, v in targets.items():
        print(f"  {k:20s}: {v}")

    # Recompute scores
    def score_row(row):
        return calculate_dash_score(
            {
                "sodium_mg": row["sodium_mg"],
                "potassium_mg": row["potassium_mg"],
                "calcium_mg": row["calcium_mg"],
                "fiber_g": row["fiber_g"],
                "fat_total_g": row["fat_total_g"],
            },
            targets,
        )

    df["recalc"] = df.apply(score_row, axis=1)

    print("\n" + "=" * 70)
    print("Recalculated DASH score (pakai target HARIAN sebagai pembanding):")
    print(df["recalc"].describe())
    print("\nDistribusi kategori:")
    print(df["recalc"].apply(categorize).value_counts())

    print("\n" + "=" * 70)
    print("ROOT CAUSE ANALYSIS")
    print("=" * 70)
    sample = df.iloc[100]
    print(f"\nContoh item: {sample['name']}")
    print(f"  Kalium aktual (per 100g): {sample['potassium_mg']} mg")
    print(f"  Target kalium HARIAN     : {targets['potassium_mg']} mg")
    print(f"  Ratio: {sample['potassium_mg']/targets['potassium_mg']:.3f}")
    print(
        f"\n  Untuk nutrisi 'higher', contribution = min(aktual/target, 1.0)"
    )
    print(
        f"  Karena per 100g << target harian, hampir semua item dapat"
    )
    print(f"  contribution kecil untuk K/Ca/serat -> total score rendah.")

    print("\n" + "=" * 70)
    print("REKOMENDASI FIX")
    print("=" * 70)
    print(
        """
1. DASH score harus dihitung per SAJIAN dengan target PER-SAJIAN, bukan
   per 100g vs target harian. Asumsikan 1 sajian = ~30% target harian.

2. Atau threshold kategori disesuaikan untuk skala per 100g:
   - "Sangat Baik" : >= 65 (top 1%)
   - "Baik"        : >= 50 (top 10%)
   - "Cukup"       : >= 40 (median)
   - "Perlu Perhatian" : < 40

3. Atau formula DASH score di-rescale supaya distribusi mengikuti
   percentile ranking dataset, bukan ratio absolut.
"""
    )


if __name__ == "__main__":
    main()
