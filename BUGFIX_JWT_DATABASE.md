# 🔧 Bugfix: JWT & Database Errors

## 📋 Ringkasan Masalah

Dari log Railway yang Anda kirim, ada 2 masalah:

### ✅ Masalah 1: JWT kid tidak ditemukan (SOLVED)
**Status**: Sudah teratasi setelah login ulang

**Error Log**:
```
WARNING | Validasi JWT gagal: Public key dengan kid '06c7c47679b808fcedf7391d7b1e3657bca30dbb' tidak ditemukan
INFO: "GET /api/v1/profile HTTP/1.1" 401 Unauthorized
```

**Penyebab**: Token lama dengan `kid` berbeda masih tersimpan di browser user.

**Solusi**: Setelah user login ulang (07:04:59), token baru didapat dan semua endpoint bekerja normal (200 OK).

**Tidak perlu action** - user yang masih dapat 401 tinggal logout dan login ulang.

---

### ❌ Masalah 2: Kolom database tidak ada (BUTUH FIX)
**Status**: Perlu diperbaiki di Supabase

**Error Log**:
```
WARNING | Gagal cek blokir IP: {'message': 'column failed_login_attempts.blocked_until does not exist', 'code': '42703'}
WARNING | Gagal reset login counter: {'message': "Could not find the 'attempt_count' column of 'failed_login_attempts'"}
```

**Penyebab**: Tabel `failed_login_attempts` tidak ada atau strukturnya salah.

**Dampak**: 
- ❌ Fitur IP blocking tidak berfungsi
- ✅ Login tetap berhasil (hanya warning, tidak error)

---

## 🛠️ Cara Fix Database (Wajib Dilakukan)

### Step 1: Buka Supabase Dashboard
1. Buka browser, akses: https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project **TensiMenu** (ottlrktnoafiiwhmnrdh)

### Step 2: Jalankan Migration SQL
1. Klik menu **SQL Editor** di sidebar kiri
2. Klik tombol **New Query**
3. Copy SQL berikut dan paste ke editor:

```sql
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
```

4. Klik tombol **Run** (atau tekan Ctrl+Enter)
5. Tunggu hingga muncul pesan sukses

### Step 3: Verifikasi Tabel Sudah Ada
1. Klik menu **Table Editor** di sidebar
2. Cari tabel **failed_login_attempts**
3. Pastikan tabel ada dengan kolom:
   - `id`
   - `ip_address`
   - `attempt_count`
   - `first_attempt`
   - `blocked_until`
   - `updated_at`
   - `created_at`

### Step 4: Restart Backend (Opsional)
Tidak wajib, tapi disarankan untuk refresh schema cache:

1. Buka Railway Dashboard
2. Klik service **tensimenu-backend**
3. Klik tombol **Restart**

---

## ✅ Hasil Setelah Fix

Setelah migration dijalankan:

- ✅ Error `blocked_until does not exist` akan hilang
- ✅ Error `attempt_count` tidak ditemukan akan hilang
- ✅ Fitur IP blocking akan berfungsi:
  - Otomatis blokir IP selama 15 menit setelah 5 kali gagal login dalam 10 menit
  - Auto-reset counter setelah login berhasil
  - Proteksi dari brute force attack

---

## 📊 Monitoring

Setelah fix, cek log Railway untuk memastikan tidak ada warning lagi:

**Log yang diharapkan setelah login**:
```
✅ INFO | Login berhasil: orcvn00@gmail.com
✅ INFO | "POST /api/v1/auth/login HTTP/1.1" 200 OK
✅ INFO | "GET /api/v1/profile HTTP/1.1" 200 OK
✅ INFO | "GET /api/v1/progress/today HTTP/1.1" 200 OK
```

**Tidak boleh ada lagi**:
```
❌ WARNING | Gagal cek blokir IP
❌ WARNING | Gagal reset login counter
```

---

## 🎯 Action Items

- [ ] Jalankan SQL migration di Supabase SQL Editor
- [ ] Verifikasi tabel `failed_login_attempts` sudah ada
- [ ] Restart backend Railway (opsional)
- [ ] Test login untuk cek warning sudah hilang
- [ ] Instruksikan user untuk logout & login ulang jika masih 401

---

## 📞 Troubleshooting

### Q: Masih muncul error setelah migration
A: Pastikan:
1. SQL berhasil dijalankan tanpa error
2. Tabel benar-benar ada di Table Editor
3. RLS policies sudah aktif
4. Backend sudah di-restart

### Q: User masih 401 setelah fix database
A: Itu masalah JWT (Masalah 1), bukan database. Solusi:
- Minta user logout
- Hapus cookies/cache browser
- Login ulang untuk dapat token baru

### Q: Apa efek samping jika tabel sudah ada?
A: SQL menggunakan `CREATE TABLE IF NOT EXISTS`, jadi aman. Kalau tabel sudah ada, tidak akan diubah.

---

**File migration sudah tersimpan di**: `backend/migrations/failed_login_attempts.sql`
