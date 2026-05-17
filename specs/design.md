# Dokumen Desain — TensiMenu

## 1. Ikhtisar

TensiMenu adalah aplikasi web sistem rekomendasi makanan lokal harian untuk penderita hipertensi yang dibangun di atas prinsip DASH Diet (*Dietary Approaches to Stop Hypertension*). Sistem ini menjembatani kesenjangan antara panduan diet klinis internasional dengan realitas kuliner Nusantara, di mana masakan daerah (Minang, Jawa, Sunda, Batak, Bugis, Papua) kerap mengandung natrium, lemak jenuh, dan santan dalam kadar tinggi.

### Tujuan Desain

- Memberikan rekomendasi makanan lokal Indonesia yang dipersonalisasi berdasarkan profil kesehatan pengguna
- Menghitung dan menampilkan DASH Compliance Score untuk setiap sajian dan rencana makan harian
- Memungkinkan pengguna memantau progres kesehatan dan riwayat tekanan darah dari waktu ke waktu
- Menyediakan antarmuka yang responsif, aksesibel, dan mudah digunakan

### Ringkasan Temuan Riset

**DASH Diet Scoring:** Berdasarkan panduan CDC dan NIH, DASH Score dihitung berdasarkan kontribusi proporsional 7 nutrisi kunci terhadap **target harian personal** pengguna (bukan angka flat). Target dihitung dari profil pengguna menggunakan rumus Mifflin-St Jeor untuk BMR, kemudian disesuaikan berdasarkan komorbid. Formula: nutrisi positif (kalium, kalsium, magnesium, serat) = `min(aktual/target, 1.0)`; nutrisi negatif (natrium, lemak jenuh) = `max(1 - aktual/batas, 0.0)`; DASH_Score = rata-rata tertimbang × 100.

**Content-Based Filtering:** Setiap item makanan direpresentasikan sebagai vektor 7 fitur nutrisi (dinormalisasi Min-Max). Setiap pengguna direpresentasikan sebagai vektor target nutrisi personal. Cosine similarity dihitung antara keduanya. Filter komorbid dan pantangan diterapkan **sebelum** perhitungan similarity. Makanan yang dikonsumsi dalam 3 hari terakhir diturunkan prioritasnya (anti-repetisi).

**Data Estimasi Makanan Lokal:** Untuk makanan lokal yang tidak memiliki data nutrisi di sumber primer (DKPI/USDA/Nutrisurvey), digunakan makanan referensi dalam kategori yang sama sebagai proxy (contoh: Gulai Tambusu → Gulai Kambing; Soto Lamongan → Soto Ayam). Item tersebut diberi flag `data_estimasi: true` dan ditampilkan label "⚠ Data Estimasi" di antarmuka.

**Arsitektur Next.js + FastAPI + Supabase:** Pola yang umum digunakan adalah Next.js sebagai frontend dengan API routes untuk BFF (Backend for Frontend), FastAPI sebagai backend ML/bisnis logic, dan Supabase sebagai database PostgreSQL terkelola dengan Row Level Security bawaan.

---

## 2. Arsitektur Sistem

### 2.1 Arsitektur High-Level

TensiMenu menggunakan arsitektur tiga lapis yang dipisahkan secara jelas:

`
┌─────────────────────────────────────────────────────────────────┐
│                        PENGGUNA (Browser)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────────┐
│                   FRONTEND LAYER (Vercel)                        │
│              Next.js 14 + TypeScript + Tailwind CSS              │
│         NextAuth.js (Autentikasi) │ React Components             │
│         App Router │ Server Components │ Client Components       │
└──────────┬──────────────────────────────────┬───────────────────┘
           │ REST API (HTTPS/JWT)              │ Supabase Client
           │                                  │ (RLS)
┌──────────▼──────────────┐      ┌────────────▼───────────────────┐
│   BACKEND LAYER         │      │   DATABASE LAYER               │
│   (Railway/Render)      │      │   (Supabase Cloud)             │
│   FastAPI (Python)      │◄────►│   PostgreSQL + RLS             │
│   ML Pipeline           │      │   Auth (Supabase Auth)         │
│   Validator Nutrisi     │      │   Storage (Artefak ML)         │
│   REST API v1           │      │                                │
└──────────┬──────────────┘      └────────────────────────────────┘
           │
┌──────────▼──────────────┐
│   ML ARTIFACTS          │
│   (Supabase Storage /   │
│    Railway Volume)      │
│   Model Weights (.pkl)  │
│   Feature Scaler        │
│   Item Matrix           │
└─────────────────────────┘
`

### 2.2 Diagram Alur Data Utama

`
Pengguna
  │
  ├─[1. Registrasi/Login]──► NextAuth.js ──► Supabase Auth ──► JWT Token
  │
  ├─[2. Isi Profil]──► Next.js Form ──► FastAPI /api/v1/profile ──► Supabase DB
  │
  ├─[3. Minta Rekomendasi]──► Next.js ──► FastAPI /api/v1/recommendations
  │                                              │
  │                                    ┌─────────▼──────────┐
  │                                    │  ML Pipeline        │
  │                                    │  1. Load profil     │
  │                                    │  2. Buat user vector│
  │                                    │  3. Cosine similarity│
  │                                    │  4. Filter nutrisi  │
  │                                    │  5. Hitung DASH Score│
  │                                    └─────────┬──────────┘
  │                                              │
  │                                    Rencana Makan + DASH Score
  │
  ├─[4. Catat Konsumsi]──► FastAPI /api/v1/logs ──► Supabase DB
  │
  └─[5. Lihat Progres]──► FastAPI /api/v1/progress ──► Supabase DB ──► Grafik
`

### 2.3 Keputusan Arsitektur

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Frontend Framework | Next.js 14 (App Router) | SSR untuk SEO, Server Components untuk performa, ekosistem React yang matang |
| Backend Framework | FastAPI (Python) | Native Python untuk ML pipeline, async support, auto-dokumentasi Swagger |
| Database | Supabase (PostgreSQL) | Row Level Security bawaan, realtime subscriptions, managed service |
| Autentikasi | NextAuth.js + Supabase Auth | Integrasi OAuth Google mudah, JWT management, session handling |
| ML Library | scikit-learn | Reproducible dengan random_state, cosine_similarity built-in, ringan untuk inferensi |
| Deployment Frontend | Vercel | Zero-config Next.js deployment, edge network global |
| Deployment Backend | Railway/Render | Docker support, persistent volumes untuk artefak ML |

---

## 3. Komponen dan Antarmuka

### 3.1 Komponen Frontend (Next.js)

`
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx        # Halaman Login
│   │   └── register/page.tsx     # Halaman Registrasi
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Layout dengan navigasi
│   │   ├── page.tsx              # Beranda (DASH Score harian)
│   │   ├── recommendations/
│   │   │   └── page.tsx          # Halaman Rekomendasi Harian
│   │   ├── tracker/
│   │   │   └── page.tsx          # Halaman Tracker Progres
│   │   ├── blood-pressure/
│   │   │   └── page.tsx          # Halaman Riwayat Tekanan Darah
│   │   └── profile/
│   │       └── page.tsx          # Halaman Profil Pengguna
│   └── api/
│       └── auth/[...nextauth]/   # NextAuth.js handler
├── components/
│   ├── ui/                       # Komponen UI dasar (Button, Input, Card)
│   ├── auth/                     # AuthForm, LoginForm, RegisterForm
│   ├── profile/                  # ProfileForm, ComorbidSelector
│   ├── recommendations/          # MealPlanCard, FoodItemCard, AlternativeList
│   ├── dash-score/               # DashScoreGauge, ScoreBadge, ImprovementTips
│   ├── tracker/                  # ProgressChart, WeeklySummary, ComplianceStats
│   └── blood-pressure/           # BPForm, BPChart, BPWarning
├── lib/
│   ├── api.ts                    # Fungsi pemanggil FastAPI backend
│   ├── auth.ts                   # Konfigurasi NextAuth.js
│   └── supabase.ts               # Supabase client
└── types/
    └── index.ts                  # TypeScript type definitions
`

### 3.2 Komponen Backend (FastAPI)

