/**
 * Replikasi formula nutrition_calculator.py untuk preview di frontend.
 * Hasil ini sama persis dengan yang dihitung backend saat submit.
 */

import type { DailyTargets, ProfileFormData } from "./types";

export function calculatePersonalTargets(
  data: ProfileFormData
): DailyTargets | null {
  if (
    !data.gender ||
    !data.weight_kg ||
    !data.height_cm ||
    !data.age ||
    typeof data.weight_kg !== "number" ||
    typeof data.height_cm !== "number" ||
    typeof data.age !== "number"
  ) {
    return null;
  }

  // BMR (Mifflin-St Jeor)
  const bmr =
    data.gender === "laki-laki"
      ? 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age + 5
      : 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age - 161;

  const hasCKD = data.comorbidities.includes("ckd");
  const isAgeOver50 = data.age > 50;
  const systolicNum = typeof data.systolic_bp === "number" ? data.systolic_bp : null;

  // Targets DASH
  let sodium = 2300;
  let potassium = 4000;
  let phosphorus = 1250;

  if (hasCKD) {
    sodium = 1500;
    potassium = 2000;
    phosphorus = 800;
  }

  if (systolicNum !== null && systolicNum >= 150) {
    sodium = 1500;
  }

  return {
    sodium_mg: sodium,
    potassium_mg: potassium,
    calcium_mg: isAgeOver50 ? 1200 : 1000,
    fiber_g: data.gender === "laki-laki" ? 38 : 25,
    fat_total_g: Math.round((bmr * 0.27 / 9) * 10) / 10,
    energy_kcal: Math.round(bmr),
    phosphorus_mg: phosphorus,
  };
}
