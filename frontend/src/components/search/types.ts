/**
 * Types untuk fitur Global Food Search.
 */

export interface FoodSearchResult {
  food_code: string;
  name: string;
  category: string;
  region?: string | null;
  image_url?: string | null;
  energy_kcal: number;
  sodium_mg: number;
  potassium_mg: number;
  fiber_g: number;
  fat_total_g: number;
  dash_score: number | null;
  dash_category?: string | null;
  is_estimated?: boolean;
}

export interface SearchResponse {
  query: string;
  count: number;
  items: FoodSearchResult[];
}

export type SearchStatus = "idle" | "loading" | "success" | "error" | "empty";