`
backend/
├── main.py                       # Entry point FastAPI
├── api/
│   └── v1/
│       ├── router.py             # Agregasi semua router
│       ├── auth.py               # Endpoint autentikasi
│       ├── profile.py            # Endpoint profil pengguna
│       ├── recommendations.py    # Endpoint rekomendasi ML
│       ├── dash_score.py         # Endpoint kalkulasi DASH Score
│       ├── logs.py               # Endpoint log konsumsi
│       ├── progress.py           # Endpoint tracker progres
│       ├── blood_pressure.py     # Endpoint riwayat tekanan darah
│       ├── food_database.py      # Endpoint database makanan
│       └── health.py             # Endpoint health check
├── core/
│   ├── config.py                 # Konfigurasi aplikasi (env vars)
│   ├── security.py               # JWT validation, password hashing
│   ├── rate_limiter.py           # Rate limiting middleware
│   └── database.py               # Koneksi Supabase/PostgreSQL
├── models/
│   ├── user.py                   # Pydantic models untuk User
│   ├── profile.py                # Pydantic models untuk Profil
│   ├── food.py                   # Pydantic models untuk Makanan
│   ├── recommendation.py         # Pydantic models untuk Rekomendasi
│   └── blood_pressure.py         # Pydantic models untuk Tekanan Darah
├── services/
│   ├── recommendation_service.py # Logika bisnis rekomendasi
│   ├── dash_score_service.py     # Logika kalkulasi DASH Score
│   ├── nutrition_validator.py    # Validasi batasan nutrisi
│   └── progress_service.py       # Logika tracker progres
└── ml/
    ├── pipeline.py               # Pipeline ML utama
    ├── content_based_filter.py   # Implementasi CBF
    ├── feature_engineering.py    # Pembuatan vektor fitur
    └── model_loader.py           # Loader artefak model
`

### 3.3 Antarmuka Antar Komponen

#### Frontend → Backend (REST API)

Semua permintaan dari Next.js ke FastAPI menggunakan:
- Header: Authorization: Bearer <JWT_TOKEN>
- Content-Type: pplication/json
- Base URL: NEXT_PUBLIC_API_URL/api/v1

#### Backend → Database (Supabase)

FastAPI menggunakan supabase-py client dengan service role key untuk operasi server-side. Row Level Security (RLS) diterapkan di level database untuk isolasi data per pengguna.

#### Autentikasi Flow

`
Browser ──► NextAuth.js ──► Supabase Auth (JWT)
                │
                └──► FastAPI (validasi JWT via Supabase public key)
`

---

## 4. Model Data

### 4.1 Skema Database Supabase (PostgreSQL)

#### Tabel: users (dikelola Supabase Auth)

`sql
-- Tabel ini dikelola otomatis oleh Supabase Auth
-- Tersedia di schema auth.users
-- Field utama: id (uuid), email, created_at, last_sign_in_at
`

#### Tabel: user_profiles

`sql
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       VARCHAR(255) NOT NULL,
    age             INTEGER NOT NULL CHECK (age BETWEEN 18 AND 90),
    gender          VARCHAR(10) NOT NULL CHECK (gender IN ('laki-laki', 'perempuan')),
    weight_kg       DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
    height_cm       DECIMAL(5,2) NOT NULL CHECK (height_cm > 0),
    systolic_bp     INTEGER CHECK (systolic_bp BETWEEN 70 AND 250),
    diastolic_bp    INTEGER CHECK (diastolic_bp BETWEEN 40 AND 150),
    comorbidities   TEXT[] DEFAULT '{}',  -- ['diabetes_t2', 'ckd', 'dyslipidemia', 'obesity']
    food_restrictions TEXT[] DEFAULT '{}', -- ['no_pork', 'nut_allergy', ...]
    regional_prefs  TEXT[] DEFAULT '{}',  -- ['jawa', 'sunda', 'minang', ...]
    -- Target nutrisi personal dihitung dari profil (Req. 2.10)
    daily_targets   JSONB,                -- {"sodium_mg": 1500, "potassium_mg": 2000, ...}
    is_complete     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own profile"
    ON user_profiles FOR ALL
    USING (auth.uid() = user_id);
`

#### Tabel: ood_items

`sql
CREATE TABLE food_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    region          VARCHAR(100) NOT NULL,  -- 'Minang', 'Jawa', 'Sunda', 'Batak', 'Bugis', 'Papua'
    category        VARCHAR(50) NOT NULL,   -- 'sarapan', 'makan_siang', 'makan_malam', 'camilan'
    serving_size_g  DECIMAL(7,2) NOT NULL,
    -- Nutrisi per 100 gram
    energy_kcal     DECIMAL(8,2) NOT NULL CHECK (energy_kcal >= 0),
    protein_g       DECIMAL(7,3) NOT NULL CHECK (protein_g >= 0),
    fat_total_g     DECIMAL(7,3) NOT NULL CHECK (fat_total_g >= 0),
    fat_saturated_g DECIMAL(7,3) NOT NULL CHECK (fat_saturated_g >= 0),
    carbs_g         DECIMAL(7,3) NOT NULL CHECK (carbs_g >= 0),
    fiber_g         DECIMAL(7,3) NOT NULL CHECK (fiber_g >= 0),
    sodium_mg       DECIMAL(8,2) NOT NULL CHECK (sodium_mg >= 0),
    potassium_mg    DECIMAL(8,2) NOT NULL CHECK (potassium_mg >= 0),
    calcium_mg      DECIMAL(8,2) NOT NULL CHECK (calcium_mg >= 0),
    magnesium_mg    DECIMAL(8,2) NOT NULL CHECK (magnesium_mg >= 0),
    glycemic_index  INTEGER,               -- NULL jika tidak tersedia
    data_source     VARCHAR(50) NOT NULL CHECK (data_source IN ('DKPI', 'USDA', 'Nutrisurvey', 'Estimasi')),
    -- Field untuk data estimasi (Req. 7.7)
    is_estimated    BOOLEAN DEFAULT FALSE,
    reference_food  VARCHAR(255),          -- Nama makanan yang digunakan sebagai proxy
    confidence_level VARCHAR(10) CHECK (confidence_level IN ('tinggi', 'sedang', 'rendah')),
    image_url       TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_items_region ON food_items(region);
CREATE INDEX idx_food_items_category ON food_items(category);
CREATE INDEX idx_food_items_active ON food_items(is_active);
`

#### Tabel: ood_items_audit_log

`sql
CREATE TABLE food_items_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id    UUID NOT NULL REFERENCES food_items(id),
    changed_by      UUID REFERENCES auth.users(id),
    changed_at      TIMESTAMPTZ DEFAULT NOW(),
    old_data        JSONB NOT NULL,
    new_data        JSONB NOT NULL,
    change_reason   TEXT
);
`

#### Tabel: meal_plans

`sql
CREATE TABLE meal_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_date       DATE NOT NULL,
    breakfast_items UUID[] NOT NULL DEFAULT '{}',
    lunch_items     UUID[] NOT NULL DEFAULT '{}',
    dinner_items    UUID[] NOT NULL DEFAULT '{}',
    snack_items     UUID[] NOT NULL DEFAULT '{}',
    total_dash_score DECIMAL(5,2) CHECK (total_dash_score BETWEEN 0 AND 100),
    total_sodium_mg  DECIMAL(8,2),
    total_potassium_mg DECIMAL(8,2),
    total_calories_kcal DECIMAL(8,2),
    is_confirmed    BOOLEAN DEFAULT FALSE,
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_date)
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own meal plans"
    ON meal_plans FOR ALL
    USING (auth.uid() = user_id);
`

#### Tabel: consumption_logs

`sql
CREATE TABLE consumption_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_plan_id    UUID REFERENCES meal_plans(id),
    log_date        DATE NOT NULL,
    dash_score      DECIMAL(5,2) CHECK (dash_score BETWEEN 0 AND 100),
    sodium_mg       DECIMAL(8,2),
    potassium_mg    DECIMAL(8,2),
    calories_kcal   DECIMAL(8,2),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own logs"
    ON consumption_logs FOR ALL
    USING (auth.uid() = user_id);

-- Retensi data: hapus log lebih dari 12 bulan (via pg_cron atau scheduled function)
`

