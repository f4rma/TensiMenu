/**
 * TypeScript type definitions untuk TensiMenu
 * Mencakup semua model data yang digunakan di frontend
 */

// ─── Autentikasi ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

// ─── Profil Pengguna ──────────────────────────────────────────────────────────

export type Gender = "laki-laki" | "perempuan";

export type Comorbidity =
  | "diabetes_t2"
  | "ckd"
  | "dyslipidemia"
  | "obesity"
  | "tidak_ada";

export interface NutritionTargets {
  sodium_mg: number;
  potassium_mg: number;
  calcium_mg: number;
  magnesium_mg: number;
  fiber_g: number;
  fat_saturated_g: number;
  fat_total_g: number;
  energy_kcal: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  comorbidities: Comorbidity[];
  food_restrictions: string[];
  regional_prefs: string[];
  daily_targets?: NutritionTargets | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileCreate {
  full_name: string;
  age: number;
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  comorbidities: Comorbidity[];
  food_restrictions: string[];
  regional_prefs: string[];
}

export type UserProfileUpdate = Partial<UserProfileCreate>;

// ─── Item Makanan ─────────────────────────────────────────────────────────────

export type FoodCategory = "sarapan" | "makan_siang" | "makan_malam" | "camilan";

export type FoodRegion =
  | "Minang"
  | "Jawa"
  | "Sunda"
  | "Batak"
  | "Bugis"
  | "Papua"
  | "Nasional";

export type DataSource = "DKPI" | "USDA" | "Nutrisurvey" | "Estimasi";

export type ConfidenceLevel = "tinggi" | "sedang" | "rendah";

export interface FoodItem {
  id: string;
  name: string;
  region: FoodRegion;
  category: FoodCategory;
  serving_size_g: number;
  energy_kcal: number;
  protein_g: number;
  fat_total_g: number;
  fat_saturated_g: number;
  carbs_g: number;
  fiber_g: number;
  sodium_mg: number;
  potassium_mg: number;
  calcium_mg: number;
  magnesium_mg: number;
  glycemic_index?: number | null;
  data_source: DataSource;
  is_estimated: boolean;
  reference_food?: string | null;
  confidence_level?: ConfidenceLevel | null;
  image_url?: string | null;
  is_active: boolean;
  dash_score?: number | null;
}

export interface FoodItemWithDash extends FoodItem {
  dash_score: number;
  dash_category: DashCategory;
}

// ─── DASH Score ───────────────────────────────────────────────────────────────

export type DashCategory =
  | "Sangat Baik"
  | "Baik"
  | "Cukup"
  | "Perlu Perhatian";

export interface DashScore {
  score: number;
  category: DashCategory;
}

export interface DashScoreItem {
  food_id: string;
  food_name: string;
  dash_score: number;
  dash_category: DashCategory;
}

export interface DashScoreResponse {
  items: DashScoreItem[];
  daily_dash_score: number;
  daily_dash_category: DashCategory;
  improvement_tips?: ImprovementTip[] | null;
}

export interface ImprovementTip {
  nutrient: string;
  nutrient_label: string;
  actual_value: number;
  target_value: number;
  gap: number;
  suggested_foods: string[];
}

// ─── Rencana Makan ────────────────────────────────────────────────────────────

export interface MealPlanResponse {
  id: string;
  plan_date: string;
  breakfast: FoodItemWithDash[];
  lunch: FoodItemWithDash[];
  dinner: FoodItemWithDash[];
  snacks: FoodItemWithDash[];
  total_dash_score: number;
  total_sodium_mg: number;
  total_potassium_mg: number;
  total_calories_kcal: number;
  nutrition_warnings: string[];
}

// ─── Log Konsumsi ─────────────────────────────────────────────────────────────

export interface ConsumptionLog {
  id: string;
  user_id: string;
  meal_plan_id?: string | null;
  log_date: string;
  dash_score?: number | null;
  sodium_mg?: number | null;
  potassium_mg?: number | null;
  calories_kcal?: number | null;
  notes?: string | null;
  created_at: string;
}

// ─── Tekanan Darah ────────────────────────────────────────────────────────────

export interface BloodPressureRecord {
  id: string;
  user_id: string;
  systolic_mmhg: number;
  diastolic_mmhg: number;
  measured_at: string;
  notes?: string | null;
  is_critical: boolean;
  created_at: string;
}

export interface BloodPressureCreate {
  systolic_mmhg: number;
  diastolic_mmhg: number;
  measured_at: string;
  notes?: string | null;
}

// ─── Tracker Progres ──────────────────────────────────────────────────────────

export type ProgressPeriod = 7 | 30 | 90;

export interface ProgressTrendPoint {
  date: string;
  dash_score: number | null;
  sodium_mg: number | null;
  potassium_mg: number | null;
  calories_kcal: number | null;
}

export interface WeeklySummary {
  period_start: string;
  period_end: string;
  avg_dash_score: number;
  total_sodium_mg: number;
  total_potassium_mg: number;
  days_logged: number;
}

export interface ComplianceStats {
  total_days_logged: number;
  days_compliant: number;
  compliance_percentage: number;
}

export interface ProgressResponse {
  trend: ProgressTrendPoint[];
  weekly_summary?: WeeklySummary | null;
  compliance: ComplianceStats;
  reminder_needed: boolean;
}

// ─── API Response Generik ─────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
  detail?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  database: "connected" | "disconnected";
  version: string;
  timestamp: string;
}
