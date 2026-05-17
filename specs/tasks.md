# Tasks — TensiMenu

Dokumen ini mendefinisikan semua tugas implementasi untuk membangun TensiMenu — sistem rekomendasi makanan lokal berbasis DASH Diet untuk penderita hipertensi. Tugas diurutkan dari infrastruktur dasar hingga pengujian dan deployment.

**Stack Teknologi:**
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + NextAuth.js
- Backend: FastAPI (Python) + scikit-learn
- Database: Supabase (PostgreSQL) + Row Level Security
- ML: Content-Based Filtering + Cosine Similarity
- Deployment: Vercel (frontend) + Railway/Render (backend)

---

## Fase 1: Setup Infrastruktur dan Fondasi Proyek

- [ ] 1. Inisialisasi repositori dan struktur proyek
  - Buat monorepo dengan dua direktori utama: rontend/ (Next.js) dan ackend/ (FastAPI)
  - Inisialisasi rontend/ dengan create-next-app menggunakan TypeScript, Tailwind CSS, dan App Router
  - Inisialisasi ackend/ dengan struktur direktori sesuai desain: pi/v1/, core/, models/, services/, ml/
  - Buat file .env.example untuk frontend dan backend dengan semua variabel lingkungan yang diperlukan
  - Konfigurasi .gitignore untuk mengecualikan .env, __pycache__, 
ode_modules, artefak ML (.pkl, .npy)
  - Buat README.md dengan instruksi setup dan menjalankan proyek secara lokal
  - **Dependensi:** Tidak ada
  - **Persyaratan:** 11.1, 12.1

- [ ] 2. Setup Supabase dan skema database
  - Buat proyek Supabase baru dan catat URL, anon key, dan service role key
  - Jalankan migrasi SQL untuk membuat tabel: user_profiles, ood_items, ood_items_audit_log, meal_plans, consumption_logs, lood_pressure_records, ailed_login_attempts
  - Aktifkan Row Level Security (RLS) pada semua tabel yang menyimpan data pengguna
  - Buat RLS policies: "Users can only access own profile", "Users can only access own meal plans", "Users can only access own logs", "Users can only access own BP records"
  - Buat indeks database: idx_food_items_region, idx_food_items_category, idx_food_items_active, idx_bp_user_date, idx_failed_login_ip
  - Verifikasi koneksi dari backend Python menggunakan supabase-py
  - **Dependensi:** Task 1
  - **Persyaratan:** 10.2, 7.1, 7.2

- [ ] 3. Konfigurasi backend FastAPI dasar
  - Install dependensi Python: astapi, uvicorn, supabase, python-jose[cryptography], pydantic, scikit-learn, 
umpy, pandas, joblib, slowapi, python-dotenv
  - Buat ackend/main.py dengan konfigurasi FastAPI, CORS middleware, dan router agregasi
  - Buat ackend/core/config.py untuk memuat variabel lingkungan (Supabase URL, JWT secret, dll.)
  - Buat ackend/core/database.py untuk koneksi Supabase dengan retry logic (3 kali, jeda eksponensial)
  - Buat ackend/core/security.py dengan fungsi get_current_user() untuk validasi JWT Supabase
  - Buat ackend/core/rate_limiter.py menggunakan slowapi dengan batas 100 req/menit per pengguna
  - Implementasi endpoint GET /api/v1/health yang mengembalikan status sistem dan konektivitas database
  - **Dependensi:** Task 2
  - **Persyaratan:** 10.1, 10.3, 10.4, 11.3, 12.2, 12.6

- [ ] 4. Konfigurasi frontend Next.js dasar
  - Install dependensi: 
ext-auth, @supabase/supabase-js, xios, eact-hook-form, zod, echarts, @radix-ui/react-* (komponen UI dasar)
  - Buat src/lib/supabase.ts untuk Supabase client (browser dan server)
  - Buat src/lib/auth.ts dengan konfigurasi NextAuth.js: Google Provider, Credentials Provider, JWT strategy (maxAge 30 menit)
  - Buat src/app/api/auth/[...nextauth]/route.ts sebagai handler NextAuth.js
  - Buat src/lib/api.ts dengan fungsi helper untuk memanggil FastAPI backend (dengan JWT header)
  - Buat src/types/index.ts dengan semua TypeScript type definitions (UserProfile, FoodItem, MealPlan, BloodPressureRecord, dll.)
  - Buat layout dasar src/app/layout.tsx dengan SessionProvider
  - **Dependensi:** Task 1, Task 2
  - **Persyaratan:** 1.7, 9.1, 9.5


---

## Fase 2: Autentikasi dan Manajemen Sesi

- [ ] 5. Implementasi registrasi pengguna (backend)
  - Buat ackend/models/user.py dengan Pydantic models: UserRegisterRequest, UserRegisterResponse
  - Buat ackend/api/v1/auth.py dengan endpoint POST /api/v1/auth/register
  - Implementasi logika: validasi email unik via Supabase Auth, hash password, buat akun Supabase Auth
  - Kembalikan HTTP 201 dengan user_id dan pesan sukses jika berhasil
  - Kembalikan HTTP 409 dengan {"detail": "Email sudah terdaftar", "error_code": "EMAIL_ALREADY_EXISTS"} jika email duplikat
  - Kembalikan HTTP 422 dengan daftar field tidak valid jika validasi gagal
  - **Dependensi:** Task 3
  - **Persyaratan:** 1.1, 1.2, 1.3, 10.5

