"""Periksa apakah rekomendasi yang muncul mayoritas bahan mentah atau olahan."""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from ml.content_based_filter import recommend
from ml.model_loader import load_model_artifacts
from services.nutrition_calculator import calculate_personal_targets


def classify_form(name: str) -> str:
    """Heuristik kasar: klasifikasikan jenis bentuk makanan."""
    name_lower = name.lower()
    raw_keywords = ["mentah", "segar", "kering"]
    cooked_keywords = [
        "goreng",
        "rebus",
        "kukus",
        "bakar",
        "panggang",
        "tumis",
        "sop",
        "soto",
        "gulai",
        "rendang",
        "sayur",
        "sate",
        "asem",
    ]

    for kw in raw_keywords:
        if kw in name_lower:
            return "Mentah/Segar"
    for kw in cooked_keywords:
        if kw in name_lower:
            return "Olahan"
    return "Tidak jelas"


def main():
    artifacts = load_model_artifacts(BACKEND / "ml" / "artifacts")
    df = pd.read_csv(BACKEND / "ml" / "artifacts" / "food_items_clean.csv")

    print("=" * 80)
    print("ANALISA DATASET — Total 792 item TKPI")
    print("=" * 80)
    df["form"] = df["name"].apply(classify_form)
    print("\nDistribusi bentuk makanan di dataset:")
    print(df["form"].value_counts())
    print(f"\nTotal: {len(df)} item")
    print(f"Olahan: {(df['form'] == 'Olahan').sum()} ({(df['form'] == 'Olahan').mean():.1%})")
    print(f"Mentah/Segar: {(df['form'] == 'Mentah/Segar').sum()} ({(df['form'] == 'Mentah/Segar').mean():.1%})")
    print(f"Tidak jelas: {(df['form'] == 'Tidak jelas').sum()} ({(df['form'] == 'Tidak jelas').mean():.1%})")

    print("\n" + "=" * 80)
    print("REKOMENDASI AKTUAL — Persona dewasa sehat, top 10")
    print("=" * 80)
    targets = calculate_personal_targets("laki-laki", 70, 170, 30, [])
    rec = recommend(targets, df, artifacts, top_k=10)

    rec_with_form = rec.merge(df[["food_code", "form"]], on="food_code", how="left")
    print("\nTop 10 rekomendasi:")
    for i, row in rec_with_form.iterrows():
        print(f"  {i+1:2d}. [{row['form']:14s}] {row['name']} (DASH={row['dash_score']:.1f})")

    print(f"\nRingkasan top 10:")
    print(rec_with_form["form"].value_counts())

    print("\n" + "=" * 80)
    print("CONTOH OLAHAN YANG ADA DI DATASET")
    print("=" * 80)
    olahan = df[df["form"] == "Olahan"][["name", "category", "dash_score"]].head(15)
    print(olahan.to_string(index=False))


if __name__ == "__main__":
    main()
