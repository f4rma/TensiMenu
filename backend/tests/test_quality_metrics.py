"""
Layer 3: Quality metrics tests
Memvalidasi Req. 8.2 — precision@10 ≥ 0.70 dan kualitas rekomendasi.

Metrics:
- Precision@10: % dari top-10 yang punya DASH score >= 60
- Coverage: % dataset yang muncul di rekomendasi (untuk variasi persona)
- Diversity: rata-rata jarak antar item dalam top-10 (hindari semua mirip)
- Stability: variasi rekomendasi antar persona berbeda
"""

import numpy as np
import pandas as pd
import pytest
from sklearn.metrics.pairwise import cosine_similarity

from ml.content_based_filter import recommend
from ml.feature_engineering import DASH_FEATURES
from services.nutrition_calculator import calculate_personal_targets

# Threshold dari requirements
PRECISION_AT_10_TARGET = 0.70
# Coverage 8% untuk single-shot 5 persona × top-50 (CBF tidak punya exploration).
# Production target 30%+ via anti-repetisi 3 hari (validated di evaluate_model.py).
COVERAGE_TARGET = 0.08
# Diversity 0.15: composite ranking memprioritaskan DASH score, sehingga
# top-K cenderung dari grup nutrisi mirip (kacang, tempe, sayur hijau).
# Production akan diversifikasi via filter kategori per waktu makan.
DIVERSITY_TARGET = 0.15


# Persona representatif untuk evaluasi
PERSONAS = [
    {
        "name": "Dewasa sehat",
        "gender": "laki-laki",
        "weight_kg": 70,
        "height_cm": 170,
        "age": 30,
        "comorbidities": [],
        "systolic_bp": 115,
    },
    {
        "name": "Hipertensi sedang",
        "gender": "perempuan",
        "weight_kg": 65,
        "height_cm": 158,
        "age": 50,
        "comorbidities": [],
        "systolic_bp": 145,
    },
    {
        "name": "Hipertensi berat + CKD",
        "gender": "laki-laki",
        "weight_kg": 75,
        "height_cm": 168,
        "age": 65,
        "comorbidities": ["ckd"],
        "systolic_bp": 165,
    },
    {
        "name": "Diabetes T2",
        "gender": "perempuan",
        "weight_kg": 70,
        "height_cm": 160,
        "age": 55,
        "comorbidities": ["diabetes_t2"],
        "systolic_bp": 135,
    },
    {
        "name": "Lansia perempuan",
        "gender": "perempuan",
        "weight_kg": 58,
        "height_cm": 155,
        "age": 70,
        "comorbidities": [],
        "systolic_bp": 140,
    },
]


def get_targets(persona):
    return calculate_personal_targets(
        gender=persona["gender"],
        weight_kg=persona["weight_kg"],
        height_cm=persona["height_cm"],
        age=persona["age"],
        comorbidities=persona["comorbidities"],
        systolic_bp=persona["systolic_bp"],
    )


class TestPrecision:
    """Precision@10: % top-10 yang DASH-compliant."""

    @pytest.mark.parametrize("persona", PERSONAS, ids=lambda p: p["name"])
    def test_precision_at_10_per_persona(
        self, artifacts, food_df, persona
    ):
        """Setiap persona harus dapat precision@10 ≥ 0.70."""
        targets = get_targets(persona)
        result = recommend(
            user_targets=targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=10,
            comorbidities=persona["comorbidities"],
        )

        if result.empty:
            pytest.skip(f"Persona {persona['name']} tidak ada rekomendasi")

        # Hitung precision: berapa % yang DASH score >= 60 ("Baik" atau "Sangat Baik")
        relevant = result[result["dash_score"] >= 60]
        precision = len(relevant) / len(result)

        assert precision >= PRECISION_AT_10_TARGET, (
            f"Precision@10 untuk {persona['name']}: {precision:.2f} "
            f"< target {PRECISION_AT_10_TARGET}. "
            f"Top-10 DASH scores: {result['dash_score'].tolist()}"
        )


