"""
Merge dataset masakan tradisional ke dataset utama, lalu retrain model.

Pipeline:
1. Load food_items_clean.csv (TKPI 2017, 792 item)
2. Load traditional_dishes.csv (30 masakan jadi)
3. Align skema (samakan kolom)
4. Concat → food_items_clean.csv yang baru
5. Retrain artefak ML (scaler, item_matrix, food_ids, metadata)
6. Backup artefak lama dengan suffix .v1.0.0
"""

import json
import shutil
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

BACKEND = Path(__file__).resolve().parent.parent
ARTIFACTS = BACKEND / "ml" / "artifacts"
sys.path.insert(0, str(BACKEND))

# 5 fitur DASH yang dipakai model (sama dengan metadata.json)
DASH_FEATURES = [
    "sodium_mg",
    "potassium_mg",
    "calcium_mg",
    "fiber_g",
    "fat_total_g",
]

NUTRIENT_WEIGHTS = {
    "sodium_mg":    {"direction": "lower",  "weight": 0.30},
    "potassium_mg": {"direction": "higher", "weight": 0.25},
    "calcium_mg":   {"direction": "higher", "weight": 0.20},
    "fiber_g":      {"direction": "higher", "weight": 0.15},
    "fat_total_g":  {"direction": "lower",  "weight": 0.10},
}


def backup_artifacts(version: str):
    """Backup artefak lama dengan suffix versi."""
    backup_dir = ARTIFACTS / f"backup_v{version}"
    backup_dir.mkdir(exist_ok=True)
    files = ["scaler.pkl", "item_matrix.npy", "food_ids.json", "metadata.json"]
    for f in files:
        src = ARTIFACTS / f
        if src.exists():
            shutil.copy2(src, backup_dir / f)
    print(f"  Backup ke {backup_dir}/")


def load_and_align_datasets() -> pd.DataFrame:
    # Load CSV utama. Bisa jadi sudah merged (re-run) atau belum.
    main = pd.read_csv(ARTIFACTS / "food_items_clean.csv")

    # Idempotent: deteksi apakah sudah merged
    has_estimated_dishes = (
        "is_estimated" in main.columns
        and bool(main["is_estimated"].any())
    )

    if has_estimated_dishes:
        print(f"  Dataset sudah ter-merge sebelumnya: {len(main)} item")
        print(f"  TKPI primer: {(~main['is_estimated']).sum()}")
        print(f"  Masakan estimasi: {main['is_estimated'].sum()}")
        return main

    print(f"  TKPI: {len(main)} item, kolom: {len(main.columns)}")

    # Load masakan tradisional
    dishes = pd.read_csv(ARTIFACTS / "traditional_dishes.csv")
    print(f"  Masakan: {len(dishes)} item, kolom: {len(dishes.columns)}")

    # Align skema: tambahkan kolom yang ada di main tapi tidak di dishes,
    # set ke 0.0 (akan diabaikan model karena bukan fitur DASH)
    for col in main.columns:
        if col not in dishes.columns:
            if main[col].dtype in [np.float64, np.int64]:
                dishes[col] = 0.0
            else:
                dishes[col] = ""

    # Sebaliknya: pastikan kolom unik dishes (region, meal_type, is_estimated)
    # tidak hilang
    for col in dishes.columns:
        if col not in main.columns:
            if dishes[col].dtype == bool:
                main[col] = False
            elif dishes[col].dtype in [np.float64, np.int64]:
                main[col] = 0.0
            else:
                main[col] = ""

    # Tandai TKPI sebagai bukan estimasi (data primer)
    if "is_estimated" in main.columns:
        main["is_estimated"] = False
    if "region" in main.columns:
        # TKPI tidak punya region, set "Indonesia" sebagai default
        main.loc[main["region"] == "", "region"] = "Indonesia"

    # Reorder kolom dishes agar sama persis dengan main
    dishes = dishes[main.columns]

    # Concat
    merged = pd.concat([main, dishes], ignore_index=True)
    print(f"  Merged: {len(merged)} item")

    # Validasi: tidak boleh ada NaN di fitur DASH
    for feat in DASH_FEATURES:
        nan_count = merged[feat].isna().sum()
        if nan_count > 0:
            print(f"  WARNING: {nan_count} NaN di {feat}, fill dengan 0")
            merged[feat] = merged[feat].fillna(0)

    return merged


def retrain_model(merged: pd.DataFrame) -> tuple[StandardScaler, np.ndarray, list]:
    """Latih ulang StandardScaler dan bangun item_matrix."""
    np.random.seed(42)

    # Ekstrak fitur DASH
    features = merged[DASH_FEATURES].values.astype(np.float64)
    print(f"  Feature matrix: {features.shape}")

    # Fit scaler
    scaler = StandardScaler()
    scaler.fit(features)
    item_matrix = scaler.transform(features)
    print(f"  Scaler: mean={scaler.mean_[:3]}, scale={scaler.scale_[:3]}")
    print(f"  Item matrix: {item_matrix.shape}")

    # food_ids
    food_ids = merged["food_code"].tolist()
    print(f"  Food IDs: {len(food_ids)} (unique: {len(set(food_ids))})")

    if len(food_ids) != len(set(food_ids)):
        # Cari duplikat
        from collections import Counter
        dupes = [code for code, count in Counter(food_ids).items() if count > 1]
        raise ValueError(f"Duplicate food_code found: {dupes[:5]}")

    return scaler, item_matrix, food_ids