#### Tabel: lood_pressure_records

`sql
CREATE TABLE blood_pressure_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    systolic_mmhg   INTEGER NOT NULL CHECK (systolic_mmhg BETWEEN 70 AND 250),
    diastolic_mmhg  INTEGER NOT NULL CHECK (diastolic_mmhg BETWEEN 40 AND 150),
    measured_at     TIMESTAMPTZ NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blood_pressure_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own BP records"
    ON blood_pressure_records FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_bp_user_date ON blood_pressure_records(user_id, measured_at DESC);
`

#### Tabel: ailed_login_attempts

`sql
CREATE TABLE failed_login_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address      INET NOT NULL,
    attempt_count   INTEGER DEFAULT 1,
    first_attempt   TIMESTAMPTZ DEFAULT NOW(),
    blocked_until   TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address);
`

### 4.2 Model Data Pydantic (FastAPI)

#### UserProfile

`python
class UserProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=18, le=90)
    gender: Literal["laki-laki", "perempuan"]
    weight_kg: float = Field(..., gt=0)
    height_cm: float = Field(..., gt=0)
    systolic_bp: Optional[int] = Field(None, ge=70, le=250)
    diastolic_bp: Optional[int] = Field(None, ge=40, le=150)
    comorbidities: List[str] = []
    food_restrictions: List[str] = []
    regional_prefs: List[str] = []
`

#### FoodItem

`python
class FoodItem(BaseModel):
    id: UUID
    name: str
    region: str
    category: str
    serving_size_g: float
    energy_kcal: float
    protein_g: float
    fat_total_g: float
    fat_saturated_g: float
    carbs_g: float
    fiber_g: float
    sodium_mg: float
    potassium_mg: float
    calcium_mg: float
    magnesium_mg: float
    glycemic_index: Optional[int]
    data_source: Literal["DKPI", "USDA", "Nutrisurvey", "Estimasi"]
    is_estimated: bool = False
    reference_food: Optional[str] = None   # Makanan proxy jika is_estimated=True
    confidence_level: Optional[str] = None # 'tinggi', 'sedang', 'rendah'
    dash_score: Optional[float] = None  # Dihitung saat query

    class Config:
        json_encoders = {UUID: str}
`

#### MealPlan

`python
class MealPlanResponse(BaseModel):
    id: UUID
    plan_date: date
    breakfast: List[FoodItemWithDash]
    lunch: List[FoodItemWithDash]
    dinner: List[FoodItemWithDash]
    snacks: List[FoodItemWithDash]
    total_dash_score: float
    total_sodium_mg: float
    total_potassium_mg: float
    total_calories_kcal: float
    nutrition_warnings: List[str] = []
`

#### BloodPressureRecord

`python
class BloodPressureCreate(BaseModel):
    systolic_mmhg: int = Field(..., ge=70, le=250)
    diastolic_mmhg: int = Field(..., ge=40, le=150)
    measured_at: datetime
    notes: Optional[str] = None

class BloodPressureResponse(BloodPressureCreate):
    id: UUID
    user_id: UUID
    is_critical: bool  # True jika sistolik >= 180 atau diastolik >= 120
    created_at: datetime
`

---

## 5. Pipeline Machine Learning (Content-Based Filtering)

### 5.1 Gambaran Umum Pipeline

Pipeline ML TensiMenu menggunakan pendekatan Content-Based Filtering berbasis cosine similarity antara vektor kebutuhan nutrisi pengguna dan vektor profil nutrisi setiap item makanan.

`
┌─────────────────────────────────────────────────────────────────┐
│                    FASE PELATIHAN (Offline)                      │
│                    (Google Colab / Railway)                       │
│                                                                   │
│  Dataset Makanan (DKPI + USDA + Nutrisurvey)                     │
│         │                                                         │
│         ▼                                                         │
│  Feature Engineering                                              │
│  [sodium, potassium, calcium, magnesium, fiber,                   │
│   fat_saturated, fat_total] per 100g                             │
│         │                                                         │
│         ▼                                                         │
│  StandardScaler (fit pada training data)                          │
│         │                                                         │
│         ▼                                                         │
│  Item Feature Matrix (N_items x 7_features)                      │
│         │                                                         │
│         ▼                                                         │
│  Simpan: scaler.pkl, item_matrix.npy, food_ids.json              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FASE INFERENSI (Online)                        │
│                    (FastAPI Backend)                              │
│                                                                   │
│  Profil Pengguna                                                  │
│         │                                                         │
│         ▼                                                         │
│  Buat User Nutrition Vector                                       │
│  (target harian DASH disesuaikan komorbid)                        │
│         │                                                         │
│         ▼                                                         │
│  Normalisasi dengan scaler.pkl                                    │
│         │                                                         │
│         ▼                                                         │
│  Hitung Cosine Similarity (user_vector vs item_matrix)            │
│         │                                                         │
│         ▼                                                         │
│  Filter: pantangan makanan, preferensi regional                   │
│         │                                                         │
│         ▼                                                         │
│  Filter Nutrisi: batasan komorbid (CKD, diabetes)                 │
│         │                                                         │
│         ▼                                                         │
│  Pilih Top-K per kategori (sarapan, siang, malam, camilan)        │
│         │                                                         │
│         ▼                                                         │
│  Hitung DASH Score per item dan agregat                           │
│         │                                                         │
│         ▼                                                         │
│  Kembalikan Rencana Makan + DASH Score                            │
└─────────────────────────────────────────────────────────────────┘
`

### 5.2 Feature Engineering

#### Vektor Fitur Item Makanan (7 dimensi)

`python
DASH_FEATURES = [
    'sodium_mg',        # Negatif: lebih rendah lebih baik
    'potassium_mg',     # Positif: lebih tinggi lebih baik
    'calcium_mg',       # Positif
    'magnesium_mg',     # Positif
    'fiber_g',          # Positif
    'fat_saturated_g',  # Negatif
    'fat_total_g',      # Negatif
]

# Nilai per 100 gram, dinormalisasi dengan StandardScaler
`

#### Vektor Kebutuhan Nutrisi Pengguna

Target harian DASH Diet dihitung secara personal menggunakan rumus Mifflin-St Jeor (Req. 2.10):

```python
def calculate_personal_targets(profile: UserProfile) -> dict:
    """
    Hitung target nutrisi harian personal berdasarkan profil pengguna.
    Menggunakan rumus Mifflin-St Jeor untuk BMR.
    Hasil disimpan ke database bersama profil (Req. 2.11).
    """
    # Hitung BMR dengan Mifflin-St Jeor
    if profile.gender == 'laki-laki':
        bmr = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5
    else:
        bmr = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) - 161

    # Target dasar DASH
    targets = {
        'sodium_mg': 2300,
        'potassium_mg': 4000,   # Tengah rentang 3500-4700
        'calcium_mg': 1200 if profile.age > 50 else 1000,
        'magnesium_mg': 400 if profile.gender == 'laki-laki' else 310,
        'fiber_g': 38 if profile.gender == 'laki-laki' else 25,
        'fat_saturated_g': round(bmr * 0.07 / 9, 1),  # 7% dari energi
        'fat_total_g': round(bmr * 0.27 / 9, 1),       # 27% dari energi
        'energy_kcal': round(bmr),
    }

    # Penyesuaian untuk CKD (Req. 3.5)
    if 'ckd' in profile.comorbidities:
        targets['sodium_mg'] = 1500
        targets['potassium_mg'] = 2000   # Batasi < 2000 mg
        targets['phosphorus_mg'] = 800

    # Penyesuaian untuk hipertensi berat (Req. 2.10)
    if profile.systolic_bp and profile.systolic_bp >= 150:
        targets['sodium_mg'] = 1500

    return targets


def build_user_nutrition_vector(targets: dict) -> np.ndarray:
    """
    Konversi target nutrisi personal ke vektor numpy untuk cosine similarity.
    """
    return np.array([targets[f] for f in DASH_FEATURES])
```

### 5.3 Algoritma Cosine Similarity

