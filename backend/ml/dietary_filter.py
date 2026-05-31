"""
Filter pantangan & preferensi makanan (food_restrictions) untuk rekomendasi.

Tanggung jawab tunggal: dari sebuah DataFrame makanan, buang item yang
melanggar pantangan/preferensi pengguna (vegan, vegetarian, alergi, dll).

Strategi 2 lapis:
1. Filter kategori — buang seluruh kategori TKPI yang tidak relevan
   (mis. vegan buang "Daging & Unggas", "Ikan, Kerang & Udang", "Susu", "Telur").
2. Filter kata kunci nama — tangkap item yang lolos kategori tapi nama-nya
   mengandung bahan terlarang (mis. "Soto Ayam" di kategori "Daging & Unggas"
   sudah ke-filter kategori; tapi "Nasi Goreng Ayam" di kategori "Serealia"
   perlu ditangkap via keyword).

Konservatif: kalau ragu, lebih baik buang (pantangan diet sering terkait
keyakinan/kesehatan, jadi false-negative lebih berbahaya dari false-positive).
"""

import logging
import re
from typing import Optional

import pandas as pd

logger = logging.getLogger(__name__)

# Kategori TKPI yang mengandung produk hewani
ANIMAL_MEAT_CATEGORIES = {"Daging & Unggas"}
ANIMAL_SEAFOOD_CATEGORIES = {"Ikan, Kerang & Udang"}
ANIMAL_DAIRY_CATEGORIES = {"Susu"}
ANIMAL_EGG_CATEGORIES = {"Telur"}

# Kata kunci nama makanan untuk tiap kelompok bahan.
# Lowercase, dicocokkan sebagai whole-word agar "ayam" tidak match "bayam".
MEAT_KEYWORDS = {
    "ayam", "sapi", "daging", "babi", "kambing", "bebek", "unggas", "kerbau",
    "kuda", "rusa", "domba", "hati", "ginjal", "babat", "usus", "ampela",
    "rendang", "sate", "soto", "rawon", "gulai", "semur", "bakso", "sosis",
    "kornet", "abon", "ham", "dendeng", "empal", "konro", "saksang", "se'i",
}
SEAFOOD_KEYWORDS = {
    "ikan", "udang", "cumi", "kerang", "kepiting", "rajungan", "teri",
    "tuna", "tongkol", "bandeng", "lele", "mujair", "mujahir", "nila",
    "gurame", "kakap", "tenggiri", "sarden", "sardines", "pindang",
    "pempek", "presto", "belut", "kembung", "patin", "bawal", "mas",
    "arsik", "pepes", "rusip", "peda", "cakalang", "salmon", "gabus",
}
DAIRY_KEYWORDS = {
    "susu", "keju", "yogurt", "yoghurt", "mentega", "butter", "krim",
    "cream", "kental manis", "es krim",
}
EGG_KEYWORDS = {
    "telur", "ceplok", "dadar", "omelet", "balado telur",
}
PEANUT_KEYWORDS = {
    "kacang", "pecel", "gado-gado", "ketoprak", "karedok", "rempeyek",
    "bumbu kacang", "sambal kacang",
}
PORK_KEYWORDS = {
    "babi", "bacon", "ham", "lapchiong", "char siu", "saksang", "b2",
}

NON_VEGETARIAN_KEYWORDS = MEAT_KEYWORDS | SEAFOOD_KEYWORDS
NON_VEGAN_KEYWORDS = MEAT_KEYWORDS | SEAFOOD_KEYWORDS | DAIRY_KEYWORDS | EGG_KEYWORDS


def _name_has_keyword(name: str, keywords: set[str]) -> bool:
    """True kalau nama mengandung salah satu keyword sebagai whole word."""
    n = name.lower()
    for kw in keywords:
        # whole-word / phrase match; \b cocok untuk kata, frasa ditangani langsung
        if " " in kw:
            if kw in n:
                return True
        elif re.search(rf"\b{re.escape(kw)}\b", n):
            return True
    return False


def apply_dietary_restrictions(
    df: pd.DataFrame,
    food_restrictions: Optional[list[str]],
) -> pd.DataFrame:
    """
    Buang item yang melanggar pantangan/preferensi pengguna.

    Args:
        df: DataFrame makanan (harus punya kolom 'name' dan 'category')
        food_restrictions: list kode restriction dari profil, mis.
            ["vegan"], ["alergi_seafood", "tidak_makan_babi"]

    Returns:
        DataFrame terfilter (copy). Kalau restriction kosong → return df apa adanya.
    """
    if not food_restrictions:
        return df

    result = df.copy()
    restrictions = {str(r).lower().strip() for r in food_restrictions}

    has_category = "category" in result.columns
    has_name = "name" in result.columns

    def exclude_by_category(categories: set[str]) -> None:
        nonlocal result
        if has_category:
            result = result[~result["category"].isin(categories)]

    def exclude_by_name(keywords: set[str]) -> None:
        nonlocal result
        if has_name:
            mask = result["name"].astype(str).apply(lambda n: _name_has_keyword(n, keywords))
            result = result[~mask]

    # ── Vegan: tanpa daging, ikan, susu, telur ──
    if "vegan" in restrictions:
        exclude_by_category(
            ANIMAL_MEAT_CATEGORIES | ANIMAL_SEAFOOD_CATEGORIES
            | ANIMAL_DAIRY_CATEGORIES | ANIMAL_EGG_CATEGORIES
        )
        exclude_by_name(NON_VEGAN_KEYWORDS)

    # ── Vegetarian: tanpa daging & ikan (susu/telur boleh) ──
    elif "vegetarian" in restrictions:
        exclude_by_category(ANIMAL_MEAT_CATEGORIES | ANIMAL_SEAFOOD_CATEGORIES)
        exclude_by_name(NON_VEGETARIAN_KEYWORDS)

    # ── Alergi / pantangan spesifik (bisa kombinasi) ──
    if "alergi_seafood" in restrictions:
        exclude_by_category(ANIMAL_SEAFOOD_CATEGORIES)
        exclude_by_name(SEAFOOD_KEYWORDS)

    if "alergi_susu" in restrictions:
        exclude_by_category(ANIMAL_DAIRY_CATEGORIES)
        exclude_by_name(DAIRY_KEYWORDS)

    if "alergi_telur" in restrictions:
        exclude_by_category(ANIMAL_EGG_CATEGORIES)
        exclude_by_name(EGG_KEYWORDS)

    if "alergi_kacang" in restrictions:
        exclude_by_name(PEANUT_KEYWORDS)

    if "tidak_makan_babi" in restrictions:
        exclude_by_name(PORK_KEYWORDS)

    logger.info(
        "Dietary filter %s: %d → %d item",
        sorted(restrictions), len(df), len(result),
    )
    return result
