# Model Artifacts Changelog

## v1.1.0 (2026-05-27)

### Added
- 30 masakan tradisional Nusantara dari berbagai daerah:
  - **Sumatera Barat**: Rendang Sapi, Gulai Ayam, Sate Ayam
  - **Jawa Tengah**: Soto Ayam
  - **Jawa Barat**: Karedok, Pepes Ikan, Sayur Asem
  - **Jawa Timur**: Pecel Sayur, Rawon
  - **Jakarta**: Gado-gado, Soto Betawi, Ketoprak, Nasi Uduk
  - **Sumatera Utara**: Saksang, Arsik Ikan Mas
  - **Sulawesi Selatan**: Coto Makassar, Konro
  - **Sulawesi Utara**: Tinutuan (Bubur Manado)
  - **Papua**: Papeda Ikan Kuah Kuning
  - **Nasional**: Nasi Goreng, Mie Goreng, Bakso Sapi, Ayam Goreng Lengkuas,
    Tempe Goreng, Tahu Bacem, Ikan Bakar, Capcay, Tumis Kangkung, Telur Balado
- Kolom baru di dataset:
  - `region` — asal daerah masakan
  - `meal_type` — sarapan/makan_siang/makan_malam/lauk
  - `is_estimated` — flag untuk transparansi data
  - `reference` — sumber decomposition

### Changed
- Total dataset: 792 → 822 item
- StandardScaler dilatih ulang dengan dataset gabungan
- `item_matrix.npy` dibangun ulang (822, 5)
- DASH score regenerasi untuk seluruh dataset

### Sumber Data Masakan
- USDA FoodData Central (Indonesian fried rice, chicken satay, beef coconut sauce, tempeh)
- EatThisMuch (Indonesian Gado-gado Salad)
- Decomposition manual dari resep standar Indonesia × TKPI bahan

### Catatan
- Semua 30 masakan ditandai `is_estimated=true` (perlu validasi ahli gizi)
- DASH score menggunakan formula `SERVING_TARGET_RATIO=1/3`
- Threshold kategori: Sangat Baik ≥80, Baik ≥60, Cukup ≥40, Perlu Perhatian <40

### Test Results (37/37 PASSED)
- Precision@10 untuk 5 persona: 0.70-0.90 (target ≥ 0.70)
- Safety violations: 0 (CKD compliance 100%)
- Latency P99: 5.9ms (target < 5000ms)
- Coverage: 15.2% via simulasi 30 hari (target ≥ 10%)

### Backup
- Artefak v1.0.0 disimpan di `backup_v1.0.0/`

---

## v1.0.0 (2026-05-21)

### Initial release
- 792 item TKPI 2017 (Tabel Komposisi Pangan Indonesia, Kemenkes)
- 5 fitur DASH: sodium_mg, potassium_mg, calcium_mg, fiber_g, fat_total_g
- StandardScaler-based normalization
- Cosine similarity + composite ranking dengan DASH score
- Filter komorbid pre-similarity (CKD, diabetes T2)
- Anti-repetisi 3 hari rolling window
