/**
 * Types untuk halaman Rekomendasi.
 * Match dengan response endpoint /api/v1/recommendations dari backend.
 */

export interface FoodRecommendation {
  food_code: string;
  name: string;
  category: string;
  region?: string | null;
  description?: string | null;
  image_url?: string | null;

  // Nutrition per 100 gram (untuk display di kartu)
  energy_kcal: number;
  sodium_mg: number;
  potassium_mg: number;
  fiber_g: number;
  fat_total_g: number;
  phosphorus_mg?: number;

  // Porsi standar untuk kategori ini (gram per 1 sajian).
  // Frontend memakai ini saat membangun payload /confirm.
  default_serving_g?: number;

  // Computed
  dash_score: number;
  dash_category: string;

  // Tag untuk display (mis. "Rendah Garam", "Serat Tinggi", "Moderasi Garam")
  tags?: string[];

  // Apakah data nutrisi adalah estimasi (untuk masakan olahan)
  is_estimated?: boolean;
}

export interface NutritionProgress {
  current: number;
  target: number;
  unit: string;
}

export interface DailySummary {
  energy: NutritionProgress;
  sodium: NutritionProgress;
  potassium: NutritionProgress;
  fiber: NutritionProgress;
}