- [ ] 6. Implementasi login dan manajemen sesi (backend)
  - Tambahkan endpoint POST /api/v1/auth/login dengan validasi email/password via Supabase Auth
  - Kembalikan pesan generik "Email atau kata sandi salah" untuk kredensial tidak valid (tanpa detail spesifik)
  - Tambahkan endpoint POST /api/v1/auth/logout untuk invalidasi sesi
  - Tambahkan endpoint POST /api/v1/auth/reset-password untuk mengirim email reset (kedaluwarsa 60 menit)
  - Tambahkan endpoint POST /api/v1/auth/refresh untuk refresh JWT token
  - Implementasi pelacakan ailed_login_attempts: blokir IP selama 15 menit setelah 5 kegagalan dalam 10 menit
  - **Dependensi:** Task 5
  - **Persyaratan:** 1.4, 1.5, 1.6, 1.8, 10.6

- [ ] 7. Implementasi halaman login dan registrasi (frontend)
  - Buat src/components/ui/ dengan komponen dasar: Button, Input, Card, Label, Alert
  - Buat src/components/auth/LoginForm.tsx dengan form email/password dan tombol "Masuk dengan Google"
  - Buat src/components/auth/RegisterForm.tsx dengan form nama lengkap, email, dan kata sandi
  - Buat src/app/(auth)/login/page.tsx dan src/app/(auth)/register/page.tsx
  - Implementasi validasi form sisi klien menggunakan eact-hook-form + zod
  - Tampilkan pesan error yang sesuai (email duplikat, kredensial salah, dll.)
  - Redirect ke /profile setelah registrasi berhasil; redirect ke / setelah login berhasil
  - Implementasi Google OAuth flow via NextAuth.js signIn('google')
  - **Dependensi:** Task 4, Task 5, Task 6
  - **Persyaratan:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 9.1, 9.3, 9.5

- [ ] 8. Uji properti autentikasi (property-based tests)
  - Tulis property test menggunakan Hypothesis (Python) untuk Properti 1: registrasi dengan data valid selalu membuat akun
  - Tulis property test untuk Properti 2: kredensial tidak valid selalu menghasilkan pesan error generik
  - Tulis property test untuk Properti 22: token JWT tidak valid selalu menghasilkan HTTP 401
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 5, Task 6
  - **Persyaratan:** 1.3, 1.5, 10.3
  - **Memvalidasi: Properti 1, Properti 2, Properti 22**


---

## Fase 3: Profil Pengguna dan Kalkulasi Target Nutrisi

- [ ] 9. Implementasi model dan endpoint profil pengguna (backend)
  - Buat ackend/models/profile.py dengan Pydantic models: UserProfileCreate, UserProfileUpdate, UserProfileResponse
  - Validasi: usia 18–90, sistolik 70–250, diastolik 40–150, berat badan > 0, tinggi badan > 0
  - Buat ackend/api/v1/profile.py dengan endpoint: GET /api/v1/profile, POST /api/v1/profile, PUT /api/v1/profile
  - Semua endpoint memerlukan autentikasi JWT yang valid
  - Kembalikan HTTP 422 dengan daftar field tidak valid jika validasi gagal
  - **Dependensi:** Task 3, Task 6
  - **Persyaratan:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 12.3

- [ ] 10. Implementasi kalkulasi target nutrisi personal (backend)
  - Buat ackend/services/nutrition_calculator.py dengan fungsi calculate_personal_targets(profile)
  - Implementasi rumus Mifflin-St Jeor untuk BMR (laki-laki dan perempuan)
  - Hitung semua target DASH: natrium (2300 mg, atau 1500 mg jika sistolik >= 150 atau CKD), kalium (4000 mg, atau maks 2000 mg jika CKD), serat (25g perempuan / 38g laki-laki), kalsium (1000 mg usia <= 50 / 1200 mg usia > 50), magnesium (310 mg perempuan / 400 mg laki-laki), batas lemak jenuh (7% energi), batas lemak total (27% energi)
  - Simpan daily_targets sebagai JSONB ke tabel user_profiles bersama data profil
  - Panggil calculate_personal_targets() secara otomatis saat POST /api/v1/profile dan PUT /api/v1/profile
  - **Dependensi:** Task 9
  - **Persyaratan:** 2.10, 2.11

- [ ] 11. Implementasi halaman profil pengguna (frontend)
  - Buat src/components/profile/ProfileForm.tsx dengan semua field profil
  - Buat src/components/profile/ComorbidSelector.tsx untuk memilih komorbid (diabetes_t2, ckd, dyslipidemia, obesity, tidak ada)
  - Buat src/app/(dashboard)/profile/page.tsx
  - Implementasi validasi sisi klien: usia 18–90, sistolik 70–250, diastolik 40–150
  - Tampilkan pesan validasi yang sesuai untuk setiap field yang tidak valid
  - Redirect ke halaman rekomendasi setelah profil berhasil disimpan
  - Tampilkan notifikasi pengingat jika profil belum lengkap dan batasi akses ke fitur rekomendasi
  - **Dependensi:** Task 4, Task 9, Task 10
  - **Persyaratan:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 9.1, 9.3, 9.5

