-- ─── TensiMenu — Migration 003: consumption_logs ─────────────────────────
-- Cara jalankan: copy seluruh isi file ini, paste di
-- Supabase Dashboard -> SQL Editor -> New query -> RUN
--
-- Tabel ini menyimpan log konsumsi makanan harian pengguna.
-- Dipakai untuk:
-- 1. Hitung DASH Score harian + nutrisi (sodium, potassium, dll.)
-- 2. Anti-repetisi 3 hari terakhir (Req. 3.11)
-- 3. Tren progres mingguan/bulanan

DROP TABLE IF EXISTS public.consumption_logs CASCADE;

CREATE TABLE public.consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Daftar food_code yang dikonsumsi (JSONB array)
    food_codes JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Nutrisi total dari semua makanan yang dikonsumsi pada log ini
    -- Pre-computed agar aggregation query cepat
    total_energy_kcal NUMERIC(8,2) DEFAULT 0,
    total_sodium_mg NUMERIC(8,2) DEFAULT 0,
    total_potassium_mg NUMERIC(8,2) DEFAULT 0,
    total_calcium_mg NUMERIC(8,2) DEFAULT 0,
    total_fiber_g NUMERIC(6,2) DEFAULT 0,
    total_fat_total_g NUMERIC(6,2) DEFAULT 0,

    -- DASH Score harian (rata-rata tertimbang dari semua makanan di log)
    dash_score NUMERIC(5,2) DEFAULT 0,

    -- Tanggal konsumsi (untuk anti-repetisi & aggregate harian)
    log_date DATE NOT NULL,

    -- Catatan opsional
    notes TEXT CHECK (char_length(notes) <= 500),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks
CREATE INDEX idx_consumption_user_date
    ON public.consumption_logs(user_id, log_date DESC);

CREATE INDEX idx_consumption_user_recent
    ON public.consumption_logs(user_id, created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_consumption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consumption_updated_at
BEFORE UPDATE ON public.consumption_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_consumption_updated_at();

-- Row Level Security
ALTER TABLE public.consumption_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consumption logs"
ON public.consumption_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consumption logs"
ON public.consumption_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consumption logs"
ON public.consumption_logs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own consumption logs"
ON public.consumption_logs FOR DELETE
USING (auth.uid() = user_id);