`python
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import numpy as np

class ContentBasedFilter:
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.item_matrix = None
        self.food_ids = None

    def fit(self, food_items: List[FoodItem]) -> None:
        """Latih scaler dan buat item matrix. Dipanggil saat training."""
        features = np.array([
            [item.sodium_mg, item.potassium_mg, item.calcium_mg,
             item.magnesium_mg, item.fiber_g, item.fat_saturated_g,
             item.fat_total_g]
            for item in food_items
        ])
        self.item_matrix = self.scaler.fit_transform(features)
        self.food_ids = [item.id for item in food_items]

    def recommend(
        self,
        user_vector: np.ndarray,
        food_items: List[FoodItem],
        top_k: int = 10,
        filters: Optional[RecommendationFilters] = None
    ) -> List[FoodItem]:
        """
        Hasilkan rekomendasi berdasarkan cosine similarity.
        Deterministik: hasil yang sama untuk input yang sama.
        """
        user_vec_scaled = self.scaler.transform(user_vector.reshape(1, -1))
        similarities = cosine_similarity(user_vec_scaled, self.item_matrix)[0]

        # Urutkan berdasarkan similarity (deterministik dengan argsort stable)
        ranked_indices = np.argsort(similarities)[::-1]

        # Terapkan filter
        filtered_items = self._apply_filters(
            [food_items[i] for i in ranked_indices],
            filters
        )

        return filtered_items[:top_k]
`

### 5.4 Formula DASH Score

DASH Score dihitung berdasarkan target nutrisi **personal** pengguna (bukan angka flat), sesuai Req. 4.1:

```python
def calculate_dash_score(
    nutrition_per_serving: dict,
    serving_size_g: float,
    user_targets: dict  # Target personal dari Profil_Pengguna (Req. 2.10)
) -> float:
    """
    Hitung DASH Score (0-100) untuk satu item makanan.
    Formula deterministik: input yang sama + profil yang sama = output yang sama.

    Nutrisi positif (kalium, kalsium, magnesium, serat):
        skor = min(nilai_aktual / target_personal, 1.0)

    Nutrisi negatif (natrium, lemak jenuh):
        skor = max(1.0 - nilai_aktual / batas_personal, 0.0)

    DASH_Score = rata-rata tertimbang semua skor × 100
    """
    NUTRIENT_WEIGHTS = {
        'sodium_mg':        {'direction': 'lower',  'weight': 0.25},
        'potassium_mg':     {'direction': 'higher', 'weight': 0.20},
        'calcium_mg':       {'direction': 'higher', 'weight': 0.15},
        'magnesium_mg':     {'direction': 'higher', 'weight': 0.15},
        'fiber_g':          {'direction': 'higher', 'weight': 0.10},
        'fat_saturated_g':  {'direction': 'lower',  'weight': 0.10},
        'fat_total_g':      {'direction': 'lower',  'weight': 0.05},
    }

    total_score = 0.0
    total_weight = sum(v['weight'] for v in NUTRIENT_WEIGHTS.values())

    for nutrient, config in NUTRIENT_WEIGHTS.items():
        value = nutrition_per_serving.get(nutrient, 0)
        target = user_targets.get(nutrient, 1)  # Gunakan target personal
        weight = config['weight']

        if config['direction'] == 'higher':
            contribution = min(value / target, 1.0)
        else:
            if value <= target:
                contribution = 1.0
            else:
                contribution = max(0.0, 1.0 - (value - target) / target)

        total_score += contribution * weight

    return round((total_score / total_weight) * 100, 1)


def calculate_daily_dash_score(
    food_items_with_portions: List[dict],  # [{"item": FoodItem, "serving_g": float}]
    user_targets: dict
) -> float:
    """
    Hitung DASH Score agregat harian sebagai rata-rata tertimbang berdasarkan porsi (gram).
    DASH_Score_harian = Σ(DASH_Score_item × porsi_gram) / Σ(porsi_gram)
    """
    total_weighted = sum(
        calculate_dash_score(item["item"].nutrition_per_serving, item["serving_g"], user_targets)
        * item["serving_g"]
        for item in food_items_with_portions
    )
    total_portions = sum(item["serving_g"] for item in food_items_with_portions)
    return round(total_weighted / total_portions, 1) if total_portions > 0 else 0.0
```

### 5.5 Validator Nutrisi

`python
class NutritionValidator:
    """
    Memvalidasi bahwa rencana makan memenuhi batasan nutrisi DASH
    dan batasan khusus komorbid.
    """

    DAILY_LIMITS = {
        'sodium_mg': {'max': 2300},
        'potassium_mg': {'min': 3500, 'max': 4700},
    }

    COMORBID_LIMITS = {
        'ckd': {
            'potassium_mg': {'max': 2000},
            'phosphorus_mg': {'max': 800},
        },
        'diabetes_t2': {
            'glycemic_index': {'max': 55},  # Prioritas GI rendah
        }
    }

    def validate_meal_plan(
        self,
        meal_plan: MealPlan,
        profile: UserProfile
    ) -> ValidationResult:
        warnings = []
        total_nutrients = self._sum_nutrients(meal_plan)

        # Validasi DASH standar
        if total_nutrients['sodium_mg'] > self.DAILY_LIMITS['sodium_mg']['max']:
            warnings.append(f"Total natrium {total_nutrients['sodium_mg']:.0f} mg melebihi batas 2.300 mg")

        # Validasi komorbid
        for comorbid in profile.comorbidities:
            if comorbid in self.COMORBID_LIMITS:
                for nutrient, limits in self.COMORBID_LIMITS[comorbid].items():
                    value = total_nutrients.get(nutrient, 0)
                    if 'max' in limits and value > limits['max']:
                        warnings.append(f"Perhatian {comorbid}: {nutrient} = {value:.0f}")

        return ValidationResult(is_valid=len(warnings) == 0, warnings=warnings)
`

### 5.6 Reprodusibilitas Model

Untuk memastikan reprodusibilitas (Persyaratan 8.3):

`python
# Saat training
np.random.seed(42)
random.seed(42)

# Simpan artefak dengan versi
model_artifacts = {
    'scaler': scaler,           # StandardScaler fitted
    'item_matrix': item_matrix, # np.ndarray
    'food_ids': food_ids,       # List[UUID]
    'version': '1.0.0',
    'trained_at': datetime.utcnow().isoformat(),
    'random_state': 42,
    'n_items': len(food_ids),
}
joblib.dump(model_artifacts, 'model_v1.0.0.pkl')
`

---

## 6. Desain REST API (FastAPI)

### 6.1 Konvensi Umum

- Base URL: /api/v1
- Format respons: JSON
- Autentikasi: Bearer JWT token di header Authorization
- Versi API: path-based (/api/v1/, /api/v2/)
- Error format standar:

`json
{
  "detail": "Pesan kesalahan yang dapat dibaca manusia",
  "error_code": "KODE_ERROR_SPESIFIK",
  "timestamp": "2024-01-15T10:30:00Z"
}
`

### 6.2 Endpoint Autentikasi

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/auth/register | Registrasi pengguna baru | Tidak |
| POST | /api/v1/auth/login | Login dengan email/password | Tidak |
| POST | /api/v1/auth/logout | Logout dan invalidasi sesi | Ya |
| POST | /api/v1/auth/reset-password | Kirim email reset password | Tidak |
| POST | /api/v1/auth/refresh | Refresh JWT token | Ya |

**POST /api/v1/auth/register**
`json
// Request
{
  "full_name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "SecurePass123!"
}

// Response 201
{
  "user_id": "uuid",
  "email": "budi@example.com",
  "message": "Registrasi berhasil. Silakan lengkapi profil Anda."
}

// Response 409 (email duplikat)
{
  "detail": "Email sudah terdaftar",
  "error_code": "EMAIL_ALREADY_EXISTS"
}
`

### 6.3 Endpoint Profil Pengguna

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/profile | Ambil profil pengguna | Ya |
| POST | /api/v1/profile | Buat profil baru | Ya |
| PUT | /api/v1/profile | Perbarui profil | Ya |

