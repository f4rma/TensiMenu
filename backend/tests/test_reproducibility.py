"""
Layer 1: Reproducibility tests
Memvalidasi Req. 8.3 — Model harus deterministik.
"""

import numpy as np
import pytest

from ml.content_based_filter import recommend


class TestReproducibility:
    """Model harus menghasilkan output identik untuk input identik."""

    def test_artifacts_konsisten_dengan_metadata(self, artifacts):
        """Artefak yang dimuat harus konsisten dengan metadata.json."""
        assert artifacts.item_matrix.shape[0] == artifacts.metadata["n_items"]
        assert artifacts.item_matrix.shape[1] == artifacts.metadata["n_features"]
        assert artifacts.metadata["random_state"] == 42
        assert len(artifacts.food_ids) == artifacts.item_matrix.shape[0]

    def test_recommend_deterministic_dua_panggilan(
        self, artifacts, food_df, base_targets
    ):
        # Dua panggilan recommend() berurutan dengan input identik harus mengembalikan urutan dan skor yang identik.
        result1 = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=20,
        )
        result2 = recommend(
            user_targets=base_targets,
            food_df=food_df,
            artifacts=artifacts,
            top_k=20,
        )

        assert list(result1["food_code"]) == list(result2["food_code"]), (
            "Urutan rekomendasi tidak konsisten antar panggilan"
        )
        np.testing.assert_array_almost_equal(
            result1["similarity"].values,
            result2["similarity"].values,
            decimal=10,
        )

    def test_scaler_transform_deterministic(self, artifacts):
        """StandardScaler harus mengembalikan hasil identik untuk input identik."""
        sample = np.array([[100.0, 200.0, 50.0, 5.0, 10.0]])
        out1 = artifacts.scaler.transform(sample)
        out2 = artifacts.scaler.transform(sample)
        np.testing.assert_array_equal(out1, out2)

    def test_recommend_dengan_seed_berbeda_tetap_sama(
        self, artifacts, food_df, base_targets
    ):
        """Cosine similarity tidak bergantung pada random seed runtime."""
        np.random.seed(0)
        r1 = recommend(base_targets, food_df, artifacts, top_k=10)

        np.random.seed(999)
        r2 = recommend(base_targets, food_df, artifacts, top_k=10)

        assert list(r1["food_code"]) == list(r2["food_code"])
