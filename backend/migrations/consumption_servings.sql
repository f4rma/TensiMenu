-- ─── TensiMenu — Migration 005: consumption_logs.servings_g ─────────────
-- Cara jalankan: copy seluruh isi file ini, paste di
-- Supabase Dashboard -> SQL Editor -> New query -> RUN
--
-- Menambahkan kolom servings_g (JSONB array of float) untuk menyimpan porsi
-- per food_code yang dikonsumsi. Sebelumnya porsi tidak persisten sehingga
-- recompute DASH score harian dari riwayat tidak mungkin akurat.
--
-- Idempotent: aman dijalankan ulang.

ALTER TABLE public.consumption_logs
ADD COLUMN IF NOT EXISTS servings_g JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.consumption_logs.servings_g IS
    'Array porsi (gram) sejajar dengan food_codes. Posisi i pada food_codes berpasangan dengan servings_g[i].';
