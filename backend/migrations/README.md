# Database Migrations

Folder ini berisi SQL migrations untuk setup database Supabase TensiMenu.

## Cara Menjalankan Migration

Semua migration harus dijalankan di **Supabase SQL Editor**:

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu **SQL Editor** di sidebar kiri
4. Buat **New Query**
5. Copy-paste isi file SQL dari folder ini
6. Klik **Run** untuk execute

## Urutan Migrations

Jalankan migrations dalam urutan berikut:

1. `user_profiles.sql` - Tabel profil pengguna
2. `user_profile_activity_level.sql` - Update activity level enum
3. `consumption_logs.sql` - Tabel log konsumsi makanan
4. `consumption_servings.sql` - Tabel detail serving makanan
5. `blood_pressure_records.sql` - Tabel catatan tekanan darah
6. `food_images_bucket.sql` - Storage bucket untuk gambar makanan
7. `failed_login_attempts.sql` - Tabel tracking gagal login (keamanan)

## Migration Files

### `failed_login_attempts.sql`
**Tujuan**: Memperbaiki error "column blocked_until does not exist"

Membuat tabel untuk tracking failed login attempts dan IP blocking dengan kolom:
- `ip_address` - IP address pengguna
- `attempt_count` - Jumlah percobaan gagal
- `first_attempt` - Timestamp percobaan pertama
- `blocked_until` - Kapan IP diblokir hingga (NULL jika tidak diblokir)

**Fitur Keamanan**:
- Blokir IP selama 15 menit setelah 5 kegagalan login dalam 10 menit
- Auto-reset counter setelah login berhasil
- RLS policies untuk akses aman

## Troubleshooting

### Error: "column does not exist"
Pastikan Anda sudah menjalankan migration yang sesuai di Supabase SQL Editor.

### Error: "table already exists"
Jika tabel sudah ada tapi struktur salah, Anda bisa:
1. Backup data terlebih dahulu
2. Uncomment baris `DROP TABLE IF EXISTS ...` di migration file
3. Jalankan ulang migration

### Restart Backend
Setelah menjalankan migration, restart backend Anda agar perubahan schema ter-refresh.

## Verifikasi

Untuk memverifikasi migration berhasil, cek di Supabase Dashboard:
1. Klik menu **Table Editor**
2. Pastikan tabel yang dimaksud ada dan memiliki kolom yang benar
3. Cek **Policies** untuk memastikan RLS sudah aktif
