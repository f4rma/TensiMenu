"""
Compress + upload semua gambar menu di folder `food_images_input/` ke
Supabase Storage bucket `food-images`, lalu update kolom `image_url`
di food_items_clean.csv.

Pre-requisites:
1. Migration `004_food_images_bucket.sql` sudah dijalankan di Supabase.
2. Pillow tersedia: `pip install Pillow` (sudah otomatis di env ini).
3. .env berisi SUPABASE_URL dan SUPABASE_SERVICE_KEY.
4. Folder `food_images_input/` punya file dengan nama `{food_code}.{ext}`.

Workflow:
1. Untuk setiap file gambar di input folder:
   - Resize ke max 800x600 dengan aspect-fit (kalau lebih kecil, biarkan).
   - Convert ke WebP quality 80 (~50 KB per gambar).
   - Upload ke Supabase Storage path `{food_code}.webp`.
   - Catat public URL.

2. Update CSV kolom `image_url` dengan URL Supabase untuk setiap food_code
   yang berhasil diupload.

Idempotent: file yang sudah ada di Storage akan di-overwrite (upsert mode).
Aman dijalankan berulang kali. Pakai --dry-run untuk preview tanpa upload.
"""

import argparse
import io
import os
import sys
from pathlib import Path

import pandas as pd
from PIL import Image

BACKEND = Path(__file__).resolve().parent.parent
ARTIFACTS = BACKEND / "ml" / "artifacts"
INPUT_DIR = BACKEND / "food_images_input"

# Konfigurasi gambar output
MAX_WIDTH = 800
MAX_HEIGHT = 600
WEBP_QUALITY = 80
BUCKET_NAME = "food-images"

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def load_env() -> tuple[str, str]:
    """Load SUPABASE_URL dan SUPABASE_SERVICE_KEY dari .env."""
    # Manual parse .env supaya tidak butuh extra dependency
    env_path = BACKEND / ".env"
    env: dict[str, str] = dict(os.environ)
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")

    url = env.get("SUPABASE_URL", "")
    key = env.get("SUPABASE_SERVICE_KEY", "") or env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        print("ERROR: SUPABASE_URL atau SUPABASE_SERVICE_KEY tidak ditemukan di .env")
        print("Pastikan .env berisi:")
        print("  SUPABASE_URL=https://xxx.supabase.co")
        print("  SUPABASE_SERVICE_KEY=eyJ...")
        sys.exit(1)

    return url, key


def compress_to_webp(image_path: Path) -> bytes:
    """
    Resize + convert ke WebP, return bytes.
    Aspect-fit ke MAX_WIDTH × MAX_HEIGHT, RGB only.
    """
    with Image.open(image_path) as img:
        # Convert ke RGB (handle PNG dengan alpha, JPEG, dll)
        if img.mode not in ("RGB", "L"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "RGBA":
                bg.paste(img, mask=img.split()[3])  # alpha channel
            else:
                bg.paste(img)
            img = bg
        elif img.mode == "L":
            img = img.convert("RGB")

        # Aspect-fit resize (jangan upscale)
        img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=WEBP_QUALITY, method=6)
        return buf.getvalue()


def collect_input_files() -> dict[str, Path]:
    """Scan folder input, return mapping food_code → file path."""
    if not INPUT_DIR.exists():
        print(f"ERROR: {INPUT_DIR} tidak ada.")
        print("Jalankan dulu: python scripts/prepare_food_images_folder.py")
        sys.exit(1)

    files: dict[str, Path] = {}
    for path in sorted(INPUT_DIR.iterdir()):
        if not path.is_file():
            continue
        if path.suffix.lower() not in VALID_EXTENSIONS:
            continue
        food_code = path.stem.strip()
        if not food_code or food_code.startswith("_"):
            continue
        files[food_code] = path
    return files


def upload_one(supabase, food_code: str, image_bytes: bytes) -> str:
    """Upload satu gambar ke Storage, return public URL."""
    storage = supabase.storage.from_(BUCKET_NAME)
    object_name = f"{food_code}.webp"

    # Upsert: kalau file sudah ada, overwrite
    storage.upload(
        path=object_name,
        file=image_bytes,
        file_options={"content-type": "image/webp", "upsert": "true"},
    )

    public_url = storage.get_public_url(object_name)
    # Bersihkan trailing "?" yang kadang muncul
    return public_url.rstrip("?")


