"""
Layer 4: Property-based tests dengan Hypothesis
Generate ribuan input acak untuk memvalidasi properti universal.

Mapped to Properti 10, 11, 12, 13 dari requirements.
"""

import pytest
from hypothesis import given, settings, strategies as st

from services.dash_score_service import (
    calculate_daily_dash_score,
    calculate_dash_score,
    get_dash_category,
)
from services.nutrition_calculator import calculate_personal_targets


# Strategi untuk generate target nutrisi yang valid
valid_targets_strategy = st.fixed_dictionaries({
    "sodium_mg": st.floats(min_value=500, max_value=3000),
    "potassium_mg": st.floats(min_value=1500, max_value=5000),
    "calcium_mg": st.floats(min_value=500, max_value=1500),
    "fiber_g": st.floats(min_value=15, max_value=50),
    "fat_total_g": st.floats(min_value=20, max_value=100),
})

# Strategi untuk generate nutrisi makanan yang valid
valid_nutrition_strategy = st.fixed_dictionaries({
    "sodium_mg": st.floats(min_value=0, max_value=5000),
    "potassium_mg": st.floats(min_value=0, max_value=3000),
    "calcium_mg": st.floats(min_value=0, max_value=2000),
    "fiber_g": st.floats(min_value=0, max_value=30),
    "fat_total_g": st.floats(min_value=0, max_value=50),
})


class TestDashScoreProperties:
    # Property 10: DASH Score selalu dalam rentang [0, 100]
    # Property 11: DASH Score deterministik
    # Property 12: Kategori DASH selalu cocok dengan rentang skor

    @given(nutrition=valid_nutrition_strategy, targets=valid_targets_strategy)
    @settings(max_examples=500, deadline=None)
    def test_dash_score_selalu_dalam_rentang_0_100(self, nutrition, targets):
        """Property 10: DASH Score harus selalu antara 0 dan 100."""
        score = calculate_dash_score(nutrition, targets)
        assert 0.0 <= score <= 100.0, f"Score {score} di luar rentang"

    @given(nutrition=valid_nutrition_strategy, targets=valid_targets_strategy)
    @settings(max_examples=200, deadline=None)
    def test_dash_score_deterministik(self, nutrition, targets):
        """Property 11: Input identik selalu menghasilkan output identik."""
        score1 = calculate_dash_score(nutrition, targets)
        score2 = calculate_dash_score(nutrition, targets)
        assert score1 == score2

    @given(score=st.floats(min_value=0, max_value=100))
    @settings(max_examples=200, deadline=None)
    def test_kategori_konsisten_dengan_skor(self, score):
        """Property 12: Label kategori sesuai rentang skor."""
        category = get_dash_category(score)
        if score >= 80:
            assert category == "Sangat Baik"
        elif score >= 60:
            assert category == "Baik"
        elif score >= 40:
            assert category == "Cukup"
        else:
            assert category == "Perlu Perhatian"

    def test_dash_score_makanan_ideal_tinggi(self):
        # Sanity check: makanan ideal (tinggi K/Ca/serat, rendah Na/lemak) skornya tinggi.
        ideal = {
            "sodium_mg": 50,       # rendah
            "potassium_mg": 4000,  # tinggi
            "calcium_mg": 1000,
            "fiber_g": 30,
            "fat_total_g": 5,
        }
        targets = {
            "sodium_mg": 2300,
            "potassium_mg": 4000,
            "calcium_mg": 1000,
            "fiber_g": 25,
            "fat_total_g": 60,
        }
        score = calculate_dash_score(ideal, targets)
        assert score >= 80

    def test_dash_score_makanan_buruk_rendah(self):
        """Sanity check: makanan tinggi natrium dan lemak skornya rendah."""
        bad = {
            "sodium_mg": 5000,     # 2x batas
            "potassium_mg": 100,   # rendah
            "calcium_mg": 50,
            "fiber_g": 0,
            "fat_total_g": 100,    # tinggi
        }
        targets = {
            "sodium_mg": 2300,
            "potassium_mg": 4000,
            "calcium_mg": 1000,
            "fiber_g": 25,
            "fat_total_g": 60,
        }
        score = calculate_dash_score(bad, targets)
        assert score < 40