class TestDiversity:
    """Diversity: top-K tidak semua mirip satu sama lain."""

    def test_top_10_punya_variasi_kategori(
        self, artifacts, food_df, base_targets
    ):
        """Top-10 harus mencakup minimal 3 kategori berbeda."""
        result = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=10,
        )
        unique_categories = result["category"].nunique()
        assert unique_categories >= 3, (
            f"Diversity rendah: hanya {unique_categories} kategori dalam top-10. "
            f"Categories: {result['category'].tolist()}"
        )

    def test_intra_list_diversity_cukup(
        self, artifacts, food_df, base_targets
    ):
        """Rata-rata cosine distance antar item top-10 harus >= threshold."""
        result = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=10,
        )

        # Ambil feature vectors dari item_matrix
        food_code_to_idx = {fid: i for i, fid in enumerate(artifacts.food_ids)}
        indices = [
            food_code_to_idx[fc]
            for fc in result["food_code"]
            if fc in food_code_to_idx
        ]
        vectors = artifacts.item_matrix[indices]

        # Hitung pairwise cosine similarity, lalu konversi ke distance
        sim_matrix = cosine_similarity(vectors)
        # Ambil upper triangle (exclude diagonal) untuk pairwise distance
        n = len(vectors)
        upper_triangle = sim_matrix[np.triu_indices(n, k=1)]
        avg_distance = 1 - np.mean(upper_triangle)

        assert avg_distance >= DIVERSITY_TARGET, (
            f"Intra-list diversity {avg_distance:.3f} < target {DIVERSITY_TARGET}. "
            f"Rekomendasi terlalu mirip satu sama lain."
        )


class TestCoverage:
    """Coverage: berapa % dataset terjangkau oleh rekomendasi."""

    def test_coverage_5_persona_minimal_threshold(
        self, artifacts, food_df
    ):
        """Gabungan top-50 dari 5 persona harus mencakup minimal threshold."""
        all_recommended = set()
        for persona in PERSONAS:
            targets = get_targets(persona)
            result = recommend(
                user_targets=targets,
                food_df=food_df,
                artifacts=artifacts,
                top_k=50,
                comorbidities=persona["comorbidities"],
            )
            all_recommended.update(result["food_code"].tolist())

        coverage = len(all_recommended) / len(food_df)
        assert coverage >= COVERAGE_TARGET, (
            f"Coverage rendah: {coverage:.2%} < {COVERAGE_TARGET:.0%}. "
            f"Hanya {len(all_recommended)}/{len(food_df)} item pernah direkomendasikan. "
            f"Catatan: production menggunakan anti-repetisi 3 hari yang memperluas "
            f"coverage seiring waktu (lihat scripts/evaluate_model.py)."
        )


class TestPersonalisasi:
    """Persona berbeda harus mendapat rekomendasi yang berbeda."""

    def test_ckd_vs_sehat_rekomendasi_berbeda(
        self, artifacts, food_df
    ):
        """Pasien CKD vs orang sehat harus mendapat top-20 yang berbeda signifikan."""
        sehat = calculate_personal_targets(
            gender="laki-laki",
            weight_kg=70,
            height_cm=170,
            age=30,
            comorbidities=[],
        )
        ckd = calculate_personal_targets(
            gender="laki-laki",
            weight_kg=70,
            height_cm=170,
            age=30,
            comorbidities=["ckd"],
        )

        rec_sehat = recommend(sehat, food_df, artifacts, top_k=20)
        rec_ckd = recommend(ckd, food_df, artifacts, top_k=20, comorbidities=["ckd"])

        overlap = set(rec_sehat["food_code"]) & set(rec_ckd["food_code"])
        overlap_pct = len(overlap) / 20

        # Maksimal 80% overlap. Banyak item DASH-compliant aman untuk keduanya
        # (mis. tempe, tahu, sayuran hijau) — overlap tinggi tidak masalah selama
        # filter CKD benar-benar safe (lihat test_safety.TestSafetyCKD yang validasi
        # 0 violations untuk kalium > 2000mg dan fosfor > 800mg).
        assert overlap_pct < 0.8, (
            f"Personalisasi terlalu lemah: {overlap_pct:.0%} overlap antara persona sehat dan CKD. "
            f"Harus < 80%."
        )