**POST /api/v1/profile**
`json
// Request
{
  "full_name": "Budi Santoso",
  "age": 55,
  "gender": "laki-laki",
  "weight_kg": 75.5,
  "height_cm": 168.0,
  "systolic_bp": 145,
  "diastolic_bp": 90,
  "comorbidities": ["diabetes_t2"],
  "food_restrictions": ["no_pork"],
  "regional_prefs": ["jawa", "sunda"]
}

// Response 201
{
  "id": "uuid",
  "user_id": "uuid",
  "is_complete": true,
  "created_at": "2024-01-15T10:30:00Z"
}

// Response 422 (validasi gagal)
{
  "detail": [
    {"loc": ["body", "age"], "msg": "Usia harus berada di antara 18 hingga 90 tahun", "type": "value_error"}
  ]
}
`

### 6.4 Endpoint Rekomendasi

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/recommendations | Dapatkan rencana makan harian | Ya |
| GET | /api/v1/recommendations/{food_id}/alternatives | Dapatkan alternatif makanan | Ya |
| POST | /api/v1/recommendations/confirm | Konfirmasi konsumsi rencana makan | Ya |

**GET /api/v1/recommendations**
`json
// Response 200
{
  "plan_date": "2024-01-15",
  "breakfast": [
    {
      "id": "uuid",
      "name": "Bubur Ayam Jawa",
      "region": "Jawa",
      "serving_size_g": 250,
      "dash_score": 72.5,
      "dash_category": "Baik",
      "nutrition_summary": {
        "energy_kcal": 185,
        "sodium_mg": 420,
        "potassium_mg": 310,
        "fiber_g": 2.1
      }
    }
  ],
  "lunch": [...],
  "dinner": [...],
  "snacks": [...],
  "total_dash_score": 68.3,
  "total_sodium_mg": 1850,
  "total_potassium_mg": 3720,
  "total_calories_kcal": 1950,
  "nutrition_warnings": []
}
`

### 6.5 Endpoint DASH Score

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/dash-score | Hitung DASH Score untuk daftar makanan | Ya |
| GET | /api/v1/dash-score/daily | DASH Score harian pengguna | Ya |

**POST /api/v1/dash-score**
`json
// Request
{
  "food_items": [
    {"food_id": "uuid", "serving_size_g": 250},
    {"food_id": "uuid", "serving_size_g": 150}
  ]
}

// Response 200
{
  "items": [
    {"food_id": "uuid", "dash_score": 72.5, "dash_category": "Baik"},
    {"food_id": "uuid", "dash_score": 45.0, "dash_category": "Cukup"}
  ],
  "aggregate_dash_score": 61.2,
  "aggregate_category": "Baik"
}
`

### 6.6 Endpoint Tracker Progres

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/progress | Ringkasan progres pengguna | Ya |
| GET | /api/v1/progress/trend | Tren DASH Score (7/30/90 hari) | Ya |
| GET | /api/v1/progress/weekly-summary | Ringkasan mingguan | Ya |

**GET /api/v1/progress/trend?period=30**
`json
// Response 200
{
  "period_days": 30,
  "data_points": [
    {"date": "2024-01-01", "dash_score": 65.2, "sodium_mg": 1920},
    {"date": "2024-01-02", "dash_score": 71.0, "sodium_mg": 1750}
  ],
  "compliance_percentage": 73.3,
  "average_dash_score": 67.8
}
`

### 6.7 Endpoint Riwayat Tekanan Darah

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | /api/v1/blood-pressure | Catat tekanan darah baru | Ya |
| GET | /api/v1/blood-pressure | Daftar riwayat tekanan darah | Ya |
| GET | /api/v1/blood-pressure/export | Ekspor CSV | Ya |

**POST /api/v1/blood-pressure**
`json
// Request
{
  "systolic_mmhg": 145,
  "diastolic_mmhg": 92,
  "measured_at": "2024-01-15T08:30:00Z",
  "notes": "Setelah olahraga pagi"
}

// Response 201
{
  "id": "uuid",
  "systolic_mmhg": 145,
  "diastolic_mmhg": 92,
  "measured_at": "2024-01-15T08:30:00Z",
  "is_critical": false,
  "created_at": "2024-01-15T08:31:00Z"
}
`

### 6.8 Endpoint Sistem

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/health | Health check sistem | Tidak |
| GET | /docs | Swagger UI dokumentasi | Tidak |

**GET /api/v1/health**
`json
// Response 200
{
  "status": "healthy",
  "database": "connected",
  "ml_model": "loaded",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
`

---

## 7. Alur Autentikasi

### 7.1 Alur Registrasi

`
Pengguna                Next.js              FastAPI           Supabase Auth
   │                       │                    │                    │
   ├──[Isi form]──────────►│                    │                    │
   │                       ├──[POST /register]─►│                    │
   │                       │                    ├──[Create user]────►│
   │                       │                    │◄──[user_id]────────┤
   │                       │                    ├──[Hash password]   │
   │                       │                    ├──[Save to DB]      │
   │                       │◄──[201 Created]────┤                    │
   ├◄──[Redirect /profile]─┤                    │                    │
`

### 7.2 Alur Login (Email/Password)

`
Pengguna                Next.js              Supabase Auth        FastAPI
   │                       │                    │                    │
   ├──[Email + Password]──►│                    │                    │
   │                       ├──[signIn()]────────►│                    │
   │                       │◄──[JWT Token]───────┤                    │
   │                       ├──[Set session]      │                    │
   │                       ├──[API call + JWT]──────────────────────►│
   │                       │                    │  ├──[Verify JWT]──►│
   │                       │                    │  │◄──[Valid]────────┤
   │                       │◄──[Protected data]─────────────────────┤
   ├◄──[Dashboard]─────────┤                    │                    │
`

### 7.3 Alur Login Google OAuth

`
Pengguna                Next.js              Google OAuth         Supabase Auth
   │                       │                    │                    │
   ├──[Klik "Login Google"]►│                    │                    │
   │                       ├──[signIn('google')]►│                    │
   │◄──[Redirect Google]───┤                    │                    │
   ├──[Izinkan akses]──────────────────────────►│                    │
   │◄──[Auth code]─────────────────────────────┤                    │
   │                       ├──[Exchange code]──────────────────────►│
   │                       │◄──[JWT Token]──────────────────────────┤
   ├◄──[Dashboard]─────────┤                    │                    │
`

### 7.4 Konfigurasi NextAuth.js

`	ypescript
// lib/auth.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials!.email,
          password: credentials!.password,
        })
        if (error || !data.user) return null
        return { id: data.user.id, email: data.user.email, token: data.session.access_token }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.accessToken = user.token
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 menit (Persyaratan 1.6)
  },
  pages: {
    signIn: "/login",
    error: "/login",
  }
}
`

### 7.5 Validasi JWT di FastAPI

`python
# core/security.py
from jose import JWTError, jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(token: str = Security(security)) -> dict:
    """
    Validasi JWT token dari Supabase.
    Mengembalikan HTTP 401 untuk token tidak valid atau kedaluwarsa.
    """
    try:
        payload = jwt.decode(
            token.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token tidak valid")
        return {"user_id": user_id, "email": payload.get("email")}
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token tidak valid atau kedaluwarsa"
        )
`

---

## 8. Desain Antarmuka Pengguna

### 8.1 Halaman Login dan Registrasi

`
┌─────────────────────────────────────────┐
│           TensiMenu Logo                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Email                          │    │
│  │  [________________________]     │    │
│  │  Kata Sandi                     │    │
│  │  [________________________]     │    │
│  │                                 │    │
│  │  [    Masuk    ]                │    │
│  │                                 │    │
│  │  ─────── atau ───────           │    │
│  │                                 │    │
│  │  [G  Masuk dengan Google  ]     │    │
│  └─────────────────────────────────┘    │
│  Belum punya akun? Daftar di sini       │
└─────────────────────────────────────────┘
`

### 8.2 Halaman Beranda (Dashboard)

