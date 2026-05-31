-- ─── TensiMenu — Migration 002: blood_pressure_records ────────────────────
-- Cara jalankan: copy seluruh isi file ini, paste di
-- Supabase Dashboard -> SQL Editor -> New query -> RUN

-- ─── Bersihkan tabel lama (kalau ada) ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_bp_records_updated_at ON public.blood_pressure_records;
DROP TABLE IF EXISTS public.blood_pressure_records CASCADE;

-- ─── Tabel ────────────────────────────────────────────────────────────────
CREATE TABLE public.blood_pressure_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Nilai BP (Req. 6.2)
    systolic_mmhg INT NOT NULL CHECK (systolic_mmhg BETWEEN 70 AND 250),
    diastolic_mmhg INT NOT NULL CHECK (diastolic_mmhg BETWEEN 40 AND 150),

    -- Waktu pengukuran (bisa beda dari created_at)
    measured_at TIMESTAMPTZ NOT NULL,

    -- Catatan opsional dari user
    notes TEXT CHECK (char_length(notes) <= 500),

    -- Auto-flag krisis hipertensi (sistolik >= 180 atau diastolik >= 120)
    is_critical BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks
CREATE INDEX idx_bp_user_date ON public.blood_pressure_records(user_id, measured_at DESC);
CREATE INDEX idx_bp_critical ON public.blood_pressure_records(user_id, is_critical) WHERE is_critical = true;

-- ─── Trigger: auto-flag krisis + update timestamp ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_bp_critical_flag()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_critical = (NEW.systolic_mmhg >= 180 OR NEW.diastolic_mmhg >= 120);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bp_records_updated_at
BEFORE INSERT OR UPDATE ON public.blood_pressure_records
FOR EACH ROW
EXECUTE FUNCTION public.set_bp_critical_flag();

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own BP records"
ON public.blood_pressure_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own BP records"
ON public.blood_pressure_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own BP records"
ON public.blood_pressure_records
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own BP records"
ON public.blood_pressure_records
FOR DELETE
USING (auth.uid() = user_id);

-- ─── Verifikasi ───────────────────────────────────────────────────────────
-- Setelah run, cek struktur:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'blood_pressure_records';
