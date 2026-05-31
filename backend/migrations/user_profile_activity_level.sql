-- ─── TensiMenu — Migration 006: user_profiles.activity_level ───────────
-- Cara jalankan: copy seluruh isi file ini, paste di
-- Supabase Dashboard -> SQL Editor -> New query -> RUN
--
-- Menambahkan kolom activity_level untuk Physical Activity Level (PAL).
-- Sebelumnya energy_kcal di daily_targets disetarakan dengan BMR (sangat
-- rendah). Dengan kolom ini, TDEE = BMR × PAL bisa dihitung personal.
--
-- Nilai PAL standar (WHO/FAO/UNU 2004):
--   sedentary   = 1.20  (bedrest / sangat tidak aktif)
--   light       = 1.375 (kerja kantor, sedikit olahraga)  ← default
--   moderate    = 1.55  (olahraga 3-5x/minggu)
--   active      = 1.725 (olahraga harian)
--   very_active = 1.90  (atlet / pekerja fisik berat)
--
-- Idempotent: aman dijalankan ulang.

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS activity_level TEXT
    CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));

-- Default 'light' untuk row existing yang belum punya nilai.
UPDATE public.user_profiles
SET activity_level = 'light'
WHERE activity_level IS NULL;

-- Setelah backfill, paksa NOT NULL.
ALTER TABLE public.user_profiles
ALTER COLUMN activity_level SET NOT NULL,
ALTER COLUMN activity_level SET DEFAULT 'light';

COMMENT ON COLUMN public.user_profiles.activity_level IS
    'Physical Activity Level untuk konversi BMR ke TDEE. Lihat WHO/FAO/UNU 2004.';

-- Reset daily_targets lama supaya dihitung ulang dengan TDEE saat user
-- fetch profile berikutnya. Aman karena daily_targets adalah cache.
UPDATE public.user_profiles
SET daily_targets = NULL
WHERE daily_targets IS NOT NULL;
