"""Cari kode bahan TKPI yang dibutuhkan untuk decomposition masakan."""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))


def main():
    df = pd.read_csv(BACKEND / "ml" / "artifacts" / "food_items_clean.csv")

    keywords = [
        "daging sapi", "ayam", "ikan kakap", "santan", "kelapa",
        "kentang", "kol", "tauge", "kacang panjang", "buncis",
        "cabai", "bawang merah", "bawang putih", "jahe", "kunyit",
        "lengkuas", "tahu", "tempe", "beras", "mie", "asam jawa",
        "jagung", "wortel", "kangkung", "kemangi", "daun salam",
        "sereh", "kemiri", "merica", "telur ayam", "minyak",
        "garam", "gula", "tomat", "labu siam",
    ]

    print(f"Total dataset: {len(df)} item\n")

    for kw in keywords:
        matches = df[df["name"].str.lower().str.contains(kw, na=False)]
        if matches.empty:
            print(f"[{kw:20s}] -> TIDAK ADA")
        else:
            print(f"\n[{kw:20s}] -> {len(matches)} match")
            for _, row in matches.head(3).iterrows():
                print(
                    f"  {row['food_code']:8s} | "
                    f"Na={row['sodium_mg']:6.1f} | "
                    f"K={row['potassium_mg']:6.1f} | "
                    f"Ca={row['calcium_mg']:6.1f} | "
                    f"Fiber={row['fiber_g']:5.1f} | "
                    f"{row['name']}"
                )


if __name__ == "__main__":
    main()
