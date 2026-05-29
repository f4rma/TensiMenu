/**
 * Types untuk Profile Onboarding Wizard.
 */

export type Gender = "laki-laki" | "perempuan";

export type Comorbidity =
  | "diabetes_t2"
  | "ckd"
  | "dyslipidemia"
  | "obesity"
  | "tidak_ada";

export type FoodRestriction =
  | "alergi_kacang"
  | "alergi_seafood"
  | "alergi_susu"
  | "alergi_telur"
  | "tidak_makan_babi"
  | "vegetarian"
  | "vegan";

export type RegionalPref =
  | "padang"
  | "jawa"
  | "sunda"
  | "betawi"
  | "batak"
  | "bugis"
  | "papua"
  | "manado";

export type AvatarStyle = "lorelei" | "avataaars" | "notionists" | "bottts";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export interface ProfileFormData {
  // Step 1: Data Fisik
  full_name: string;
  age: number | "";
  gender: Gender | "";
  weight_kg: number | "";
  height_cm: number | "";
  activity_level: ActivityLevel;

  // Step 2: Kondisi Medis
  systolic_bp: number | "";
  diastolic_bp: number | "";
  comorbidities: Comorbidity[];

  // Step 3: Preferensi Makanan
  food_restrictions: FoodRestriction[];
  regional_prefs: RegionalPref[];

  // Step 4: Avatar
  avatar_style: AvatarStyle;
}

export interface DailyTargets {
  sodium_mg: number;
  potassium_mg: number;
  calcium_mg: number;
  fiber_g: number;
  fat_total_g: number;
  energy_kcal: number;
  phosphorus_mg: number;
}

export const COMORBIDITY_LABELS: Record<Comorbidity, string> = {
  diabetes_t2: "Diabetes Tipe 2",
  ckd: "Gagal Ginjal Kronis (CKD)",
  dyslipidemia: "Dislipidemia (Kolesterol Tinggi)",
  obesity: "Obesitas",
  tidak_ada: "Tidak Ada",
};

export const FOOD_RESTRICTION_LABELS: Record<FoodRestriction, string> = {
  alergi_kacang: "Alergi Kacang",
  alergi_seafood: "Alergi Seafood",
  alergi_susu: "Alergi Susu",
  alergi_telur: "Alergi Telur",
  tidak_makan_babi: "Tidak Makan Babi",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
};

export const REGIONAL_LABELS: Record<RegionalPref, string> = {
  padang: "Padang (Minang)",
  jawa: "Jawa",
  sunda: "Sunda",
  betawi: "Betawi",
  batak: "Batak",
  bugis: "Bugis",
  papua: "Papua",
  manado: "Manado",
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sangat Tidak Aktif",
  light: "Ringan",
  moderate: "Sedang",
  active: "Aktif",
  very_active: "Sangat Aktif",
};

export const ACTIVITY_LEVEL_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: "Bedrest, hampir tidak ada aktivitas fisik",
  light: "Kerja kantor, jarang olahraga",
  moderate: "Olahraga 3-5 kali per minggu",
  active: "Olahraga hampir setiap hari",
  very_active: "Atlet atau pekerja fisik berat",
};

export const INITIAL_FORM_DATA: ProfileFormData = {
  full_name: "",
  age: "",
  gender: "",
  weight_kg: "",
  height_cm: "",
  activity_level: "light",
  systolic_bp: "",
  diastolic_bp: "",
  comorbidities: [],
  food_restrictions: [],
  regional_prefs: [],
  avatar_style: "lorelei",
};
