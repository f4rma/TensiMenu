"""
Download dan inspect Indonesian Food Nutrition Dataset dari HuggingFace.
URL: https://huggingface.co/datasets/eriko-syah/indonesian-food
"""

import sys
from pathlib import Path

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BACKEND.parent / "datasets"
OUTPUT_DIR.mkdir(exist_ok=True)


def main():
    print("=" * 80)
    print("INSPECT: Indonesian Food Nutrition Dataset (HuggingFace)")
    print("=" * 80)

    try:
        from datasets import load_dataset
        ds = load_dataset("eriko-syah/indonesian-food")
        df = ds["train"].to_pandas()
    except Exception as e:
        print(f"Failed via datasets library: {e}")
        print("\nTrying direct CSV download from HF Hub...")
        # Fallback: HuggingFace datasets biasanya ada di /resolve/main/data/...
        df = pd.read_parquet(
            "https://huggingface.co/datasets/eriko-syah/indonesian-food/resolve/main/data/train-00000-of-00001.parquet"
        )

    print(f"\nTotal rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    print(f"\nDtypes:")
    print(df.dtypes)

    print("\n" + "=" * 80)
    print("STATISTIK NUTRISI")
    print("=" * 80)
    numeric_cols = df.select_dtypes(include="number").columns
    print(df[numeric_cols].describe())

    print("\n" + "=" * 80)
    print("SAMPLE 20 ITEM PERTAMA")
    print("=" * 80)
    print(df.head(20).to_string(index=False))

    print("\n" + "=" * 80)
    print("PENCARIAN MASAKAN NUSANTARA POPULER")
    print("=" * 80)
    keywords = [
        "rendang", "soto", "gado", "sayur asem", "bakso", "sate",
        "nasi goreng", "ayam", "rawon", "gulai", "opor", "pecel",
        "lontong", "nasi uduk", "bubur", "mie ayam", "ketoprak",
        "tongseng", "tahu", "tempe",
    ]

    if "name" in df.columns:
        col = "name"
    else:
        col = df.columns[df.columns.str.lower().str.contains("name|food|item")][0]

    for kw in keywords:
        matches = df[df[col].str.lower().str.contains(kw, na=False)]
        if not matches.empty:
            print(f"\n[{kw.upper()}] -> {len(matches)} item ditemukan")
            print(matches.head(3).to_string(index=False))

    print("\n" + "=" * 80)
    print("SAVE LOKAL")
    print("=" * 80)
    out_path = OUTPUT_DIR / "indonesian_food_nutrition_hf.csv"
    df.to_csv(out_path, index=False)
    print(f"Tersimpan: {out_path}")
    print(f"Total: {len(df)} item")


if __name__ == "__main__":
    main()