`
┌─────────────────────────────────────────────────────────┐
│  TensiMenu    [Beranda] [Rekomendasi] [Tracker] [Profil] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Selamat pagi, Budi!  📅 Senin, 15 Januari 2024        │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  DASH Score Hari │  │  Tekanan Darah Terakhir      │ │
│  │  Ini             │  │  145/92 mmHg                 │ │
│  │                  │  │  📅 Hari ini, 08:30           │ │
│  │    [Gauge: 68]   │  │  ⚠️ Hipertensi Stage 1       │ │
│  │    "Baik"        │  └──────────────────────────────┘ │
│  └──────────────────┘                                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Rencana Makan Hari Ini                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │   │
│  │  │ Sarapan  │ │  Siang   │ │  Malam   │         │   │
│  │  │ Bubur    │ │ Pecel    │ │ Ikan     │         │   │
│  │  │ Ayam     │ │ Sayur    │ │ Bakar    │         │   │
│  │  │ Score:72 │ │ Score:81 │ │ Score:65 │         │   │
│  │  └──────────┘ └──────────┘ └──────────┘         │   │
│  │  [Lihat Rencana Lengkap]                         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Tren DASH Score 7 Hari Terakhir                 │   │
│  │  [Grafik garis sederhana]                        │   │
│  │  Kepatuhan: 71% hari dengan score >= 60          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
`

### 8.3 Halaman Rekomendasi Harian

`
┌─────────────────────────────────────────────────────────┐
│  Rekomendasi Harian — 15 Januari 2024                   │
│  DASH Score Harian: 68.3 [████████░░] "Baik"           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🌅 SARAPAN                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Gambar] Bubur Ayam Jawa          Score: 72 ✅  │   │
│  │          Asal: Jawa Tengah                       │   │
│  │          Porsi: 250g                             │   │
│  │          Na: 420mg | K: 310mg | Serat: 2.1g     │   │
│  │          [Tolak] [Lihat Detail]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ☀️ MAKAN SIANG                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Gambar] Pecel Sayur Jawa         Score: 81 ✅  │   │
│  │          Asal: Jawa Timur                        │   │
│  │          Porsi: 300g                             │   │
│  │          Na: 380mg | K: 520mg | Serat: 5.2g     │   │
│  │          [Tolak] [Lihat Detail]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Konfirmasi Konsumsi Hari Ini]                         │
└─────────────────────────────────────────────────────────┘
`

### 8.4 Halaman Tracker Progres

`
┌─────────────────────────────────────────────────────────┐
│  Tracker Progres                                        │
│  [7 Hari] [30 Hari] [90 Hari]                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Tren DASH Score                                 │   │
│  │  100 ┤                                           │   │
│  │   80 ┤    ●─●                                    │   │
│  │   60 ┤  ●─   ●─●─●                              │   │
│  │   40 ┤                  ●                        │   │
│  │   20 ┤                                           │   │
│  │    0 └──────────────────────────────────         │   │
│  │       Sen Sel Rab Kam Jum Sab Min                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Rata-rata    │  │ Kepatuhan    │  │ Total Hari   │  │
│  │ DASH Score   │  │ (Score>=60)  │  │ Dicatat      │  │
│  │    67.8      │  │    71%       │  │    7/7       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  Ringkasan Mingguan                                     │
│  Rata-rata Natrium: 1.920 mg/hari                       │
│  Rata-rata Kalium: 3.650 mg/hari                        │
└─────────────────────────────────────────────────────────┘
`

### 8.5 Halaman Riwayat Tekanan Darah

`
┌─────────────────────────────────────────────────────────┐
│  Riwayat Tekanan Darah                [+ Catat Baru]    │
│  [7 Hari] [30 Hari] [90 Hari]        [Ekspor CSV]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Grafik Tekanan Darah                            │   │
│  │  200 ┤                                           │   │
│  │  160 ┤  ●─●─●─●─●─●─●  (Sistolik)              │   │
│  │  130 ┤ ─ ─ ─ ─ ─ ─ ─ ─ (Batas Hipertensi)      │   │
│  │  100 ┤  ○─○─○─○─○─○─○  (Diastolik)              │   │
│  │   80 ┤ ─ ─ ─ ─ ─ ─ ─ ─ (Batas Hipertensi)      │   │
│  │   40 └──────────────────────────────────         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Catatan Terbaru                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 15 Jan 08:30  145/92 mmHg  Setelah olahraga     │   │
│  │ 14 Jan 20:00  142/88 mmHg  Sebelum tidur        │   │
│  │ 14 Jan 07:00  148/94 mmHg  Pagi hari            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
`

### 8.6 Navigasi dan Responsivitas

Navigasi menggunakan bottom navigation bar di mobile dan sidebar di desktop:

`
Mobile (< 768px):          Desktop (>= 1024px):
┌─────────────────┐        ┌──────┬──────────────────────┐
│    Konten       │        │ Nav  │                      │
│                 │        │      │    Konten Utama       │
│                 │        │ 🏠   │                      │
│                 │        │ 🍽️   │                      │
│                 │        │ 📊   │                      │
│                 │        │ ❤️   │                      │
├─────────────────┤        │ 👤   │                      │
│ 🏠  🍽️  ��  ❤️  👤 │        └──────┴──────────────────────┘
└─────────────────┘
`

---

## 9. Properti Correctness

*Sebuah properti adalah karakteristik atau perilaku yang harus berlaku benar di semua eksekusi sistem yang valid — pada dasarnya, pernyataan formal tentang apa yang seharusnya dilakukan sistem. Properti berfungsi sebagai jembatan antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi secara otomatis.*

Bagian ini mendefinisikan properti-properti yang dapat diuji secara otomatis menggunakan property-based testing (Hypothesis untuk Python, fast-check untuk TypeScript). Setiap properti diturunkan dari kriteria penerimaan yang relevan.

---

### Properti 1: Registrasi dengan Data Valid Selalu Membuat Akun

*Untuk semua* kombinasi nama lengkap, email valid, dan kata sandi yang memenuhi persyaratan keamanan, proses registrasi harus berhasil membuat akun baru dengan kata sandi yang tersimpan dalam bentuk hash (bukan plaintext).

**Memvalidasi: Persyaratan 1.3**

---

### Properti 2: Kredensial Tidak Valid Selalu Menghasilkan Pesan Error Generik

*Untuk semua* kombinasi email dan kata sandi yang tidak cocok dengan akun yang ada, sistem autentikasi harus mengembalikan pesan error generik "Email atau kata sandi salah" tanpa mengungkap apakah email terdaftar atau tidak.

**Memvalidasi: Persyaratan 1.5**

---

### Properti 3: Validasi Usia Menolak Semua Nilai di Luar Rentang

*Untuk semua* nilai usia yang berada di luar rentang [18, 90] tahun (termasuk nilai negatif, nol, dan nilai di atas 90), sistem validasi profil harus menolak input dan menampilkan pesan validasi yang sesuai.

**Memvalidasi: Persyaratan 2.2**

---

### Properti 4: Validasi Tekanan Darah Menolak Semua Nilai di Luar Rentang

*Untuk semua* nilai sistolik di luar rentang [70, 250] mmHg atau nilai diastolik di luar rentang [40, 150] mmHg, sistem validasi harus menolak input dan menampilkan pesan validasi yang sesuai. Properti ini mencakup nilai negatif, nol, dan nilai ekstrem.

**Memvalidasi: Persyaratan 2.3, 2.4, 6.2**

---

### Properti 5: Penyimpanan dan Pembacaan Profil Menghasilkan Data Identik (Round-Trip)

*Untuk semua* profil pengguna yang valid (memenuhi semua batasan validasi), menyimpan profil ke database kemudian membacanya kembali harus menghasilkan objek profil yang identik dengan objek yang disimpan — tidak ada field yang hilang, berubah tipe, atau berubah nilai.

**Memvalidasi: Persyaratan 2.5**

---

### Properti 6: Rencana Makan Selalu Memiliki Struktur Lengkap

*Untuk semua* profil pengguna valid yang memiliki profil lengkap, sistem rekomendasi harus menghasilkan rencana makan yang memuat minimal 1 item untuk sarapan, 1 item untuk makan siang, 1 item untuk makan malam, dan 1 item camilan. Setiap item harus memiliki nama, asal daerah, ukuran porsi, dan ringkasan nutrisi DASH.

**Memvalidasi: Persyaratan 3.1, 3.9**

