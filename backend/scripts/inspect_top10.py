"""Inspeksi top 10 rekomendasi setelah model v1.1.0."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from ml.content_based_filter import recommend
from ml.model_loader import load_model_artifacts
from services.nutrition_calculator import calculate_personal_targets


def inspect_persona(name, **kwargs):
    artifacts = load_model_artifacts(BACKEND / "ml" / "artifacts")
    df = pd.read_csv(BACKEND / "ml" / "artifacts" / "food_items_clean.csv")
    targets = calculate_personal_targets(**kwargs)

    rec = recommend(
        targets, df, artifacts, top_k=10,
        comorbidities=kwargs.get("comorbidities", []),
    )

    # Hitung diversity
    code_to_idx = {f: i for i, f in enumerate(artifacts.food_ids)}
    indices = [code_to_idx[c] for c in rec["food_code"]]
    vectors = artifacts.item_matrix[indices]
    sim_matrix = cosine_similarity(vectors)
    n = len(vectors)
    upper = sim_matrix[np.triu_indices(n, k=1)]
    avg_dist = 1 - np.mean(upper)

    print(f"\n=== {name} ===")
    print(f"Diversity (avg cosine distance): {avg_dist:.3f}")
    print(f"Top 10:")
    rec_with_form = rec.merge(
        df[["food_code", "is_estimated", "region"]],
        on="food_code",
        how="left",
    )
    for i, row in rec_with_form.iterrows():
        marker = "[MASAKAN]" if row.get("is_estimated") else "[BAHAN]  "
        region = row.get("region", "-") or "-"
        print(
            f"  {i+1:2d}. {marker} {row['name']:40s} | "
            f"DASH={row['dash_score']:5.1f} | {region}"
        )

    return avg_dist


def main():
    inspect_persona(
        "Dewasa Sehat",
        gender="laki-laki", weight_kg=70, height_cm=170, age=30,
        comorbidities=[],
    )
    inspect_persona(
        "Hipertensi + CKD",
        gender="laki-laki", weight_kg=75, height_cm=168, age=65,
        comorbidities=["ckd"], systolic_bp=165,
    )
    inspect_persona(
        "Diabetes T2",
        gender="perempuan", weight_kg=70, height_cm=160, age=55,
        comorbidities=["diabetes_t2"], systolic_bp=135,
    )


if __name__ == "__main__":
    main()
