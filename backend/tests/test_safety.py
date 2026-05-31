"""
Layer 2: Safety constraints — HARUS 100% LULUS
Memvalidasi rekomendasi tidak melanggar batasan medis.

Mapped to Req. 3.3, 3.4, 3.5, 3.6 — batasan komorbid dan DASH.
"""

import pytest

from ml.content_based_filter import recommend
from services.nutrition_calculator import calculate_personal_targets


class TestSafetyCKD:
    # Pasien dengan Chronic Kidney Disease (CKD) tidak boleh mendapat rekomendasi tinggi kalium atau fosfor.

    def test_ckd_tidak_pernah_rekomendasikan_kalium_tinggi(
        self, artifacts, food_df
    ):
        """Untuk user CKD, semua rekomendasi harus punya kalium ≤ 2000 mg/100g."""
        targets = calculate_personal_targets(
            gender="laki-laki",
            weight_kg=65,
            height_cm=165,
            age=58,
            comorbidities=["ckd"],
        )

        result = recommend(
            user_targets=targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=50,
            comorbidities=["ckd"],
        )

        # Join kembali dengan dataset untuk dapat nilai potassium
        merged = result.merge(
            food_df[["food_code", "potassium_mg", "phosphorus_mg"]],
            on="food_code",
            how="left",
        )

        violations = merged[merged["potassium_mg"] > 2000]
        assert len(violations) == 0, (
            f"CKD violation: {len(violations)} item dengan kalium > 2000 mg "
            f"direkomendasikan. Nama: {violations['name'].tolist()[:5]}"
        )

    def test_ckd_tidak_pernah_rekomendasikan_fosfor_tinggi(
        self, artifacts, food_df
    ):
        """Untuk user CKD, semua rekomendasi harus punya fosfor ≤ 800 mg/100g."""
        targets = calculate_personal_targets(
            gender="perempuan",
            weight_kg=55,
            height_cm=160,
            age=62,
            comorbidities=["ckd"],
        )

        result = recommend(
            user_targets=targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=50,
            comorbidities=["ckd"],
        )

        merged = result.merge(
            food_df[["food_code", "phosphorus_mg"]],
            on="food_code",
            how="left",
        )
        violations = merged[merged["phosphorus_mg"] > 800]
        assert len(violations) == 0, (
            f"CKD violation: {len(violations)} item dengan fosfor > 800 mg"
        )


class TestAntiRepetisi:
    # Aturan anti-repetisi (Req. 3.11): item yang dikonsumsi 3 hari terakhir tidak boleh muncul, kecuali kandidat < 4.

    def test_exclude_ids_dihormati(self, artifacts, food_df, base_targets):
        """Item di exclude_ids tidak boleh muncul di rekomendasi."""
        sample_excluded = food_df["food_code"].head(20).tolist()

        result = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=30,
            exclude_ids=sample_excluded,
        )

        intersection = set(result["food_code"]) & set(sample_excluded)
        assert len(intersection) == 0, (
            f"Anti-repetisi violation: {intersection}"
        )

    def test_alternatives_eksklusi_item_asal(
        self, artifacts, food_df, base_targets
    ):
        """get_alternatives() tidak mengembalikan item asal."""
        from ml.content_based_filter import get_alternatives

        original_code = food_df["food_code"].iloc[0]
        alternatives = get_alternatives(
            food_code=original_code,
            food_df=food_df,
            artifacts=artifacts,
            user_targets=base_targets,
            top_k=5,
        )

        assert original_code not in alternatives["food_code"].tolist()


class TestKategoriFilter:
    """Filter kategori harus dihormati."""

    @pytest.mark.parametrize(
        "category",
        ["Sayuran", "Buah", "Ikan, Kerang & Udang", "Serealia"],
    )
    def test_filter_kategori_konsisten(
        self, artifacts, food_df, base_targets, category
    ):
        """Hasil rekomendasi dengan filter kategori hanya berisi kategori itu."""
        result = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=20,
            category_filter=category,
        )

        if not result.empty:
            unique_cats = result["category"].unique()
            assert len(unique_cats) == 1
            assert unique_cats[0] == category


class TestEdgeCases:
    """Edge case yang harus ditangani gracefully."""

    def test_top_k_lebih_besar_dari_dataset(
        self, artifacts, food_df, base_targets
    ):
        """top_k > N tidak crash, hanya kembalikan semua yang ada."""
        result = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=10000,
        )
        assert len(result) <= len(food_df)

    def test_filter_yang_kosong_tidak_crash(
        self, artifacts, food_df, base_targets
    ):
        """Filter yang menghasilkan 0 item harus return DataFrame kosong, bukan exception."""
        # Filter kategori yang tidak ada
        result = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=10,
            category_filter="KategoriTidakAda",
        )
        assert isinstance(result, type(food_df))
        assert result.empty

    def test_user_targets_tidak_lengkap_tidak_crash(
        self, artifacts, food_df
    ):
        """User vector dengan key yang kurang harus error informatif, bukan crash silent."""
        incomplete_targets = {"sodium_mg": 2000.0}  # missing keys
        with pytest.raises(KeyError):
            recommend(
                user_targets=incomplete_targets,
                food_df=food_df,
                artifacts=artifacts,
                top_k=5,
            )