---

### Properti 7: Rencana Makan Selalu Memenuhi Batas Natrium DASH

*Untuk semua* profil pengguna valid tanpa komorbid CKD, total asupan natrium dalam rencana makan harian yang dihasilkan sistem rekomendasi tidak boleh melebihi 2.300 mg sesuai panduan DASH Diet.

**Memvalidasi: Persyaratan 3.3**

---

### Properti 8: Rencana Makan untuk Pengguna CKD Memenuhi Batasan Kalium dan Fosfor

*Untuk semua* profil pengguna yang memiliki komorbid gagal ginjal kronis (CKD), total asupan kalium harian dalam rencana makan yang dihasilkan harus di bawah 2.000 mg dan total asupan fosfor harus di bawah 800 mg.

**Memvalidasi: Persyaratan 3.5**

---

### Properti 9: Penolakan Makanan Selalu Menghasilkan Minimal 3 Alternatif

*Untuk semua* item makanan dalam rencana makan yang ditolak oleh pengguna, sistem rekomendasi harus menyediakan minimal 3 alternatif makanan lokal dengan profil nutrisi serupa (cosine similarity tinggi) yang belum ada dalam rencana makan saat ini.

**Memvalidasi: Persyaratan 3.8**

---

### Properti 10: DASH Score Selalu Berada dalam Rentang [0, 100]

*Untuk semua* item makanan valid dalam database (dengan nilai nutrisi non-negatif), fungsi calculate_dash_score harus menghasilkan nilai dalam rentang [0.0, 100.0]. Tidak ada nilai negatif atau nilai di atas 100 yang boleh dihasilkan.

**Memvalidasi: Persyaratan 4.1**

---

### Properti 11: DASH Score Deterministik — Input Sama Selalu Menghasilkan Output Sama

*Untuk semua* kombinasi nilai nutrisi yang valid, memanggil fungsi calculate_dash_score dua kali dengan input yang identik harus selalu menghasilkan nilai yang persis sama. Tidak ada elemen acak dalam perhitungan DASH Score.

**Memvalidasi: Persyaratan 4.6**

---

### Properti 12: Label Kategori DASH Score Selalu Sesuai Rentang

*Untuk semua* nilai DASH Score yang valid, fungsi kategorisasi harus mengembalikan label yang tepat: "Sangat Baik" untuk [80, 100], "Baik" untuk [60, 79], "Cukup" untuk [40, 59], dan "Perlu Perhatian" untuk [0, 39]. Tidak ada nilai yang jatuh di luar kategori yang terdefinisi.

**Memvalidasi: Persyaratan 4.3**

---

### Properti 13: DASH Score Agregat adalah Rata-Rata Tertimbang yang Valid

*Untuk semua* rencana makan dengan N item makanan, DASH Score agregat harian harus sama dengan rata-rata tertimbang dari DASH Score seluruh item, di mana bobot setiap item proporsional terhadap ukuran sajiannya dalam kalori.

**Memvalidasi: Persyaratan 4.2**

---

### Properti 14: Ringkasan Mingguan Dihitung dengan Benar dari Log Konsumsi

*Untuk semua* urutan 7 hari log konsumsi yang valid, ringkasan mingguan yang dihasilkan harus memuat rata-rata DASH Score yang benar (rata-rata aritmetika dari 7 nilai), total natrium yang benar (jumlah 7 nilai harian), dan total kalium yang benar (jumlah 7 nilai harian).

**Memvalidasi: Persyaratan 5.3**

---

### Properti 15: Persentase Kepatuhan Dihitung dengan Benar

*Untuk semua* riwayat log konsumsi dengan N entri, persentase kepatuhan kumulatif harus sama dengan (jumlah hari dengan DASH Score >= 60 / N) * 100, dibulatkan ke satu desimal.

**Memvalidasi: Persyaratan 5.4**

---

### Properti 16: Nilai Tekanan Darah Kritis Selalu Memicu Peringatan

*Untuk semua* nilai tekanan darah dengan sistolik >= 180 mmHg atau diastolik >= 120 mmHg, sistem harus menandai entri tersebut sebagai kritis (is_critical = True) dan menampilkan peringatan untuk segera berkonsultasi dengan tenaga medis.

**Memvalidasi: Persyaratan 6.5**

---

### Properti 17: Ekspor CSV Tekanan Darah adalah Round-Trip yang Sempurna

*Untuk semua* riwayat tekanan darah dengan N entri valid, mengekspor ke format CSV kemudian mengurai (parse) kembali file CSV tersebut harus menghasilkan daftar entri yang identik dengan data asli — tidak ada entri yang hilang, nilai yang berubah, atau urutan yang berbeda.

**Memvalidasi: Persyaratan 6.7**

---

### Properti 18: Semua Item Makanan dalam Database Memiliki Data Nutrisi Lengkap

*Untuk semua* item makanan yang tersimpan dalam database, semua 10 komponen Nutrisi_DASH yang diwajibkan (energi, protein, lemak total, lemak jenuh, karbohidrat, serat, natrium, kalium, kalsium, magnesium) harus ada, bernilai non-negatif, dan memiliki sumber data yang valid (DKPI, USDA, atau Nutrisurvey).

**Memvalidasi: Persyaratan 7.2, 7.3**

---

### Properti 19: Serialisasi JSON Item Makanan adalah Round-Trip yang Sempurna

*Untuk semua* item makanan valid dalam database, mengurai data nutrisi ke format JSON kemudian memuat kembali ke objek FoodItem harus menghasilkan objek yang identik dengan objek asal — semua field memiliki nilai yang sama dengan tipe data yang sama.

**Memvalidasi: Persyaratan 7.6**

---

### Properti 20: Model ML Reprodusibel dengan Seed Tetap

*Untuk semua* dataset makanan dan profil pengguna yang sama, melatih model dengan 
andom_state=42 dua kali harus menghasilkan urutan rekomendasi yang identik. Reprodusibilitas ini harus berlaku terlepas dari urutan item dalam dataset input.

**Memvalidasi: Persyaratan 8.3**

---

### Properti 21: Endpoint DASH Score Mengembalikan Skor per Item dan Agregat

*Untuk semua* daftar item makanan valid yang dikirim ke endpoint /api/v1/dash-score, respons harus berisi DASH Score individual untuk setiap item dalam daftar dan DASH Score agregat yang merupakan rata-rata tertimbang yang valid dari semua item.

**Memvalidasi: Persyaratan 8.5**

---

### Properti 22: Token JWT Tidak Valid Selalu Menghasilkan HTTP 401

*Untuk semua* token JWT yang tidak valid (token palsu, token kedaluwarsa, token dengan signature yang salah, atau token kosong), setiap endpoint yang memerlukan autentikasi harus mengembalikan kode status HTTP 401 tanpa mengekspos detail internal sistem.

**Memvalidasi: Persyaratan 10.3**

---

### Properti 23: Input Tidak Sesuai Skema Selalu Menghasilkan HTTP 422 dengan Detail

*Untuk semua* permintaan API dengan data input yang tidak sesuai skema Pydantic yang ditetapkan (tipe data salah, field wajib hilang, nilai di luar rentang), endpoint harus mengembalikan kode status HTTP 422 beserta daftar field yang tidak valid dalam format JSON terstruktur.

**Memvalidasi: Persyaratan 12.3**

---

### Properti 24: Serialisasi JSON Respons API adalah Round-Trip yang Sempurna

*Untuk semua* endpoint API yang mengembalikan daftar data, mengurai respons JSON kemudian menserialisasi kembali ke JSON harus menghasilkan string JSON yang ekuivalen dengan respons asli — tidak ada data yang hilang atau berubah dalam proses serialisasi/deserialisasi.

**Memvalidasi: Persyaratan 12.5**

---

## 10. Penanganan Error

### 10.1 Strategi Penanganan Error Global

FastAPI menggunakan exception handlers terpusat untuk memastikan format respons error yang konsisten:

