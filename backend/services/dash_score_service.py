"""
Kalkulasi DASH Compliance Score untuk TensiMenu.
Formula deterministik: input yang sama + profil yang sama = output yang sama.
"""

from ml.feature_engineering import NUTRIENT_WEIGHTS


def calculate_dash_score(nutrition_per_serving: dict, user_targets: dict) -> float:
    """
    Hitung DASH Score (0-100) untuk satu sajian makanan.

    Formula:
      - Nutrisi positif (potassium, calcium, fiber):
          contribution = min(aktual / target, 1.0)
      - Nutrisi negatif (sodium, fat_total):
          jika aktual <= target: contribution = 1.0
          jika aktual > target: contribution = max(0, 1 - (aktual - target) / target)
      - DASH_Score = rata-rata tertimbang × 100

    Args:
        nutrition_per_serving: dict nilai nutrisi per sajian
        user_targets: dict target nutrisi harian personal

    Returns:
        float DASH Score dalam rentang [0.0, 100.0]
    """
    total_score = 0.0

    for nutrient, config in NUTRIENT_WEIGHTS.items():
        actual = nutrition_per_serving.get(nutrient, 0.0)
        target = user_targets.get(nutrient, 1.0)
        weight = config["weight"]

        if target <= 0:
            contribution = 0.0
        elif config["direction"] == "higher":
            contribution = min(actual / target, 1.0)
        else:
            if actual <= target:
                contribution = 1.0
            else:
                contribution = max(0.0, 1.0 - (actual - target) / target)

        total_score += contribution * weight

    return round(total_score * 100, 1)


def calculate_daily_dash_score(
    food_items_with_portions: list[dict],
    user_targets: dict,
) -> float:
    """
    Hitung DASH Score agregat harian sebagai rata-rata tertimbang berdasarkan porsi (gram).

    DASH_Score_harian = Σ(DASH_Score_item × porsi_gram) / Σ(porsi_gram)

    Args:
        food_items_with_portions: list of {"nutrition": dict, "serving_g": float}
        user_targets: dict target nutrisi harian personal

    Returns:
        float DASH Score harian dalam rentang [0.0, 100.0]
    """
    if not food_items_with_portions:
        return 0.0

    total_weighted = sum(
        calculate_dash_score(item["nutrition"], user_targets) * item["serving_g"]
        for item in food_items_with_portions
    )
    total_portions = sum(item["serving_g"] for item in food_items_with_portions)

    if total_portions <= 0:
        return 0.0

    return round(total_weighted / total_portions, 1)


def get_dash_category(score: float) -> str:
    """
    Klasifikasi DASH Score ke label kategori.

    Returns:
        "Sangat Baik" (80-100), "Baik" (60-79), "Cukup" (40-59), "Perlu Perhatian" (0-39)
    """
    if score >= 80:
        return "Sangat Baik"
    elif score >= 60:
        return "Baik"
    elif score >= 40:
        return "Cukup"
    else:
        return "Perlu Perhatian"


def get_improvement_tips(
    daily_score: float,
    actual_nutrients: dict,
    user_targets: dict,
    food_df=None,
) -> list[dict]:
    """
    Identifikasi 3 nutrisi terjauh dari target dan saran makanan lokal.
    Hanya dipanggil jika DASH Score harian < 40.

    Returns:
        list of dict: [{"nutrient", "label", "actual", "target", "gap", "suggested_foods"}]
    """
    if daily_score >= 40:
        return []

    from ml.feature_engineering import DASH_FEATURES, NUTRIENT_WEIGHTS

    NUTRIENT_LABELS = {
        "sodium_mg": "Natrium",
        "potassium_mg": "Kalium",
        "calcium_mg": "Kalsium",
        "fiber_g": "Serat",
        "fat_total_g": "Lemak Total",
    }

    gaps = []
    for nutrient in DASH_FEATURES:
        actual = actual_nutrients.get(nutrient, 0.0)
        target = user_targets.get(nutrient, 1.0)
        config = NUTRIENT_WEIGHTS[nutrient]

        if config["direction"] == "higher":
            gap = max(0.0, target - actual)
        else:
            gap = max(0.0, actual - target)

        gaps.append({"nutrient": nutrient, "gap": gap, "actual": actual, "target": target})

    # Urutkan berdasarkan gap terbesar, ambil 3 teratas
    gaps.sort(key=lambda x: x["gap"], reverse=True)
    top3 = gaps[:3]

    tips = []
    for g in top3:
        nutrient = g["nutrient"]
        config = NUTRIENT_WEIGHTS[nutrient]

        # Saran makanan berdasarkan nutrisi yang kurang
        suggested: list[str] = []
        if food_df is not None and not food_df.empty and config["direction"] == "higher":
            top_foods = food_df.nlargest(3, nutrient)["name"].tolist()
            suggested = top_foods
        elif food_df is not None and not food_df.empty and config["direction"] == "lower":
            low_foods = food_df.nsmallest(3, nutrient)["name"].tolist()
            suggested = low_foods

        tips.append({
            "nutrient": nutrient,
            "nutrient_label": NUTRIENT_LABELS.get(nutrient, nutrient),
            "actual_value": g["actual"],
            "target_value": g["target"],
            "gap": round(g["gap"], 1),
            "suggested_foods": suggested,
        })

    return tips
