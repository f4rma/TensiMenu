"""
Klasifikasi setiap item di food_items_clean.csv sebagai 'dish' (menu jadi)
atau 'ingredient' (bahan mentah / setengah jadi).

Output: tambahan kolom `is_dish` (boolean) ke food_items_clean.csv.

Aturan klasifikasi (dijalankan berurutan, hasil pertama yang cocok dipakai):

1. Kalau data_source mengandung "Estimasi" → DISH
   (semua masakan tradisional yang sudah kita estimasi nutrisinya)

2. Kalau kategori = "Buah" atau "Susu" → DISH
   (selalu siap-konsumsi langsung, walaupun nama ada kata "segar")

3. Kalau nama mengandung kata DISH (goreng, bakar, rebus, dll) → DISH
   (dijalankan sebelum cek RAW supaya "Kacang merah segar, rebus"
    dikenali sebagai dish karena ada "rebus")

4. Kalau nama mengandung kata RAW (mentah, segar, kering, var) → INGREDIENT

5. Default: INGREDIENT (konservatif — lebih baik tidak masuk rekomendasi
   daripada user dapat saran "Daging Sapi" sebagai menu makan siang)

Idempotent: re-run aman, langsung overwrite kolom is_dish.
"""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
ARTIFACTS = BACKEND / "ml" / "artifacts"

# Token yang menandakan bahan mentah/setengah jadi
RAW_TOKENS: frozenset[str] = frozenset({
    "mentah", "segar", "kering", "tepung", "var",
})

# Token yang menandakan menu jadi (proses memasak / nama hidangan)
DISH_TOKENS: frozenset[str] = frozenset({
    # Cara masak
    "goreng", "bakar", "rebus", "kukus", "panggang", "tumis", "rica",
    "balado", "pepes", "sambal", "asem", "asam", "lodeh", "kuah",
    "berkuah", "santan", "gulai", "kalio", "rendang", "saksang",
    "arsik", "asap", "kornet", "abon", "presto", "bumbu",
    # Nama hidangan/snack
    "soto", "sate", "rawon", "ketoprak", "karedok", "tinutuan",
    "papeda", "bakso", "nasi", "bubur", "lontong", "ketupat",
    "rempeyek", "keripik", "kerupuk", "manisan", "bacem",
    "pempek", "pencok", "sardines", "kaleng", "kalengan", "sosis",
    "ham", "rusip", "ceplok", "dadar", "balado",
    # Kue tradisional & camilan jadi
    "dodol", "bagea", "wajik", "kue", "cake", "biskuit", "roti",
    "selai", "jam", "selei", "permen", "coklat", "wafer", "es",
    "minuman", "jus", "sirup", "teh", "kopi", "yogurt", "puding",
    "rebung", "klepon", "onde", "lapis", "lemper", "lupis",
    "getuk", "cenil", "gemblong", "putu", "serabi",
    # Indikator umum bahwa ini sajian
    "masakan", "olahan",
})

# Kategori yang siap-konsumsi langsung (buah, susu)
READY_CATEGORIES: frozenset[str] = frozenset({
    "Buah", "Susu",
})


def classify(row: pd.Series) -> bool:
    """Return True kalau item adalah dish (menu jadi)."""
    data_source = str(row.get("data_source", "") or "")
    name = str(row.get("name", "") or "").lower()
    category = str(row.get("category", "") or "")

    # 1. Masakan tradisional yang kita tambahkan (paling kuat)
    if "Estimasi" in data_source:
        return True

    # 2. Kategori siap-konsumsi langsung (Buah, Susu) → SELALU dish
    #    Bahkan kalau nama mengandung "segar" — apel/jeruk segar tetap dish.
    if category in READY_CATEGORIES:
        return True

    # Tokenize nama
    for ch in (",", ".", "(", ")", "/", "-"):
        name = name.replace(ch, " ")
    tokens = set(name.split())

    # 3. Kalau ada kata DISH → dish (menang vs raw kalau keduanya ada)
    #    Misal "Kacang merah segar, rebus" → punya "rebus" → dish.
    if tokens & DISH_TOKENS:
        return True

    # 4. Kalau ada kata RAW → ingredient
    if tokens & RAW_TOKENS:
        return False

    # 5. Default konservatif: ingredient
    return False


def main() -> int:
    print("=" * 70)
    print("CLASSIFY DISHES vs INGREDIENTS")
    print("=" * 70)

    csv_path = ARTIFACTS / "food_items_clean.csv"
    if not csv_path.exists():
        print(f"ERROR: {csv_path} tidak ditemukan")
        return 1

    df = pd.read_csv(csv_path)
    print(f"Total items: {len(df)}\n")

    df["is_dish"] = df.apply(classify, axis=1)

    n_dish = int(df["is_dish"].sum())
    n_ing = len(df) - n_dish

    print(f"  Dishes      : {n_dish:>4} ({n_dish / len(df):.1%})")
    print(f"  Ingredients : {n_ing:>4} ({n_ing / len(df):.1%})\n")

    # Breakdown by category
    print("[ Dishes by category ]")
    by_cat = df[df["is_dish"]].groupby("category").size().sort_values(ascending=False)
    for cat, count in by_cat.items():
        print(f"  {cat:30s} : {count:>3}")
    print()

    # Sample dishes
    print("[ Sample dishes (10 random) ]")
    sample = df[df["is_dish"]].sample(min(10, n_dish), random_state=42)
    for _, row in sample.iterrows():
        print(f"  ✓ {row['name']:50s} ({row['category']})")
    print()

    # Sample ingredients (yang dipotong dari rekomendasi)
    print("[ Sample ingredients filtered out (10 random) ]")
    sample_ing = df[~df["is_dish"]].sample(min(10, n_ing), random_state=42)
    for _, row in sample_ing.iterrows():
        print(f"  ✗ {row['name']:50s} ({row['category']})")
    print()

    df.to_csv(csv_path, index=False)
    print(f"[OK] Disimpan ke {csv_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
