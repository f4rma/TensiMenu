"""Sanity check: pastikan masakan tradisional muncul di rekomendasi yang relevan."""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from ml.content_based_filter import recommend
from ml.model_loader import load_model_artifacts
from services.nutrition_calculator import calculate_personal_targets


def main():
    artifacts = load_model_artifacts(BACKEND / "ml" / "artifacts")
    df = pd.read_csv(BACKEND / "ml" / "artifacts" / "food_items_clean.csv")

    print("=" * 80)
    print("SANITY CHECK: Apakah masakan jadi muncul di rekomendasi?")
    print("=" * 80)

    targets = calculate_personal_targets("laki-laki", 70, 170, 35, [])

    # Test 1: Top 30 untuk dewasa sehat
    rec = recommend(targets, df, artifacts, top_k=30)
    rec_full = rec.merge(df[["food_code", "is_estimated", "region"]], on="food_code", how="left")
    n_dishes = rec_full["is_estimated"].sum()
    print(f"\nTop 30 — Total masakan jadi: {n_dishes}")
    if n_dishes > 0:
        for _, row in rec_full[rec_full["is_estimated"]].iterrows():
            print(f"  + {row['name']:30s} | {row['region']:20s} | DASH={row['dash_score']:.1f}")

    # Test 2: Per kategori "Daging & Unggas" — harusnya muncul rendang, sate, gulai, dll
    print("\n" + "=" * 80)
    print("Filter kategori 'Daging & Unggas' — top 10")
    print("=" * 80)
    rec_meat = recommend(targets, df, artifacts, top_k=10, category_filter="Daging & Unggas")
    rec_meat = rec_meat.merge(df[["food_code", "is_estimated", "region"]], on="food_code", how="left")
    for i, row in rec_meat.iterrows():
        marker = "[MASAKAN]" if row.get("is_estimated") else "[BAHAN]  "
        print(f"  {i+1:2d}. {marker} {row['name']:35s} | DASH={row['dash_score']:.1f}")

    # Test 3: Per kategori "Sayuran"
    print("\n" + "=" * 80)
    print("Filter kategori 'Sayuran' — top 10")
    print("=" * 80)
    rec_veg = recommend(targets, df, artifacts, top_k=10, category_filter="Sayuran")
    rec_veg = rec_veg.merge(df[["food_code", "is_estimated", "region"]], on="food_code", how="left")
    for i, row in rec_veg.iterrows():
        marker = "[MASAKAN]" if row.get("is_estimated") else "[BAHAN]  "
        print(f"  {i+1:2d}. {marker} {row['name']:35s} | DASH={row['dash_score']:.1f}")

    # Test 4: Pasien CKD — masakan apa yang aman?
    print("\n" + "=" * 80)
    print("Pasien CKD — masakan yang muncul di rekomendasi")
    print("=" * 80)
    targets_ckd = calculate_personal_targets("laki-laki", 75, 168, 65, ["ckd"], systolic_bp=165)
    rec_ckd = recommend(targets_ckd, df, artifacts, top_k=30, comorbidities=["ckd"])
    rec_ckd = rec_ckd.merge(
        df[["food_code", "is_estimated", "region", "potassium_mg", "phosphorus_mg"]],
        on="food_code", how="left"
    )
    dishes_ckd = rec_ckd[rec_ckd["is_estimated"]]
    if len(dishes_ckd) > 0:
        for _, row in dishes_ckd.iterrows():
            print(f"  + {row['name']:30s} | K={row['potassium_mg']:.0f}mg | P={row['phosphorus_mg']:.0f}mg | DASH={row['dash_score']:.1f}")
    else:
        print("  Tidak ada masakan jadi yang muncul di top 30 (semuanya bahan)")


if __name__ == "__main__":
    main()