def main() -> int:
    parser = argparse.ArgumentParser(description="Compress & upload food images to Supabase Storage")
    parser.add_argument("--dry-run", action="store_true", help="Preview tanpa upload")
    parser.add_argument(
        "--only", type=str, default=None,
        help="Comma-separated food_codes untuk diproses (default: semua)",
    )
    args = parser.parse_args()

    print("=" * 70)
    print("UPLOAD FOOD IMAGES → Supabase Storage")
    print("=" * 70)

    # Load environment & supabase client
    url, key = load_env()
    if not args.dry_run:
        try:
            from supabase import create_client
        except ImportError:
            print("ERROR: package `supabase` tidak terinstall. Jalankan:")
            print("  pip install supabase")
            return 1
        supabase = create_client(url, key)
    else:
        supabase = None

    # Collect files
    files = collect_input_files()
    if args.only:
        wanted = {c.strip() for c in args.only.split(",")}
        files = {k: v for k, v in files.items() if k in wanted}

    if not files:
        print("Tidak ada gambar untuk diupload.")
        print(f"Letakkan file di: {INPUT_DIR}")
        print("Format nama: {food_code}.jpg (atau .png/.webp)")
        return 0

    print(f"Input folder    : {INPUT_DIR}")
    print(f"Files ditemukan : {len(files)}")
    print(f"Target size     : max {MAX_WIDTH}x{MAX_HEIGHT}, WebP q{WEBP_QUALITY}")
    print(f"Bucket          : {BUCKET_NAME}")
    print(f"Dry run         : {args.dry_run}\n")

    # Load CSV
    csv_path = ARTIFACTS / "food_items_clean.csv"
    if not csv_path.exists():
        print(f"ERROR: {csv_path} tidak ditemukan")
        return 1

    df = pd.read_csv(csv_path)
    if "image_url" not in df.columns:
        df["image_url"] = ""

    # Index food_code → row index untuk fast lookup
    code_to_idx: dict[str, int] = {}
    for idx, row in df.iterrows():
        code = str(row["food_code"]).strip()
        if code:
            code_to_idx[code] = int(idx)

    # Process each file
    uploaded = 0
    skipped_unknown = 0
    failed = 0
    total_bytes = 0
    updates: list[tuple[int, str]] = []  # [(row_idx, public_url)]

    for food_code, image_path in files.items():
        if food_code not in code_to_idx:
            print(f"  ⚠ Skip {food_code}: tidak ada di CSV (food_code unknown)")
            skipped_unknown += 1
            continue

        try:
            compressed = compress_to_webp(image_path)
            size_kb = len(compressed) / 1024
            total_bytes += len(compressed)

            if args.dry_run:
                print(f"  ✓ {food_code:10s}  {size_kb:6.1f} KB  ({image_path.name})  [dry-run]")
            else:
                public_url = upload_one(supabase, food_code, compressed)
                updates.append((code_to_idx[food_code], public_url))
                print(f"  ✓ {food_code:10s}  {size_kb:6.1f} KB  ({image_path.name})")
            uploaded += 1
        except Exception as exc:
            print(f"  ✗ {food_code:10s}  GAGAL: {exc}")
            failed += 1

    print("\n[ Summary ]")
    print(f"  Uploaded    : {uploaded}")
    print(f"  Skipped     : {skipped_unknown}")
    print(f"  Failed      : {failed}")
    print(f"  Total size  : {total_bytes / 1024 / 1024:.2f} MB")

    # Update CSV
    if not args.dry_run and updates:
        for row_idx, public_url in updates:
            df.at[row_idx, "image_url"] = public_url
        df.to_csv(csv_path, index=False)
        print(f"\n[OK] CSV diupdate: {csv_path}")
        print(f"     {len(updates)} kolom image_url diisi.")

    if args.dry_run:
        print("\n[DRY-RUN] Tidak ada perubahan disimpan.")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
