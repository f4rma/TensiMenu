-- ─── TensiMenu — Migration 001: user_profiles ──────────────────────────────
-- Cara jalankan: copy seluruh isi file ini, paste di
-- Supabase Dashboard -> SQL Editor -> New query -> RUN
--
-- WARNING: Migration ini akan DROP tabel user_profiles lama jika ada,
-- lalu re-create dengan struktur baru. Data lama akan hilang.
-- (Aman untuk fresh setup. Kalau ada data production, backup dulu.)

-- ─── Bersihkan tabel lama (jika ada struktur lama) ─────────────────────────
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- ─── Tabel ─────────────────────────────────────────────────────────────────
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Demografi & fisik
    full_name TEXT NOT NULL,
    age INT NOT NULL CHECK (age BETWEEN 18 AND 90),
    gender TEXT NOT NULL CHECK (gender IN ('laki-laki', 'perempuan')),
    weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
    height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm > 0 AND height_cm < 300),

    -- Tekanan darah terakhir
    systolic_bp INT CHECK (systolic_bp BETWEEN 70 AND 250),
    diastolic_bp INT CHECK (diastolic_bp BETWEEN 40 AND 150),

    -- Riwayat & preferensi (JSONB untuk fleksibilitas)
    comorbidities JSONB NOT NULL DEFAULT '[]'::jsonb,
    food_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
    regional_prefs JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Avatar
    avatar_style TEXT,

    -- Target nutrisi yang dihitung otomatis (Mifflin-St Jeor + DASH adjustments)
    daily_targets JSONB,

    -- Status
    is_complete BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_complete ON public.user_profiles(is_complete);

-- ─── Trigger updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security (RLS) ──────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa SELECT profil sendiri
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: user hanya bisa INSERT profil dengan user_id-nya sendiri
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: user hanya bisa UPDATE profil sendiri
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: user hanya bisa DELETE profil sendiri (untuk Hak untuk Dilupakan)
CREATE POLICY "Users can delete own profile"
ON public.user_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- ─── Service role bypass (backend FastAPI) ─────────────────────────────────
-- Backend menggunakan service_role key yang otomatis bypass RLS,
-- tidak perlu policy tambahan.

-- ─── Verifikasi ────────────────────────────────────────────────────────────
-- Setelah run, cek struktur tabel:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'user_profiles';
