 // Helper untuk memanggil FastAPI backend dari TensiMenu
 // - Instance axios dengan base URL dan JWT Bearer token otomatis
 // - Fungsi-fungsi API yang dikelompokkan per domain (auth, profil, rekomendasi, dll.)

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { getSession } from "next-auth/react";
import type {
  UserProfile,
  UserProfileCreate,
  UserProfileUpdate,
  MealPlanResponse,
  BloodPressureRecord,
  BloodPressureCreate,
  ConsumptionLog,
  DashScoreResponse,
  ProgressResponse,
  ProgressPeriod,
  HealthCheckResponse,
  FoodItem,
  PaginatedResponse,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Instance axios yang secara otomatis:
// 1. Menambahkan base URL FastAPI
// 2. Menyertakan header Authorization: Bearer <JWT> dari sesi NextAuth
// 3. Mengatur Content-Type ke application/json
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 detik
});

// Interceptor: tambahkan JWT Bearer token dari sesi NextAuth ke setiap request
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: tangani error respons secara terpusat
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Biarkan error diteruskan ke pemanggil untuk ditangani sesuai konteks
    return Promise.reject(error);
  }
);

// Helper Request 
async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

// API: Health Check 
export const healthApi = {
  check: () => get<HealthCheckResponse>("/health"),
};

// API: Profil Pengguna 
export const profileApi = {
  //Ambil profil pengguna yang sedang login
  get: () => get<UserProfile>("/profile"),

  // Buat profil baru (setelah registrasi)
  create: (data: UserProfileCreate) => post<UserProfile>("/profile", data),

  // Perbarui profil yang sudah ada
  update: (data: UserProfileUpdate) => put<UserProfile>("/profile", data),
};

// API: Rekomendasi Makanan
export const recommendationsApi = {
  // Hasilkan rencana makan harian
  getMealPlan: () => get<MealPlanResponse>("/recommendations"),

  // Dapatkan minimal 3 alternatif untuk satu item makanan
  getAlternatives: (foodId: string) =>
    get<FoodItem[]>(`/recommendations/${foodId}/alternatives`),

  // Konfirmasi konsumsi rencana makan hari ini
  confirmConsumption: (mealPlanId: string) =>
    post<ConsumptionLog>("/recommendations/confirm", { meal_plan_id: mealPlanId }),
};

// API: DASH Score
export const dashScoreApi = {
  // Hitung DASH Score untuk daftar item makanan beserta porsi
  calculate: (items: Array<{ food_id: string; serving_g: number }>) =>
    post<DashScoreResponse>("/dash-score", { items }),

  // DASH Score harian pengguna berdasarkan log konsumsi hari ini
  getDaily: () => get<DashScoreResponse>("/dash-score/daily"),
};

// API: Tracker Progres
export const progressApi = {
  // Ringkasan progres pengguna
  getSummary: () => get<ProgressResponse>("/progress"),

  // Tren DASH Score untuk periode tertentu (7, 30, atau 90 hari)
  getTrend: (period: ProgressPeriod) =>
    get<ProgressResponse>(`/progress/trend?period=${period}`),

  // Ringkasan mingguan (rata-rata DASH Score, total natrium, total kalium)
  getWeeklySummary: () => get<ProgressResponse>("/progress/weekly-summary"),
};

// API: Tekanan Darah 
export const bloodPressureApi = {
  // Daftar riwayat tekanan darah
  getList: (period?: ProgressPeriod) =>
    get<PaginatedResponse<BloodPressureRecord>>(
      `/blood-pressure${period ? `?period=${period}` : ""}`
    ),

  // Catat tekanan darah baru
  create: (data: BloodPressureCreate) =>
    post<BloodPressureRecord>("/blood-pressure", data),

  // Ekspor riwayat tekanan darah sebagai CSV (mengembalikan blob URL) 
  exportCsv: async (): Promise<string> => {
    const response = await apiClient.get("/blood-pressure/export", {
      responseType: "blob",
    });
    return URL.createObjectURL(response.data as Blob);
  },
};

// API: Database Makanan
export const foodApi = {
  // Daftar semua makanan aktif dengan filter opsional
  getList: (params?: { region?: string; category?: string }) =>
    get<FoodItem[]>("/foods", { params }),

  // Detail satu item makanan
  getById: (foodId: string) => get<FoodItem>(`/foods/${foodId}`),
};