- [ ] 12. Uji properti profil dan validasi (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 3: validasi usia menolak semua nilai di luar rentang [18, 90]
  - Tulis property test untuk Properti 4: validasi tekanan darah menolak semua nilai di luar rentang
  - Tulis property test untuk Properti 5: penyimpanan dan pembacaan profil menghasilkan data identik (round-trip)
  - Tulis property test untuk Properti 23: input tidak sesuai skema selalu menghasilkan HTTP 422 dengan detail
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 9, Task 10
  - **Persyaratan:** 2.2, 2.3, 2.4, 2.5, 12.3
  - **Memvalidasi: Properti 3, Properti 4, Properti 5, Properti 23**


---

## Fase 4: Database Makanan Lokal

- [ ] 13. Persiapan dan kurasi dataset makanan lokal
  - Kumpulkan data nutrisi dari sumber primer: DKPI (Dataset Komposisi Pangan Indonesia), USDA FoodData Central, Nutrisurvey
  - Susun minimal 200 item makanan lokal Indonesia mencakup: Minang, Jawa, Sunda, Batak, Bugis, Papua
  - Pastikan setiap item memiliki 10 komponen nutrisi DASH: energi (kkal), protein (g), lemak total (g), lemak jenuh (g), karbohidrat (g), serat (g), natrium (mg), kalium (mg), kalsium (mg), magnesium (mg) per 100 gram
  - Kategorikan setiap item: sarapan, makan_siang, makan_malam, camilan
  - Untuk item tanpa data primer, gunakan makanan referensi sebagai proxy dan tandai is_estimated: true, eference_food: "<nama proxy>", confidence_level: "rendah"
  - Catat data_source untuk setiap item: DKPI, USDA, Nutrisurvey, atau Estimasi
  - Siapkan file seed SQL atau CSV untuk import ke Supabase
  - **Dependensi:** Task 2
  - **Persyaratan:** 7.1, 7.2, 7.3, 7.7

- [ ] 14. Implementasi endpoint database makanan (backend)
  - Buat ackend/models/food.py dengan Pydantic models: FoodItem, FoodItemCreate, FoodItemUpdate
  - Buat ackend/api/v1/food_database.py dengan endpoint:
    - GET /api/v1/foods — daftar semua makanan aktif (dengan filter region, category)
    - GET /api/v1/foods/{food_id} — detail satu item makanan
    - POST /api/v1/foods — tambah item baru (admin only)
    - PUT /api/v1/foods/{food_id} — perbarui item (admin only, simpan audit log)
  - Implementasi validasi: tolak item baru tanpa data lengkap 10 komponen nutrisi (kecuali menggunakan mekanisme estimasi)
  - Implementasi audit log otomatis saat data nutrisi diperbarui (simpan ke ood_items_audit_log)
  - **Dependensi:** Task 3, Task 13
  - **Persyaratan:** 7.2, 7.3, 7.4, 7.5

- [ ] 15. Uji properti database makanan (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 18: semua item makanan dalam database memiliki data nutrisi lengkap (10 komponen, non-negatif, sumber valid)
  - Tulis property test untuk Properti 19: serialisasi JSON item makanan adalah round-trip yang sempurna
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 13, Task 14
  - **Persyaratan:** 7.2, 7.5, 7.6
  - **Memvalidasi: Properti 18, Properti 19**


---

## Fase 5: Pipeline Machine Learning

- [ ] 16. Implementasi feature engineering dan normalisasi (ML)
  - Buat ackend/ml/feature_engineering.py dengan fungsi:
    - extract_food_features(food_items) — ekstrak 7 fitur DASH dari daftar FoodItem ke numpy array
    - uild_user_nutrition_vector(targets) — konversi target nutrisi personal ke vektor numpy
  - Definisikan konstanta DASH_FEATURES = ['sodium_mg', 'potassium_mg', 'calcium_mg', 'magnesium_mg', 'fiber_g', 'fat_saturated_g', 'fat_total_g']
  - Implementasi StandardScaler fit pada seluruh dataset makanan
  - Pastikan normalisasi deterministik (hasil yang sama untuk input yang sama)
  - **Dependensi:** Task 13, Task 14
  - **Persyaratan:** 8.1, 8.3

- [ ] 17. Implementasi Content-Based Filtering dengan cosine similarity (ML)
  - Buat ackend/ml/content_based_filter.py dengan class ContentBasedFilter
  - Implementasi metode it(food_items): latih StandardScaler dan buat item feature matrix
  - Implementasi metode ecommend(user_vector, food_items, top_k, filters): hitung cosine similarity, urutkan, terapkan filter
  - Filter komorbid dan pantangan diterapkan **sebelum** perhitungan similarity
  - Implementasi aturan anti-repetisi: turunkan prioritas makanan yang dikonsumsi dalam 3 hari terakhir (bukan hapus)
  - Jika kandidat yang memenuhi batasan < 4 item, abaikan aturan anti-repetisi dan tambahkan label "Sudah pernah direkomendasikan"
  - Gunakan andom_state=42 untuk reprodusibilitas
  - **Dependensi:** Task 16
  - **Persyaratan:** 3.2, 3.11, 3.12, 8.1, 8.3

- [ ] 18. Implementasi training pipeline dan penyimpanan artefak model (ML)
  - Buat ackend/ml/pipeline.py dengan fungsi 	rain_and_save_model(food_items, output_path)
  - Set seed: 
p.random.seed(42), andom.seed(42) sebelum training
  - Simpan artefak model menggunakan joblib.dump(): scaler.pkl, item_matrix.npy, ood_ids.json, metadata versi
  - Simpan metadata: ersion, 	rained_at, andom_state, 
_items
  - Buat ackend/ml/model_loader.py dengan fungsi load_model_artifacts(path) untuk memuat artefak saat startup
  - Buat skrip training yang dapat dijalankan secara mandiri (Google Colab / Railway)
  - **Dependensi:** Task 17
  - **Persyaratan:** 8.3, 8.7

- [ ] 19. Implementasi Validator Nutrisi (backend)
  - Buat ackend/services/nutrition_validator.py dengan class NutritionValidator
  - Implementasi alidate_meal_plan(meal_plan, profile): validasi total natrium, kalium, dan batasan komorbid
  - Implementasi batasan CKD: kalium < 2000 mg, fosfor < 800 mg
  - Implementasi prioritas GI rendah (< 55) untuk diabetes tipe 2
  - Kembalikan ValidationResult dengan is_valid dan daftar warnings
  - **Dependensi:** Task 10, Task 17
  - **Persyaratan:** 3.3, 3.4, 3.5, 3.6

- [ ] 20. Uji properti ML dan reprodusibilitas (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 20: model ML reprodusibel dengan seed tetap
  - Tulis unit test untuk memverifikasi filter komorbid diterapkan sebelum cosine similarity
  - Tulis unit test untuk memverifikasi aturan anti-repetisi (3 hari terakhir)
  - Tulis unit test untuk memverifikasi fallback anti-repetisi saat kandidat < 4 item
  - Jalankan semua tests dan pastikan lulus
  - **Dependensi:** Task 17, Task 18
  - **Persyaratan:** 8.1, 8.3
  - **Memvalidasi: Properti 20**


---

## Fase 6: DASH Score — Kalkulasi dan Tampilan

- [ ] 21. Implementasi kalkulasi DASH Score (backend)
  - Buat ackend/services/dash_score_service.py dengan fungsi:
    - calculate_dash_score(nutrition_per_serving, serving_size_g, user_targets) — hitung DASH Score (0–100) untuk satu item
    - calculate_daily_dash_score(food_items_with_portions, user_targets) — hitung DASH Score agregat harian (rata-rata tertimbang berdasarkan gram)
    - get_dash_category(score) — kembalikan label: "Sangat Baik" (80–100), "Baik" (60–79), "Cukup" (40–59), "Perlu Perhatian" (0–39)
    - get_improvement_tips(daily_score, actual_nutrients, user_targets) — identifikasi 3 nutrisi terjauh dari target dan saran makanan lokal spesifik
  - Implementasi bobot nutrisi: natrium 0.25, kalium 0.20, kalsium 0.15, magnesium 0.15, serat 0.10, lemak jenuh 0.10, lemak total 0.05
  - Formula deterministik: input yang sama + profil yang sama = output yang sama
  - **Dependensi:** Task 10
  - **Persyaratan:** 4.1, 4.2, 4.3, 4.5, 4.6

- [ ] 22. Implementasi endpoint DASH Score (backend)
  - Buat ackend/api/v1/dash_score.py dengan endpoint:
    - POST /api/v1/dash-score — hitung DASH Score untuk daftar item makanan beserta porsi
    - GET /api/v1/dash-score/daily — DASH Score harian pengguna berdasarkan log konsumsi hari ini
  - Kembalikan DASH Score per item dan DASH Score agregat dalam format JSON
  - Sertakan dash_category untuk setiap skor
  - Jika DASH Score harian < 40, sertakan improvement_tips dengan 3 nutrisi terjauh dan saran makanan
  - **Dependensi:** Task 21
  - **Persyaratan:** 4.1, 4.2, 4.3, 4.4, 4.5, 8.5

- [ ] 23. Implementasi komponen DASH Score (frontend)
  - Buat src/components/dash-score/DashScoreGauge.tsx — gauge chart atau progress bar dengan nilai numerik dan label kategori
  - Buat src/components/dash-score/ScoreBadge.tsx — badge berwarna sesuai kategori (Sangat Baik/Baik/Cukup/Perlu Perhatian)
  - Buat src/components/dash-score/ImprovementTips.tsx — tampilkan 3 nutrisi terjauh dari target dan saran makanan lokal
  - Tampilkan label "⚠ Data Estimasi" pada kartu makanan yang memiliki is_estimated: true
  - **Dependensi:** Task 4, Task 22
  - **Persyaratan:** 4.3, 4.4, 4.5, 4.7, 7.8, 9.3

- [ ] 24. Uji properti DASH Score (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 10: DASH Score selalu berada dalam rentang [0, 100]
  - Tulis property test untuk Properti 11: DASH Score deterministik — input sama selalu menghasilkan output sama
  - Tulis property test untuk Properti 12: label kategori DASH Score selalu sesuai rentang
  - Tulis property test untuk Properti 13: DASH Score agregat adalah rata-rata tertimbang yang valid
  - Tulis property test untuk Properti 21: endpoint DASH Score mengembalikan skor per item dan agregat
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 21, Task 22
  - **Persyaratan:** 4.1, 4.2, 4.3, 4.6, 8.5
  - **Memvalidasi: Properti 10, Properti 11, Properti 12, Properti 13, Properti 21**


---

## Fase 7: Sistem Rekomendasi Makanan Harian

- [ ] 25. Implementasi service rekomendasi (backend)
  - Buat ackend/services/recommendation_service.py dengan class RecommendationService
  - Implementasi metode generate_meal_plan(user_id):
    1. Muat profil pengguna dan daily_targets dari database
    2. Bangun user nutrition vector dari daily_targets
    3. Muat artefak model ML (scaler, item_matrix, food_ids)
    4. Terapkan filter komorbid dan pantangan sebelum cosine similarity
    5. Hitung cosine similarity dan urutkan makanan per kategori
    6. Terapkan aturan anti-repetisi (3 hari terakhir dari consumption_logs)
    7. Pilih top-K per kategori (sarapan, makan siang, makan malam, camilan)
    8. Hitung DASH Score per item dan agregat
    9. Validasi rencana makan dengan NutritionValidator
    10. Simpan rencana makan ke tabel meal_plans
  - Jika database tidak memiliki cukup item yang memenuhi batasan, tampilkan pesan informatif dan rekomendasikan item terbaik yang tersedia
  - **Dependensi:** Task 17, Task 19, Task 21
  - **Persyaratan:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.10, 3.11, 3.12

- [ ] 26. Implementasi endpoint rekomendasi (backend)
  - Buat ackend/api/v1/recommendations.py dengan endpoint:
    - GET /api/v1/recommendations — hasilkan rencana makan harian (waktu respons <= 5 detik)
    - GET /api/v1/recommendations/{food_id}/alternatives — dapatkan minimal 3 alternatif makanan
    - POST /api/v1/recommendations/confirm — konfirmasi konsumsi rencana makan (simpan ke consumption_logs)
  - Kembalikan HTTP 404 dengan {"error": "Pengguna tidak ditemukan", "code": "USER_NOT_FOUND"} jika user_id tidak ada
  - Kembalikan HTTP 500 dengan format JSON terstruktur (tanpa stack trace) jika ML gagal
  - Sertakan 
utrition_warnings dalam respons jika ada pelanggaran batasan nutrisi
  - **Dependensi:** Task 25
  - **Persyaratan:** 3.1, 3.7, 3.8, 3.9, 3.10, 8.4, 8.6, 8.8

- [ ] 27. Implementasi halaman rekomendasi harian (frontend)
  - Buat src/components/recommendations/FoodItemCard.tsx — kartu makanan dengan nama, asal daerah, porsi, ringkasan nutrisi DASH, DASH Score badge, dan label "⚠ Data Estimasi" jika berlaku
  - Buat src/components/recommendations/MealPlanCard.tsx — kartu rencana makan per waktu makan (sarapan/siang/malam/camilan)
  - Buat src/components/recommendations/AlternativeList.tsx — daftar alternatif makanan saat pengguna menolak rekomendasi
  - Buat src/app/(dashboard)/recommendations/page.tsx
  - Tampilkan DASH Score harian dengan gauge chart dan label kategori
  - Implementasi tombol "Tolak" yang memuat minimal 3 alternatif
  - Implementasi tombol "Konfirmasi Konsumsi Hari Ini"
  - Tampilkan 
utrition_warnings jika ada
  - **Dependensi:** Task 4, Task 23, Task 26
  - **Persyaratan:** 3.1, 3.8, 3.9, 3.10, 3.12, 4.3, 4.4, 7.8, 9.1, 9.5

- [ ] 28. Uji properti sistem rekomendasi (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 6: rencana makan selalu memiliki struktur lengkap (minimal 1 item per waktu makan)
  - Tulis property test untuk Properti 7: rencana makan selalu memenuhi batas natrium DASH (< 2300 mg untuk non-CKD)
  - Tulis property test untuk Properti 8: rencana makan untuk pengguna CKD memenuhi batasan kalium (< 2000 mg) dan fosfor (< 800 mg)
  - Tulis property test untuk Properti 9: penolakan makanan selalu menghasilkan minimal 3 alternatif
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 25, Task 26
  - **Persyaratan:** 3.1, 3.3, 3.4, 3.5, 3.8
  - **Memvalidasi: Properti 6, Properti 7, Properti 8, Properti 9**


---

## Fase 8: Tracker Progres Harian

- [ ] 29. Implementasi service dan endpoint tracker progres (backend)
  - Buat ackend/services/progress_service.py dengan fungsi:
    - get_progress_trend(user_id, period_days) — ambil tren DASH Score untuk 7/30/90 hari
    - get_weekly_summary(user_id) — hitung rata-rata DASH Score, total natrium, total kalium untuk 7 hari terakhir
    - get_compliance_percentage(user_id) — hitung persentase hari dengan DASH Score >= 60
    - check_reminder_needed(user_id) — cek apakah pengguna tidak mencatat selama 2 hari berturut-turut
  - Buat ackend/api/v1/progress.py dengan endpoint:
    - GET /api/v1/progress — ringkasan progres pengguna
    - GET /api/v1/progress/trend?period=7|30|90 — tren DASH Score
    - GET /api/v1/progress/weekly-summary — ringkasan mingguan
  - Jika tidak ada data untuk periode yang diminta, kembalikan pesan "Belum ada data untuk periode ini" (bukan array kosong)
  - **Dependensi:** Task 3, Task 26
  - **Persyaratan:** 5.1, 5.2, 5.3, 5.4, 5.6, 5.7

- [ ] 30. Implementasi halaman tracker progres (frontend)
  - Buat src/components/tracker/ProgressChart.tsx — grafik garis tren DASH Score menggunakan Recharts
  - Buat src/components/tracker/WeeklySummary.tsx — ringkasan mingguan (rata-rata DASH Score, total natrium, total kalium)
  - Buat src/components/tracker/ComplianceStats.tsx — statistik kepatuhan kumulatif (persentase hari >= 60)
  - Buat src/app/(dashboard)/tracker/page.tsx dengan tab periode: 7 Hari, 30 Hari, 90 Hari
  - Tampilkan pesan "Belum ada data untuk periode ini" jika tidak ada data (bukan grafik kosong)
  - Implementasi notifikasi pengingat di antarmuka jika pengguna tidak mencatat selama 2 hari berturut-turut
  - **Dependensi:** Task 4, Task 29
  - **Persyaratan:** 5.2, 5.3, 5.4, 5.5, 5.7, 9.1, 9.5

- [ ] 31. Uji properti tracker progres (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 14: ringkasan mingguan dihitung dengan benar dari log konsumsi
  - Tulis property test untuk Properti 15: persentase kepatuhan dihitung dengan benar
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 29
  - **Persyaratan:** 5.3, 5.4
  - **Memvalidasi: Properti 14, Properti 15**


---

## Fase 9: Riwayat Tekanan Darah

- [ ] 32. Implementasi endpoint riwayat tekanan darah (backend)
  - Buat ackend/models/blood_pressure.py dengan Pydantic models: BloodPressureCreate, BloodPressureResponse
  - Field is_critical dihitung otomatis: True jika sistolik >= 180 atau diastolik >= 120
  - Buat ackend/api/v1/blood_pressure.py dengan endpoint:
    - POST /api/v1/blood-pressure — catat tekanan darah baru
    - GET /api/v1/blood-pressure — daftar riwayat (dengan filter periode)
    - GET /api/v1/blood-pressure/export — ekspor CSV
  - Validasi: sistolik 70–250, diastolik 40–150; kembalikan HTTP 422 jika di luar rentang
  - Endpoint ekspor CSV mengembalikan file dengan header: id, systolic_mmhg, diastolic_mmhg, measured_at, 
otes
  - **Dependensi:** Task 3
  - **Persyaratan:** 6.1, 6.2, 6.5, 6.6, 6.7

- [ ] 33. Implementasi halaman riwayat tekanan darah (frontend)
  - Buat src/components/blood-pressure/BPForm.tsx — formulir pencatatan dengan sistolik, diastolik, tanggal, waktu, catatan opsional
  - Buat src/components/blood-pressure/BPChart.tsx — grafik garis sistolik dan diastolik menggunakan Recharts, dengan garis referensi hipertensi (130/80 mmHg)
  - Buat src/components/blood-pressure/BPWarning.tsx — peringatan konsultasi medis untuk nilai kritis (sistolik >= 180 atau diastolik >= 120)
  - Buat src/app/(dashboard)/blood-pressure/page.tsx dengan tab periode: 7 Hari, 30 Hari, 90 Hari
  - Tampilkan daftar catatan terbaru dengan nilai, tanggal, dan catatan
  - Implementasi tombol "Ekspor CSV" yang mengunduh file riwayat
  - **Dependensi:** Task 4, Task 32
  - **Persyaratan:** 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 9.1, 9.5

- [ ] 34. Uji properti tekanan darah (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 16: nilai tekanan darah kritis selalu memicu peringatan (is_critical = True)
  - Tulis property test untuk Properti 17: ekspor CSV tekanan darah adalah round-trip yang sempurna
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 32
  - **Persyaratan:** 6.2, 6.5, 6.7
  - **Memvalidasi: Properti 16, Properti 17**


---

## Fase 10: Dashboard Beranda dan Navigasi

- [ ] 35. Implementasi halaman beranda (dashboard) (frontend)
  - Buat src/app/(dashboard)/layout.tsx dengan navigasi konsisten: Beranda, Rekomendasi, Tracker, Riwayat Tekanan Darah, Profil
  - Implementasi bottom navigation bar untuk mobile (< 768px) dan sidebar untuk desktop (>= 1024px)
  - Buat src/app/(dashboard)/page.tsx (halaman beranda) yang menampilkan:
    - Salam pengguna dengan tanggal hari ini
    - DASH Score harian dengan gauge chart dan label kategori
    - Ringkasan tekanan darah terakhir dengan indikator status
    - Pratinjau rencana makan hari ini (3 waktu makan utama)
    - Grafik tren DASH Score 7 hari terakhir
    - Persentase kepatuhan kumulatif
  - Implementasi middleware Next.js untuk redirect ke /login jika sesi tidak ada
  - Implementasi redirect ke /profile jika profil belum lengkap
  - **Dependensi:** Task 4, Task 11, Task 23, Task 27, Task 30, Task 33
  - **Persyaratan:** 2.9, 4.4, 9.1, 9.5, 9.7

- [ ] 36. Implementasi halaman kebijakan privasi (frontend)
  - Buat src/app/privacy/page.tsx dengan konten kebijakan privasi dalam Bahasa Indonesia
  - Jelaskan: jenis data yang dikumpulkan (profil kesehatan, riwayat konsumsi, tekanan darah), tujuan penggunaan, hak pengguna atas data
  - Tambahkan tautan ke halaman kebijakan privasi di footer semua halaman
  - **Dependensi:** Task 4
  - **Persyaratan:** 10.5, 10.7


---

## Fase 11: Keamanan, Performa, dan Keandalan

- [ ] 37. Implementasi keamanan API dan rate limiting (backend)
  - Verifikasi HTTPS/TLS 1.2+ dikonfigurasi di level deployment (Vercel/Railway)
  - Pastikan get_current_user() memvalidasi JWT dan mengembalikan HTTP 401 untuk token tidak valid/kedaluwarsa
  - Konfigurasi slowapi rate limiter: 100 req/menit per pengguna terautentikasi
  - Implementasi retry logic untuk koneksi database: 3 kali dengan jeda eksponensial (1s, 2s, 4s), kembalikan HTTP 503 jika semua gagal
  - Implementasi error logging untuk semua request HTTP 4xx dan 5xx: timestamp, endpoint, kode status, pesan kesalahan
  - Pastikan semua error response menggunakan format JSON terstruktur tanpa mengekspos stack trace
  - **Dependensi:** Task 3, Task 6
  - **Persyaratan:** 10.1, 10.3, 10.4, 11.3, 11.4

- [ ] 38. Implementasi penanganan error dan loading states (frontend)
  - Implementasi global error boundary di src/app/layout.tsx
  - Tampilkan indikator loading yang jelas saat menunggu respons API
  - Tampilkan pesan kesalahan informatif (bukan halaman kosong) saat koneksi lambat atau gagal
  - Implementasi retry otomatis untuk request yang gagal (maksimal 2 kali)
  - Pastikan semua halaman dapat digunakan pada lebar layar 320px–1920px
  - **Dependensi:** Task 4, Task 35
  - **Persyaratan:** 9.1, 9.2, 9.6, 11.1

- [ ] 39. Optimasi performa (frontend dan backend)
  - Pastikan halaman utama dimuat dalam <= 3 detik pada koneksi 10 Mbps (gunakan Next.js Image optimization, lazy loading)
  - Pastikan endpoint GET /api/v1/recommendations merespons dalam <= 5 detik
  - Implementasi caching artefak ML di memori saat startup FastAPI (muat sekali, gunakan berkali-kali)
  - Gunakan Next.js Server Components untuk halaman yang tidak memerlukan interaktivitas klien
  - Implementasi pagination untuk endpoint yang mengembalikan daftar data panjang
  - **Dependensi:** Task 26, Task 35
  - **Persyaratan:** 3.7, 9.2, 11.2

- [ ] 40. Uji properti keamanan API (property-based tests)
  - Tulis property test menggunakan Hypothesis untuk Properti 22: token JWT tidak valid selalu menghasilkan HTTP 401 (diperluas ke semua endpoint terproteksi)
  - Tulis property test untuk Properti 23: input tidak sesuai skema selalu menghasilkan HTTP 422 dengan detail (diperluas ke semua endpoint)
  - Tulis property test untuk Properti 24: serialisasi JSON respons API adalah round-trip yang sempurna
  - Jalankan semua property tests dan pastikan lulus
  - **Dependensi:** Task 37
  - **Persyaratan:** 10.3, 12.3, 12.5
  - **Memvalidasi: Properti 22, Properti 23, Properti 24**


---

## Fase 12: Aksesibilitas dan UI/UX

- [ ] 41. Implementasi aksesibilitas WCAG 2.1 AA (frontend)
  - Audit dan perbaiki kontras warna: pastikan rasio minimum 4.5:1 untuk semua teks utama
  - Tambahkan lt text deskriptif untuk semua gambar makanan dan ikon fungsional
  - Pastikan semua form memiliki label yang terhubung dengan benar (htmlFor / ria-label)
  - Implementasi navigasi keyboard yang lengkap (Tab, Enter, Escape) untuk semua komponen interaktif
  - Tambahkan ria-live regions untuk notifikasi dinamis (loading, error, sukses)
  - Tambahkan ole dan ria-* attributes yang sesuai untuk komponen kustom (gauge chart, badge)
  - Pastikan semua konten dalam Bahasa Indonesia (tidak ada teks hardcoded dalam bahasa lain)
  - **Dependensi:** Task 35
  - **Persyaratan:** 9.3, 9.4, 9.5

- [ ] 42. Implementasi responsivitas mobile-first (frontend)
  - Verifikasi tampilan pada lebar layar 320px (smartphone kecil) hingga 1920px (desktop besar)
  - Pastikan bottom navigation bar muncul di mobile (< 768px) dan sidebar di desktop (>= 1024px)
  - Pastikan kartu makanan, grafik, dan form dapat digunakan dengan nyaman di layar kecil
  - Uji tampilan pada orientasi portrait dan landscape di mobile
  - Pastikan touch targets minimal 44x44px untuk semua elemen interaktif di mobile
  - **Dependensi:** Task 35, Task 41
  - **Persyaratan:** 9.1, 9.3


---

## Fase 13: Dokumentasi API dan Integrasi

- [ ] 43. Konfigurasi Swagger UI dan dokumentasi API (backend)
  - Pastikan FastAPI menghasilkan dokumentasi Swagger UI yang dapat diakses di /docs
  - Tambahkan deskripsi, contoh request/response, dan kode status untuk setiap endpoint
  - Dokumentasikan format error standar: {"detail": "...", "error_code": "...", "timestamp": "..."}
  - Pastikan semua endpoint mengikuti konvensi /api/v1/{resource}
  - Verifikasi API versioning: perubahan pada /api/v2/ tidak merusak klien /api/v1/
  - **Dependensi:** Task 3, Task 26, Task 29, Task 32
  - **Persyaratan:** 12.1, 12.2, 12.4

- [ ] 44. Integrasi end-to-end frontend-backend
  - Verifikasi semua pemanggilan API dari src/lib/api.ts menggunakan header Authorization: Bearer <JWT>
  - Verifikasi CORS dikonfigurasi dengan benar di FastAPI untuk domain Vercel
  - Uji alur lengkap: registrasi → isi profil → dapatkan rekomendasi → konfirmasi konsumsi → lihat progres → catat tekanan darah
  - Pastikan semua error dari backend ditampilkan dengan pesan yang informatif di frontend
  - Verifikasi bahwa pembaruan profil langsung mempengaruhi rekomendasi berikutnya
  - **Dependensi:** Task 7, Task 11, Task 27, Task 30, Task 33, Task 35
  - **Persyaratan:** 2.8, 3.7, 9.6, 12.1


---

## Fase 14: Pengujian Komprehensif

- [ ] 45. Pengujian unit backend (FastAPI)
  - Tulis unit tests untuk semua fungsi di 
utrition_calculator.py: verifikasi rumus Mifflin-St Jeor untuk berbagai kombinasi profil
  - Tulis unit tests untuk dash_score_service.py: verifikasi formula DASH Score dengan nilai nutrisi yang diketahui
  - Tulis unit tests untuk 
utrition_validator.py: verifikasi validasi batasan komorbid CKD dan diabetes
  - Tulis unit tests untuk ecommendation_service.py: verifikasi filter pantangan, aturan anti-repetisi, dan fallback
  - Tulis unit tests untuk content_based_filter.py: verifikasi cosine similarity dan urutan hasil
  - Gunakan pytest dengan pytest-asyncio untuk endpoint async
  - Target: coverage >= 80% untuk semua service dan ML modules
  - **Dependensi:** Task 10, Task 17, Task 19, Task 21, Task 25
  - **Persyaratan:** 4.6, 8.2, 8.3

- [ ] 46. Pengujian unit frontend (Next.js)
  - Tulis unit tests menggunakan Jest + React Testing Library untuk komponen utama
  - Test DashScoreGauge: verifikasi rendering untuk setiap kategori skor
  - Test FoodItemCard: verifikasi tampilan label "⚠ Data Estimasi" saat is_estimated: true
  - Test BPWarning: verifikasi peringatan muncul untuk nilai kritis
  - Test form validasi: ProfileForm, BPForm — verifikasi pesan error untuk input tidak valid
  - Test navigasi: verifikasi redirect ke /login jika tidak terautentikasi
  - **Dependensi:** Task 11, Task 23, Task 27, Task 33, Task 35
  - **Persyaratan:** 2.2, 2.3, 2.4, 4.3, 6.2, 7.8

- [ ] 47. Pengujian integrasi API (end-to-end)
  - Tulis integration tests menggunakan httpx + pytest untuk alur lengkap:
    - Registrasi → Login → Isi Profil → Dapatkan Rekomendasi → Konfirmasi → Lihat Progres
    - Catat Tekanan Darah → Lihat Riwayat → Ekspor CSV
  - Verifikasi semua kode status HTTP yang diharapkan (201, 200, 401, 404, 422, 500)
  - Verifikasi format respons JSON sesuai skema yang didefinisikan
  - Verifikasi RLS Supabase: pengguna A tidak dapat mengakses data pengguna B
  - **Dependensi:** Task 44
  - **Persyaratan:** 10.2, 12.3, 12.5

- [ ] 48. Pengujian performa dan beban
  - Uji waktu respons endpoint GET /api/v1/recommendations dengan profil pengguna yang berbeda (target <= 5 detik)
  - Uji waktu muat halaman utama (target <= 3 detik pada koneksi 10 Mbps)
  - Simulasi 50 permintaan bersamaan ke endpoint rekomendasi (target: tidak ada degradasi > 8 detik)
  - Verifikasi caching artefak ML berfungsi (model tidak dimuat ulang setiap request)
  - **Dependensi:** Task 39, Task 44
  - **Persyaratan:** 3.7, 9.2, 11.2


---

## Fase 15: Deployment dan Konfigurasi Produksi

- [ ] 49. Deployment backend ke Railway/Render
  - Buat ackend/Dockerfile untuk containerisasi FastAPI
  - Konfigurasi environment variables di Railway/Render: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, ALLOWED_ORIGINS
  - Upload artefak ML ke Supabase Storage atau Railway Volume
  - Konfigurasi health check endpoint untuk monitoring uptime
  - Verifikasi HTTPS/TLS aktif di domain backend
  - Uji endpoint /api/v1/health di lingkungan produksi
  - **Dependensi:** Task 18, Task 37, Task 43
  - **Persyaratan:** 10.1, 11.1

- [ ] 50. Deployment frontend ke Vercel
  - Konfigurasi environment variables di Vercel: NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - Konfigurasi domain kustom (jika ada) dan verifikasi HTTPS
  - Konfigurasi Google OAuth: tambahkan domain produksi ke authorized redirect URIs di Google Cloud Console
  - Verifikasi alur autentikasi Google OAuth di lingkungan produksi
  - Uji semua halaman di lingkungan produksi
  - **Dependensi:** Task 7, Task 35, Task 49
  - **Persyaratan:** 1.7, 10.1

- [ ] 51. Konfigurasi monitoring dan logging produksi
  - Aktifkan error logging di FastAPI untuk semua request HTTP 4xx dan 5xx
  - Konfigurasi Supabase pg_cron atau scheduled function untuk menghapus log konsumsi dan riwayat tekanan darah yang lebih dari 12 bulan
  - Verifikasi RLS policies aktif dan berfungsi di lingkungan produksi
  - Dokumentasikan prosedur pemeliharaan terjadwal (maintenance window)
  - **Dependensi:** Task 49, Task 50
  - **Persyaratan:** 5.6, 6.6, 11.1, 11.4

---

## Ringkasan Dependensi Antar Fase

| Fase | Tugas | Bergantung Pada |
|------|-------|-----------------|
| 1. Infrastruktur | 1–4 | — |
| 2. Autentikasi | 5–8 | Fase 1 |
| 3. Profil Pengguna | 9–12 | Fase 1, 2 |
| 4. Database Makanan | 13–15 | Fase 1 |
| 5. ML Pipeline | 16–20 | Fase 3, 4 |
| 6. DASH Score | 21–24 | Fase 3, 5 |
| 7. Rekomendasi | 25–28 | Fase 5, 6 |
| 8. Tracker Progres | 29–31 | Fase 7 |
| 9. Tekanan Darah | 32–34 | Fase 1 |
| 10. Dashboard | 35–36 | Fase 3, 6, 7, 8, 9 |
| 11. Keamanan & Performa | 37–40 | Fase 2, 7 |
| 12. Aksesibilitas | 41–42 | Fase 10 |
| 13. Dokumentasi & Integrasi | 43–44 | Fase 7, 8, 9 |
| 14. Pengujian | 45–48 | Fase 13 |
| 15. Deployment | 49–51 | Fase 14 |

---

## Matriks Persyaratan vs Tugas

| Persyaratan | Tugas Utama |
|-------------|-------------|
| Req. 1 (Autentikasi) | 5, 6, 7, 8 |
| Req. 2 (Profil Pengguna) | 9, 10, 11, 12 |
| Req. 3 (Rekomendasi) | 17, 19, 25, 26, 27, 28 |
| Req. 4 (DASH Score) | 21, 22, 23, 24 |
| Req. 5 (Tracker Progres) | 29, 30, 31 |
| Req. 6 (Tekanan Darah) | 32, 33, 34 |
| Req. 7 (Database Makanan) | 13, 14, 15 |
| Req. 8 (ML Pipeline) | 16, 17, 18, 19, 20 |
| Req. 9 (UI/UX) | 7, 11, 27, 30, 33, 35, 41, 42 |
| Req. 10 (Keamanan) | 2, 3, 6, 37, 40 |
| Req. 11 (Performa) | 3, 37, 38, 39, 48 |
| Req. 12 (API & Integrasi) | 3, 43, 44 |

