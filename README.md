# TensiMenu

Sistem rekomendasi makanan lokal Indonesia berbasis DASH Diet untuk penderita hipertensi.

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + NextAuth.js |
| Backend | FastAPI (Python) + scikit-learn |
| Database | Supabase (PostgreSQL + Row Level Security) |
| ML | Content-Based Filtering + Cosine Similarity |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

## Struktur Proyek

```
TensiMenu/
├── backend/          # FastAPI backend + ML pipeline
│   ├── api/v1/       # Endpoint REST API
│   ├── core/         # Config, database, security, rate limiter
│   ├── ml/           # Model loader, CBF, feature engineering
│   │   └── artifacts/  # Artefak model (scaler.pkl, item_matrix.npy, dll.)
│   ├── models/       # Pydantic models
│   ├── services/     # Business logic
│   └── requirements.txt
├── frontend/         # Next.js frontend
│   └── src/
│       ├── app/      # App Router pages
│       ├── components/
│       ├── lib/      # API client, auth, supabase
│       └── types/
├── notebooks/        # Jupyter notebooks (preprocessing + ML training)
│   └── 01_preprocessing_feature_engineering.ipynb
└── datasets/         # Dataset TKPI 2017 dan data lokal
```

## Setup Lokal

### Prasyarat

- Python 3.11+
- Node.js 18+
- Akun Supabase

### Backend

```bash
cd backend

# Buat virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# Install dependensi
pip install -r requirements.txt

# Konfigurasi environment
cp .env.example .env
# Edit .env dengan nilai Supabase dan JWT secret

# Jalankan server
python main.py
# atau: uvicorn main:app --reload
```

Backend berjalan di: http://localhost:8000  
Swagger UI: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependensi
npm install

# Konfigurasi environment
cp .env.example .env.local
# Edit .env.local dengan nilai Supabase, NextAuth, dan Google OAuth

# Jalankan development server
npm run dev
```

Frontend berjalan di: http://localhost:3000

### Model ML

Artefak model sudah tersedia di `backend/ml/artifacts/`.  
Untuk melatih ulang model dari dataset terbaru:

```bash
# Buka notebook di Google Colab atau lokal
jupyter notebook notebooks/01_preprocessing_feature_engineering.ipynb

# Setelah selesai, salin folder artifacts/ ke backend/ml/artifacts/
```

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/health` | Status sistem + model ML |
| POST | `/api/v1/auth/register` | Registrasi pengguna |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/profile` | Ambil profil |
| POST | `/api/v1/profile` | Buat profil |
| PUT | `/api/v1/profile` | Perbarui profil |
| GET | `/api/v1/recommendations` | Rekomendasi makanan harian |
| GET | `/api/v1/recommendations/{food_code}/alternatives` | Alternatif makanan |
| POST | `/api/v1/recommendations/confirm` | Konfirmasi konsumsi |
| POST | `/api/v1/dash-score` | Hitung DASH Score |
| GET | `/api/v1/dash-score/daily` | DASH Score harian |
| POST | `/api/v1/blood-pressure` | Catat tekanan darah |
| GET | `/api/v1/blood-pressure` | Riwayat tekanan darah |
| GET | `/api/v1/blood-pressure/export` | Ekspor CSV |
| GET | `/api/v1/progress/trend` | Tren DASH Score |
| GET | `/api/v1/progress/weekly-summary` | Ringkasan mingguan |
| GET | `/api/v1/foods` | Daftar makanan |

## Tim

| Nama | Peran |
|------|-------|
| Raditya Putra Farma | ML Engineer + Backend |
| Isrezal Akbar | Backend Developer |
| Whenny Zenica | Data Analyst + ML |
| Devani | Frontend Developer |
| Najwa Kurnia | Frontend Developer + QA |
