"""
Content-Based Filtering untuk rekomendasi makanan DASH TensiMenu.
Menggunakan cosine similarity antara vektor kebutuhan nutrisi pengguna
dan vektor profil nutrisi setiap item makanan.
"""

import logging
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from ml.feature_engineering import DASH_FEATURES, build_user_nutrition_vector
from ml.dietary_filter import apply_dietary_restrictions
from ml.model_loader import ModelArtifacts

logger = logging.getLogger(__name__)


def recommend(
    user_targets: dict,
    food_df: pd.DataFrame,
    artifacts: ModelArtifacts,
    top_k: int = 10,
    category_filter: Optional[str] = None,
    exclude_ids: Optional[list[str]] = None,
    comorbidities: Optional[list[str]] = None,
    food_restrictions: Optional[list[str]] = None,
    similarity_weight: float = 0.4,
    dash_weight: float = 0.6,
) -> pd.DataFrame:
    """
    Hasilkan rekomendasi makanan berdasarkan composite ranking
    (cosine similarity + DASH score).

    Pipeline:
    1. Bangun user nutrition vector dari target personal
    2. Normalisasi dengan scaler yang sudah dilatih
    3. Hitung cosine similarity vs item_matrix
    4. Terapkan filter komorbid (SEBELUM ranking)
    5. Terapkan filter kategori dan anti-repetisi
    6. Hitung composite score = (similarity_weight × similarity_norm) +
       (dash_weight × dash_score_norm)
    7. Kembalikan top_k item

    Args:
        user_targets: dict dari calculate_personal_targets()
        food_df: DataFrame makanan bersih (food_items_clean.csv)
        artifacts: ModelArtifacts dari model_loader
        top_k: jumlah rekomendasi yang dikembalikan
        category_filter: filter kategori TKPI (misal 'Sayuran')
        exclude_ids: food_code yang dikecualikan (anti-repetisi 3 hari)
        comorbidities: list komorbid pengguna untuk filter keamanan
        food_restrictions: list pantangan/preferensi (vegan, alergi, dll)
        similarity_weight: bobot similarity (default 0.4)
        dash_weight: bobot DASH score (default 0.6)

    Returns:
        DataFrame dengan kolom: food_code, name, category, similarity,
        dash_score, composite_score
    """
    if comorbidities is None:
        comorbidities = []

    # --- Filter komorbid SEBELUM cosine similarity ---
    df = food_df.copy()

    if "ckd" in comorbidities:
        # CKD: batasi kalium < 2000 mg dan fosfor < 800 mg per 100g
        if "potassium_mg" in df.columns:
            df = df[df["potassium_mg"] <= 2000]
        if "phosphorus_mg" in df.columns:
            df = df[df["phosphorus_mg"] <= 800]

    if "diabetes_t2" in comorbidities:
        # Diabetes T2: prioritaskan GI rendah (< 55), tapi jangan hapus yang tidak ada GI
        if "glycemic_index" in df.columns:
            df = df[(df["glycemic_index"].isna()) | (df["glycemic_index"] < 55)]

    # --- Filter pantangan & preferensi makanan (vegan, alergi, dll) ---
    df = apply_dietary_restrictions(df, food_restrictions)

    # Filter kategori
    if category_filter and "category" in df.columns:
        df = df[df["category"] == category_filter]

    # Anti-repetisi: exclude makanan 3 hari terakhir
    if exclude_ids:
        df = df[~df["food_code"].isin(exclude_ids)]

    if df.empty:
        logger.warning("Tidak ada item yang memenuhi filter. Mengembalikan DataFrame kosong.")
        return pd.DataFrame(columns=["food_code", "name", "category", "similarity", "dash_score"])

    # --- Cosine similarity ---
    # Mapping food_code → index di artifacts.item_matrix.
    food_code_to_idx = {fid: i for i, fid in enumerate(artifacts.food_ids)}

    # Pertahankan HANYA baris yang food_code-nya ada di artifacts, lalu reset
    # index. Kritis: valid_indices dibangun dari df yang SUDAH difilter ini,
    # sehagga urutan similarities dijamin sejajar dengan baris df.
    df = df[df["food_code"].isin(food_code_to_idx)].copy().reset_index(drop=True)

    if df.empty:
        logger.warning("Tidak ada food_code yang cocok dengan artefak model.")
        return pd.DataFrame(columns=["food_code", "name", "category", "similarity", "dash_score"])

    valid_indices = [food_code_to_idx[fc] for fc in df["food_code"].tolist()]
    item_matrix_filtered = artifacts.item_matrix[valid_indices]

    # Transform user vector
    user_vec = build_user_nutrition_vector(user_targets)
    user_vec_scaled = artifacts.scaler.transform(user_vec.reshape(1, -1))

    # Hitung similarity — urutan sejajar dengan df karena valid_indices
    # dibangun dari df yang sama.
    similarities = cosine_similarity(user_vec_scaled, item_matrix_filtered)[0]
    df["similarity"] = similarities

    # Composite ranking: gabung similarity + DASH score (jika tersedia)
    # Normalisasi keduanya ke [0, 1]
    if "dash_score" in df.columns:
        sim_min, sim_max = df["similarity"].min(), df["similarity"].max()
        sim_range = sim_max - sim_min if sim_max > sim_min else 1.0
        df["sim_norm"] = (df["similarity"] - sim_min) / sim_range
        df["dash_norm"] = df["dash_score"] / 100.0

        df["composite_score"] = (
            similarity_weight * df["sim_norm"]
            + dash_weight * df["dash_norm"]
        )
        df = df.sort_values("composite_score", ascending=False).head(top_k)
        df = df.drop(columns=["sim_norm", "dash_norm"])
    else:
        df = df.sort_values("similarity", ascending=False).head(top_k)

    cols = ["food_code", "name", "category", "similarity"]
    if "dash_score" in df.columns:
        cols.append("dash_score")
    if "dash_category" in df.columns:
        cols.append("dash_category")
    if "composite_score" in df.columns:
        cols.append("composite_score")

    return df[cols].reset_index(drop=True)


def get_alternatives(
    food_code: str,
    food_df: pd.DataFrame,
    artifacts: ModelArtifacts,
    user_targets: dict,
    top_k: int = 5,
    comorbidities: Optional[list[str]] = None,
    food_restrictions: Optional[list[str]] = None,
) -> pd.DataFrame:
    """
    Dapatkan alternatif untuk satu item makanan.
    Mencari item dengan kategori sama dan similarity tertinggi,
    mengecualikan item itu sendiri.

    Returns:
        DataFrame minimal 3 alternatif
    """
    # Ambil kategori item yang ditolak
    item_row = food_df[food_df["food_code"] == food_code]
    if item_row.empty:
        category = None
    else:
        category = item_row.iloc[0].get("category")

    return recommend(
        user_targets=user_targets,
        food_df=food_df,
        artifacts=artifacts,
        top_k=max(top_k, 3),
        category_filter=category,
        exclude_ids=[food_code],
        comorbidities=comorbidities,
        food_restrictions=food_restrictions,
    )
