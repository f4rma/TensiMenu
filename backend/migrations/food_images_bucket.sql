-- ============================================================
-- Migration 004: Food Images Storage Bucket
-- ============================================================
--
-- Buat bucket "food-images" (public read, authenticated write)
-- untuk menampung foto menu yang diupload manual via script
-- backend/scripts/upload_food_images.py
--
-- Jalankan di Supabase Dashboard → SQL Editor SEKALI saja.
-- Aman jika sudah ada (idempotent).
-- ============================================================

-- 1. Buat bucket kalau belum ada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'food-images',
  'food-images',
  TRUE,                                       -- public read
  524288,                                     -- 512 KB max per file
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Policy: siapa pun boleh BACA (public)
DROP POLICY IF EXISTS "Public read food images" ON storage.objects;
CREATE POLICY "Public read food images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'food-images');

-- 3. Policy: hanya service_role (backend admin) yang boleh tulis.
--   Frontend user tidak perlu upload — admin upload via script.
DROP POLICY IF EXISTS "Service role write food images" ON storage.objects;
CREATE POLICY "Service role write food images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'food-images'
    AND auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Service role update food images" ON storage.objects;
CREATE POLICY "Service role update food images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'food-images' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role delete food images" ON storage.objects;
CREATE POLICY "Service role delete food images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'food-images' AND auth.role() = 'service_role');