def save_artifacts(scaler, item_matrix, food_ids, merged):
    # Save artifacts ke disk
    joblib.dump(scaler, ARTIFACTS / "scaler.pkl")
    np.save(ARTIFACTS / "item_matrix.npy", item_matrix)

    with open(ARTIFACTS / "food_ids.json", "w", encoding="utf-8") as f:
        json.dump(food_ids, f, ensure_ascii=False, indent=2)

    metadata = {
        "version": "1.1.0",
        "trained_at": pd.Timestamp.utcnow().isoformat(),
        "random_state": 42,
        "n_items": len(food_ids),
        "n_features": len(DASH_FEATURES),
        "features": DASH_FEATURES,
        "nutrient_weights": NUTRIENT_WEIGHTS,
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "datasets": {
            "TKPI_2017": {"n_items": int((~merged["is_estimated"]).sum()) if "is_estimated" in merged.columns else int(len(merged) - 30)},
            "Traditional_Dishes_v1": {"n_items": int(merged["is_estimated"].sum()) if "is_estimated" in merged.columns else 30},
        },
        "categories_included": sorted(merged["category"].unique().tolist()),
        "regions_included": sorted(merged["region"].unique().tolist()) if "region" in merged.columns else [],
        "min_features_required": 3,
        "imputation_method": "zero_for_missing",
        "changelog": [
            "v1.0.0: Initial training with TKPI 2017 (792 items)",
            "v1.1.0: Added 30 traditional Indonesian dishes with estimated DASH nutrition",
        ],
    }

    with open(ARTIFACTS / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"  Saved: scaler.pkl, item_matrix.npy, food_ids.json, metadata.json")


def regenerate_dash_scores(merged: pd.DataFrame) -> pd.DataFrame:
    """Regenerasi kolom dash_score dan dash_category sesuai formula terbaru."""
    from services.dash_score_service import calculate_dash_score, get_dash_category
    from services.nutrition_calculator import calculate_personal_targets

    targets = calculate_personal_targets("laki-laki", 70, 170, 35, [])

    def score(row):
        return calculate_dash_score(
            {f: row[f] for f in DASH_FEATURES}, targets
        )

    merged["dash_score"] = merged.apply(score, axis=1)
    merged["dash_category"] = merged["dash_score"].apply(get_dash_category)
    return merged


def main():
    print("=" * 80)
    print("MERGE & RETRAIN — TensiMenu Model v1.1.0")
    print("=" * 80)

    print("\n[1/5] Backup artefak v1.0.0...")
    backup_artifacts("1.0.0")

    print("\n[2/5] Load & align datasets...")
    merged = load_and_align_datasets()

    print("\n[3/5] Regenerate DASH scores untuk seluruh dataset gabungan...")
    merged = regenerate_dash_scores(merged)
    print(f"  Distribusi DASH:")
    for cat, count in merged["dash_category"].value_counts().items():
        print(f"    {cat:20s}: {count}")

    print("\n[4/5] Retrain StandardScaler & build item_matrix...")
    scaler, item_matrix, food_ids = retrain_model(merged)

    print("\n[5/5] Save artifacts & merged dataset...")
    # Save merged CSV (overwrite food_items_clean.csv)
    merged.to_csv(ARTIFACTS / "food_items_clean.csv", index=False)
    print(f"  Saved: food_items_clean.csv ({len(merged)} items)")

    save_artifacts(scaler, item_matrix, food_ids, merged)

    print("\n" + "=" * 80)
    print("VERIFIKASI")
    print("=" * 80)
    print(f"\nDataset gabungan:")
    print(f"  Total: {len(merged)}")
    if "is_estimated" in merged.columns:
        print(f"  TKPI (data primer): {(~merged['is_estimated']).sum()}")
        print(f"  Masakan jadi (estimasi): {merged['is_estimated'].sum()}")
    print(f"\n  Kategori: {merged['category'].nunique()}")
    if "region" in merged.columns:
        print(f"  Region: {merged['region'].nunique()}")
    print(f"\n  DASH score range: {merged['dash_score'].min():.1f} - {merged['dash_score'].max():.1f}")
    print(f"  Mean DASH: {merged['dash_score'].mean():.2f}")

    print(f"\n  Top 5 DASH score:")
    top5 = merged.nlargest(5, "dash_score")[["food_code", "name", "dash_score"]]
    for _, row in top5.iterrows():
        print(f"    {row['food_code']:10s} | {row['dash_score']:5.1f} | {row['name']}")

    print(f"\n[OK] Model v1.1.0 siap dipakai")


if __name__ == "__main__":
    main()
