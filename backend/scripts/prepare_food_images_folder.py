"""
Siapkan folder kerja `food_images_input/` berisi placeholder file untuk
setiap menu yang masuk pool rekomendasi (is_dish=True).

Workflow penggunaan:

1. Jalankan script ini sekali:
     python scripts/prepare_food_images_folder.py

2. Folder `food_images_input/` akan terbuat dengan struktur:
     food_images_input/
       _checklist.csv         ← daftar lengkap food_code + nama
       AP001.txt              ← placeholder untuk Nasi (hapus & ganti dengan AP001.jpg)
       AP002.txt              ← placeholder untuk Nasi tim
       ...

3. Cari foto untuk setiap menu (dari Wikimedia, Unsplash, foto sendiri).
   Simpan dengan nama `{food_code}.jpg` (atau .png/.webp), HAPUS file .txt.

4. Setelah selesai, jalankan upload:
     python scripts/upload_food_images.py

Tips cari foto:
- Wikimedia Commons (https://commons.wikimedia.org) — bebas, atribusi mudah
- Unsplash, Pexels — bebas non-komersial, kebanyakan butuh atribusi
- Google Images dengan filter "Creative Commons" → klik & verifikasi lisensi
- Foto sendiri — paling aman dari sisi lisensi
"""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
ARTIFACTS = BACKEND / "ml" / "artifacts"
INPUT_DIR = BACKEND / "food_images_input"


def main() -> int:
    csv_path = ARTIFACTS / "food_items_clean.csv"
    if not csv_path.exists():
        print(f"ERROR: {csv_path} tidak ditemukan")
        return 1

    df = pd.read_csv(csv_path)

    if "is_dish" not in df.columns:
        print("ERROR: kolom 'is_dish' tidak ada. Jalankan dulu:")
        print("  python scripts/classify_dishes.py")
        return 1

    dishes = df[df["is_dish"] == True].copy()  # noqa: E712
    print("=" * 70)
    print("PREPARE FOOD IMAGES INPUT FOLDER")
    print("=" * 70)
    print(f"Total menu (is_dish=True): {len(dishes)}")
    print(f"Output folder            : {INPUT_DIR}")
    print()

    INPUT_DIR.mkdir(exist_ok=True)

    # 1. Tulis checklist CSV (sortir berdasarkan kategori untuk kemudahan kerja)
    checklist_path = INPUT_DIR / "_checklist.csv"
    out = dishes[["food_code", "name", "category", "region"]].copy()
    out["status"] = "TODO"
    out["filename_expected"] = out["food_code"] + ".jpg"
    out = out.sort_values(["category", "name"])
    out.to_csv(checklist_path, index=False)
    print(f"[OK] Checklist disimpan: {checklist_path}")

    # 2. Buat placeholder .txt untuk setiap food_code yang belum ada gambar
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    existing_images: dict[str, Path] = {}
    for ext in image_extensions:
        for img in INPUT_DIR.glob(f"*{ext}"):
            existing_images[img.stem.upper()] = img

    created = 0
    has_image = 0
    for _, row in dishes.iterrows():
        code = str(row["food_code"]).strip()
        if not code:
            continue
        if code.upper() in existing_images:
            has_image += 1
            continue

        placeholder = INPUT_DIR / f"{code}.txt"
        if not placeholder.exists():
            placeholder.write_text(
                f"Cari foto untuk: {row['name']}\n"
                f"Kategori : {row.get('category', '-')}\n"
                f"Asal     : {row.get('region', '-')}\n\n"
                f"Setelah ketemu, simpan dengan nama: {code}.jpg\n"
                f"Lalu HAPUS file ini.\n",
                encoding="utf-8",
            )
            created += 1

    print(f"[OK] Placeholder dibuat: {created}")
    print(f"     Sudah ada gambar  : {has_image}")
    print()
    print("Langkah selanjutnya:")
    print(f"  1. Buka folder {INPUT_DIR}")
    print("  2. Untuk setiap file .txt, cari foto menu yang sesuai")
    print("  3. Simpan dengan nama {food_code}.jpg, lalu hapus .txt")
    print("  4. Jalankan: python scripts/upload_food_images.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
