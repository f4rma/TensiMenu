"""
Analisis dataset HuggingFace untuk evaluasi kelayakan TensiMenu.

Pertanyaan kunci:
1. Berapa banyak masakan jadi (bukan bahan)?
2. Cakupan keberagaman regional?
3. Apa yang hilang dibanding TKPI 2017 (sodium, potassium, dll)?
"""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
DATASET_PATH = BACKEND.parent / "datasets" / "indonesian_food_nutrition_hf.csv"


def classify(name: str) -> str:
    """Klasifikasi: bahan/buah/sayur (raw) vs masakan."""
    name_lower = name.lower()

    raw_kw = ["segar", "mentah", "kering tanpa garam"]
    cooked_kw = [
        "masakan", "goreng", "rebus", "kukus", "bakar", "panggang",
        "tumis", "sop", "soto", "gulai", "rendang", "sayur", "sate",
        "asam", "asem", "opor", "rawon", "pecel", "lontong", "nasi",
        "bubur", "mie", "bakso", "sup", "kari", "semur",
    ]

    if any(kw in name_lower for kw in raw_kw):
        return "Bahan/Segar"
    if any(kw in name_lower for kw in cooked_kw):
        return "Masakan Jadi"
    return "Lainnya"


def search_dishes(df, keywords):
    """Cari masakan berdasarkan keyword."""
    results = {}
    for kw in keywords:
        matches = df[df["name"].str.lower().str.contains(kw, na=False)]
        results[kw] = matches
    return results


def main():
    df = pd.read_csv(DATASET_PATH)
    print(f"Total: {len(df)} item\n")

    # Klasifikasi
    df["form"] = df["name"].apply(classify)
    print("=" * 70)
    print("KLASIFIKASI BENTUK")
    print("=" * 70)
    print(df["form"].value_counts())
    print()
    pct = df["form"].value_counts(normalize=True) * 100
    for form, p in pct.items():
        print(f"  {form:20s}: {p:5.1f}%")

    # Cari masakan Nusantara
    print("\n" + "=" * 70)
    print("MASAKAN NUSANTARA YANG DITEMUKAN")
    print("=" * 70)

    keywords = [
        "rendang", "soto", "gado", "sayur asem", "sayur lodeh",
        "bakso", "sate", "nasi goreng", "rawon", "gulai",
        "opor", "pecel", "lontong", "nasi uduk", "bubur", "mie",
        "ketoprak", "tongseng", "rujak", "ayam", "ikan",
        "tahu", "tempe", "telur", "soto betawi", "soto madura",
        "soto banjar", "rendang padang", "bakwan", "lumpia", "siomay",
        "asinan", "perkedel",
    ]

    total_masakan = set()
    for kw in keywords:
        matches = df[df["name"].str.lower().str.contains(kw, na=False)]
        if not matches.empty:
            print(f"\n[{kw.upper()}] -> {len(matches)} item")
            for _, row in matches.head(5).iterrows():
                print(f"  - {row['name']:40s} | "
                      f"kal={row['calories']:6.1f} | "
                      f"prot={row['proteins']:5.1f} | "
                      f"lemak={row['fat']:5.1f} | "
                      f"karb={row['carbohydrate']:5.1f}")
            total_masakan.update(matches["id"].tolist())

    print(f"\n{'=' * 70}")
    print(f"TOTAL MASAKAN UNIK: {len(total_masakan)} item")
    print("=" * 70)

    # Analisis nutrisi
    print("\n" + "=" * 70)
    print("NUTRISI YANG TERSEDIA vs YANG DIBUTUHKAN DASH")
    print("=" * 70)

    print("\nKolom nutrisi DI DATASET HF:")
    nutrient_cols = ["calories", "proteins", "fat", "carbohydrate"]
    for c in nutrient_cols:
        if c in df.columns:
            print(f"  ✓ {c}")

    print("\nKolom nutrisi YANG DIBUTUHKAN UNTUK DASH:")
    needed = ["sodium_mg", "potassium_mg", "calcium_mg", "magnesium_mg", "fiber_g", "saturated_fat_g"]
    for c in needed:
        status = "✓" if c in df.columns else "✗ TIDAK ADA"
        print(f"  {status} {c}")

    print("\n" + "=" * 70)
    print("KESIMPULAN")
    print("=" * 70)
    print(f"""
Dataset HF berisi {len(df)} item dengan klasifikasi:
- Bahan/Segar: {(df['form'] == 'Bahan/Segar').sum()} item
- Masakan Jadi: {(df['form'] == 'Masakan Jadi').sum()} item
- Lainnya (mixed): {(df['form'] == 'Lainnya').sum()} item

Masakan Nusantara unik yang ditemukan via keyword: {len(total_masakan)} item.

KEKURANGAN KRITIS:
- Hanya ada 4 kolom nutrisi (calories, proteins, fat, carbohydrate)
- TIDAK ADA: sodium, potassium, calcium, magnesium, fiber, saturated fat
- DASH membutuhkan SEMUA nutrisi yang hilang itu untuk filtering hipertensi

REKOMENDASI:
1. Dataset HF tidak bisa langsung dipakai untuk DASH filtering
2. Tetap gunakan TKPI 2017 untuk model rekomendasi (lengkap nutrisinya)
3. Manfaatkan dataset HF sebagai REFERENSI NAMA & GAMBAR masakan
4. Untuk masakan Nusantara, hitung nutrisi DASH via DECOMPOSITION:
   - Misal: "Rendang Sapi" = 100g daging sapi (TKPI) + 30ml santan (TKPI) + bumbu
   - Approximation: jumlahkan nutrisi dari komposisi bahan TKPI
""")


if __name__ == "__main__":
    main()