`python
# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Handler global untuk semua exception yang tidak tertangani.
    TIDAK mengekspos stack trace ke klien (Persyaratan 8.6).
    """
    # Log error internal (dengan stack trace)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Terjadi kesalahan internal. Silakan coba lagi.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": getattr(exc, 'error_code', 'HTTP_ERROR'),
            "timestamp": datetime.utcnow().isoformat()
        }
    )
`

### 10.2 Penanganan Error Koneksi Database

`python
# core/database.py
import asyncio
from supabase import create_client

async def get_db_with_retry(max_retries: int = 3):
    """
    Mencoba koneksi database dengan jeda eksponensial.
    Persyaratan 11.3: 3 kali retry dengan jeda eksponensial.
    """
    for attempt in range(max_retries):
        try:
            client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            # Test koneksi
            await client.table('food_items').select('id').limit(1).execute()
            return client
        except Exception as e:
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=503,
                    detail="Layanan database tidak tersedia sementara"
                )
            wait_time = 2 ** attempt  # 1s, 2s, 4s
            await asyncio.sleep(wait_time)
`

### 10.3 Tabel Kode Error

| Kode HTTP | Error Code | Kondisi |
|-----------|------------|---------|
| 400 | BAD_REQUEST | Request malformed |
| 401 | UNAUTHORIZED | Token JWT tidak valid/kedaluwarsa |
| 403 | FORBIDDEN | Akses ke resource milik pengguna lain |
| 404 | NOT_FOUND | Resource tidak ditemukan |
| 409 | EMAIL_ALREADY_EXISTS | Email sudah terdaftar |
| 422 | VALIDATION_ERROR | Input tidak sesuai skema |
| 429 | RATE_LIMIT_EXCEEDED | Melebihi 100 req/menit |
| 500 | INTERNAL_SERVER_ERROR | Kesalahan internal (tanpa detail) |
| 503 | SERVICE_UNAVAILABLE | Database tidak tersedia |

### 10.4 Penanganan Error di Frontend

`	ypescript
// lib/api.ts
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(${process.env.NEXT_PUBLIC_API_URL}, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(response.status, error.detail, error.error_code)
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    // Network error atau timeout
    throw new ApiError(0, 'Koneksi gagal. Periksa koneksi internet Anda.', 'NETWORK_ERROR')
  }
}
`

### 10.5 Error Logging

Semua error HTTP 4xx dan 5xx dicatat ke tabel error_logs di Supabase:

`sql
CREATE TABLE error_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp   TIMESTAMPTZ DEFAULT NOW(),
    endpoint    VARCHAR(255) NOT NULL,
    method      VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    error_code  VARCHAR(100),
    message     TEXT,
    user_id     UUID REFERENCES auth.users(id),
    ip_address  INET
);
`

---

## 11. Strategi Pengujian

### 11.1 Pendekatan Pengujian Ganda

TensiMenu menggunakan dua pendekatan pengujian yang saling melengkapi:

1. **Unit Test (Contoh Spesifik)**: Memverifikasi perilaku konkret dengan contoh yang telah ditentukan
2. **Property-Based Test (Universal)**: Memverifikasi properti yang berlaku untuk semua input yang valid

### 11.2 Library Property-Based Testing

- **Backend (Python)**: [Hypothesis](https://hypothesis.readthedocs.io/) — library PBT paling matang untuk Python
- **Frontend (TypeScript)**: [fast-check](https://fast-check.dev/) — library PBT untuk JavaScript/TypeScript

### 11.3 Konfigurasi Property-Based Testing

`python
# tests/conftest.py
from hypothesis import settings, HealthCheck

# Konfigurasi global: minimal 100 iterasi per properti
settings.register_profile("ci", max_examples=100, suppress_health_check=[HealthCheck.too_slow])
settings.register_profile("dev", max_examples=50)
settings.load_profile("ci")
`

`python
# Contoh implementasi properti
from hypothesis import given, settings
import hypothesis.strategies as st

@given(
    sodium=st.floats(min_value=0, max_value=10000),
    potassium=st.floats(min_value=0, max_value=10000),
    calcium=st.floats(min_value=0, max_value=5000),
    magnesium=st.floats(min_value=0, max_value=2000),
    fiber=st.floats(min_value=0, max_value=100),
    fat_saturated=st.floats(min_value=0, max_value=200),
    fat_total=st.floats(min_value=0, max_value=500),
)
@settings(max_examples=100)
def test_dash_score_always_in_range(sodium, potassium, calcium, magnesium, fiber, fat_saturated, fat_total):
    """
    Feature: tensimenu, Property 10: DASH Score selalu berada dalam rentang [0, 100]
    """
    nutrition = {
        'sodium_mg': sodium, 'potassium_mg': potassium,
        'calcium_mg': calcium, 'magnesium_mg': magnesium,
        'fiber_g': fiber, 'fat_saturated_g': fat_saturated,
        'fat_total_g': fat_total
    }
    score = calculate_dash_score(nutrition, serving_size_g=100)
    assert 0.0 <= score <= 100.0, f"DASH Score {score} di luar rentang [0, 100]"
`

### 11.4 Struktur Test Suite

`
tests/
├── unit/
│   ├── test_dash_score.py          # Unit test kalkulasi DASH Score
│   ├── test_nutrition_validator.py # Unit test validasi nutrisi
│   ├── test_content_based_filter.py # Unit test CBF
│   └── test_validators.py          # Unit test validasi input
├── property/
│   ├── test_dash_score_properties.py    # PBT: Properti 10, 11, 12, 13
│   ├── test_recommendation_properties.py # PBT: Properti 6, 7, 8, 9
│   ├── test_serialization_properties.py  # PBT: Properti 5, 17, 19, 24
│   ├── test_validation_properties.py     # PBT: Properti 3, 4
│   └── test_api_properties.py            # PBT: Properti 22, 23
├── integration/
│   ├── test_auth_flow.py           # Integrasi: alur autentikasi
│   ├── test_database.py            # Integrasi: koneksi database
│   └── test_ml_pipeline.py         # Integrasi: pipeline ML end-to-end
└── smoke/
    ├── test_api_endpoints.py       # Smoke: keberadaan endpoint
    └── test_model_artifacts.py     # Smoke: artefak model tersedia
`

### 11.5 Cakupan Pengujian per Persyaratan

| Persyaratan | Tipe Test | Properti |
|-------------|-----------|---------|
| 1.3 Registrasi valid | PBT | Properti 1 |
| 1.5 Error generik login | PBT | Properti 2 |
| 2.2 Validasi usia | PBT | Properti 3 |
| 2.3-2.4 Validasi TD | PBT | Properti 4 |
| 2.5 Round-trip profil | PBT | Properti 5 |
| 3.1, 3.9 Struktur rencana makan | PBT | Properti 6 |
| 3.3 Batas natrium | PBT | Properti 7 |
| 3.5 Batasan CKD | PBT | Properti 8 |
| 3.8 Alternatif makanan | PBT | Properti 9 |
| 4.1 Rentang DASH Score | PBT | Properti 10 |
| 4.6 Determinisme DASH Score | PBT | Properti 11 |
| 4.3 Label kategori | PBT | Properti 12 |
| 4.2 Agregat DASH Score | PBT | Properti 13 |
| 5.3 Ringkasan mingguan | PBT | Properti 14 |
| 5.4 Persentase kepatuhan | PBT | Properti 15 |
| 6.5 Peringatan TD kritis | PBT | Properti 16 |
| 6.7 Ekspor CSV round-trip | PBT | Properti 17 |
| 7.2-7.3 Kelengkapan data nutrisi | PBT | Properti 18 |
| 7.6 Serialisasi JSON makanan | PBT | Properti 19 |
| 8.3 Reprodusibilitas model | PBT | Properti 20 |
| 8.5 Endpoint DASH Score | PBT | Properti 21 |
| 10.3 Validasi JWT | PBT | Properti 22 |
| 12.3 Validasi skema API | PBT | Properti 23 |
| 12.5 Round-trip JSON API | PBT | Properti 24 |
| 1.2 Email duplikat | Unit | - |
| 1.6 Timeout sesi | Unit | - |
| 8.2 Precision@10 model | Integration | - |
| 9.1 Responsivitas UI | Smoke | - |
| 11.1 Uptime 99% | Monitoring | - |

---
