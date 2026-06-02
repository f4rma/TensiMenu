-- Migration untuk tabel failed_login_attempts
-- Digunakan untuk tracking gagal login dan IP blocking

-- Drop tabel jika sudah ada (hati-hati, akan menghapus data)
-- DROP TABLE IF EXISTS failed_login_attempts CASCADE;

-- Buat tabel baru
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    first_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_blocked ON failed_login_attempts(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Service role bisa akses semua (untuk backend)
CREATE POLICY "Service role can access all" 
ON failed_login_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Anon role bisa baca (untuk endpoint public seperti login)
CREATE POLICY "Anon can read"
ON failed_login_attempts
FOR SELECT
TO anon
USING (true);

-- Policy: Anon role bisa insert/update (untuk tracking failed login)
CREATE POLICY "Anon can insert"
ON failed_login_attempts
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon can update"
ON failed_login_attempts
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Comment untuk dokumentasi
COMMENT ON TABLE failed_login_attempts IS 'Tracking gagal login dan IP blocking untuk keamanan';
COMMENT ON COLUMN failed_login_attempts.ip_address IS 'IP address pengguna';
COMMENT ON COLUMN failed_login_attempts.attempt_count IS 'Jumlah percobaan gagal dalam window waktu';
COMMENT ON COLUMN failed_login_attempts.first_attempt IS 'Timestamp percobaan gagal pertama dalam window';
COMMENT ON COLUMN failed_login_attempts.blocked_until IS 'Timestamp hingga kapan IP diblokir (NULL jika tidak diblokir)';
