"""
Tabel porsi standar (gram) per kategori makanan TKPI.

Tujuan: memberi default serving_g yang lebih realistis daripada flat 100 g
untuk semua makanan. Angka berbasis Pedoman Gizi Seimbang (PGS) Kemenkes RI
dan AKG 2019 untuk satu sajian standar (~"piring" makan utama).

Catatan penting:
- Ini DEFAULT untuk UI dan rekomendasi awal — user tetap bisa mengubah
  porsi saat mencatat konsumsi.
- Nilai konservatif (cenderung kecil) supaya tidak over-estimate kalori
  atau natrium dari rekomendasi.
- Untuk makanan jadi (rendang, soto, dll) di mana kategori kurang spesifik,
  default jatuh ke 100 g (asumsi 1 potong / 1 porsi sedang).
"""

# Porsi standar per kategori dataset TKPI (gram per 1 sajian).
# Sumber: PGS 2014 Kemenkes RI, AKG 2019, dan riset porsi rumah tangga
# Indonesia (BKP-BPS).
SERVING_SIZE_BY_CATEGORY: dict[str, float] = {
    # Makanan pokok karbohidrat — 1 centong nasi / 1 potong umbi sedang
    "Serealia": 100.0,
    "Umbi Berpati": 100.0,

    # Lauk hewani — 1 potong sedang (1 ekor ikan kecil, 1 potong daging)
    "Daging & Unggas": 50.0,
    "Ikan, Kerang & Udang": 50.0,
    "Telur": 55.0,  # 1 butir telur ayam

    # Lauk nabati — 1 potong tempe / 2 potong tahu
    "Kacang & Biji": 50.0,

    # Sayur — 1 mangkuk kecil sayur matang
    "Sayuran": 100.0,

    # Buah — 1 buah sedang (pisang, jeruk, apel kecil)
    "Buah": 100.0,

    # Susu / produk susu — 1 gelas
    "Susu": 200.0,
}

# Fallback kalau kategori tidak dikenal.
DEFAULT_SERVING_G = 100.0


def get_default_serving_g(category: str | None) -> float:
    """
    Ambil porsi standar (gram) untuk kategori makanan.

    Args:
        category: nilai kolom 'category' dari food_items_clean.csv.
                  Boleh None / kosong → fallback ke DEFAULT_SERVING_G.

    Returns:
        float gram per sajian.
    """
    if not category:
        return DEFAULT_SERVING_G
    return SERVING_SIZE_BY_CATEGORY.get(str(category).strip(), DEFAULT_SERVING_G)