class TestDailyDashProperties:
    # Property 13: DASH Score harian = rata-rata tertimbang yang valid

    def test_daily_score_kosong_return_zero(self):
        targets = {"sodium_mg": 2300, "potassium_mg": 4000, "calcium_mg": 1000, "fiber_g": 25, "fat_total_g": 60}
        assert calculate_daily_dash_score([], targets) == 0.0

    def test_daily_score_dalam_rentang_skor_individu(self):
        """Daily score harus berada di antara min dan max skor individual."""
        targets = {"sodium_mg": 2300, "potassium_mg": 4000, "calcium_mg": 1000, "fiber_g": 25, "fat_total_g": 60}

        items = [
            {"nutrition": {"sodium_mg": 100, "potassium_mg": 500, "calcium_mg": 100, "fiber_g": 5, "fat_total_g": 5}, "serving_g": 200},
            {"nutrition": {"sodium_mg": 800, "potassium_mg": 200, "calcium_mg": 50, "fiber_g": 1, "fat_total_g": 30}, "serving_g": 150},
        ]
        individual_scores = [calculate_dash_score(it["nutrition"], targets) for it in items]
        daily = calculate_daily_dash_score(items, targets)

        assert min(individual_scores) <= daily <= max(individual_scores)


class TestNutritionTargetProperties:
    # Property: Target nutrisi personal harus konsisten dengan rumus Mifflin-St Jeor
    # dan menyesuaikan dengan komorbid.

    @given(
        gender=st.sampled_from(["laki-laki", "perempuan"]),
        weight_kg=st.floats(min_value=40, max_value=150),
        height_cm=st.floats(min_value=140, max_value=200),
        age=st.integers(min_value=18, max_value=90),
    )
    @settings(max_examples=200, deadline=None)
    def test_target_selalu_positif(self, gender, weight_kg, height_cm, age):
        """Semua target nutrisi harus positif untuk profil valid."""
        targets = calculate_personal_targets(
            gender=gender,
            weight_kg=weight_kg,
            height_cm=height_cm,
            age=age,
            comorbidities=[],
        )
        for key, value in targets.items():
            assert value > 0, f"Target {key}={value} tidak positif"

    def test_ckd_menurunkan_natrium_dan_kalium(self):
        """Komorbid CKD harus menurunkan target natrium dan kalium dari baseline."""
        baseline = calculate_personal_targets("laki-laki", 70, 170, 50, [])
        ckd = calculate_personal_targets("laki-laki", 70, 170, 50, ["ckd"])

        assert ckd["sodium_mg"] < baseline["sodium_mg"]
        assert ckd["potassium_mg"] < baseline["potassium_mg"]
        assert ckd["phosphorus_mg"] < baseline["phosphorus_mg"]

    def test_hipertensi_berat_menurunkan_natrium(self):
        """Sistolik >= 140 (Stage 2) harus menurunkan target natrium ke 1500 mg."""
        normal = calculate_personal_targets("laki-laki", 70, 170, 50, [], systolic_bp=120)
        severe = calculate_personal_targets("laki-laki", 70, 170, 50, [], systolic_bp=160)

        assert severe["sodium_mg"] == 1500.0
        assert normal["sodium_mg"] == 2300.0

    def test_perempuan_target_serat_25g(self):
        """Target serat perempuan = 25g, laki-laki = 38g."""
        f = calculate_personal_targets("perempuan", 60, 160, 30, [])
        m = calculate_personal_targets("laki-laki", 70, 170, 30, [])
        assert f["fiber_g"] == 25.0
        assert m["fiber_g"] == 38.0
