# TensiMenu — ML Notebooks

Folder ini berisi 5 versi model rekomendasi dari masing-masing anggota tim, plus 1 notebook perbandingan untuk memilih model terbaik untuk produksi.

## Daftar Notebook

| # | Notebook | Author | Pendekatan | Output |
|---|----------|--------|------------|--------|
| 01 | `01_preprocessing_feature_engineering.ipynb` | Raditya | CBF + Cosine + StandardScaler (baseline) | `artifacts/` |
| 02 | `02_whenny_weighted_cosine_minmax.ipynb` | Whenny | Weighted Cosine + MinMaxScaler | `artifacts_v2/` |
| 03 | `03_isrezal_knn_robustscaler.ipynb` | Isrezal | NearestNeighbors + RobustScaler | `artifacts_v3/` |
| 04 | `04_devani_kmeans_clustering.ipynb` | Devani | K-Means + Cluster-based Retrieval | `artifacts_v4/` |
| 05 | `05_najwa_composite_dash_rerank.ipynb` | Najwa | Two-stage Retrieval-and-Rerank (Cosine + DASH) | `artifacts_v5/` |
| 06 | `06_model_comparison.ipynb` | Tim | Evaluasi & ranking semua model | `comparison_results/` |

## Cara Menjalankan

### Tahap 1 — Setiap anggota jalankan notebook masing-masing

```bash
jupyter notebook notebooks/0X_<author>_<approach>.ipynb
```

Setiap notebook akan menghasilkan folder artefak terpisah (`artifacts/`, `artifacts_v2/`, dst.).

### Tahap 2 — Jalankan perbandingan setelah semua notebook selesai

```bash
jupyter notebook notebooks/06_model_comparison.ipynb
```

Notebook ini akan:
1. Memuat artefak dari semua model yang tersedia
2. Evaluasi pada 4 profil pengguna berbeda (hipertensi ringan, CKD, diabetes T2, lansia)
3. Hitung metrik: DASH Score, coverage, sodium violations, inference time, diversity
4. Tentukan model terbaik berdasarkan composite score (40% DASH, 30% safety, 20% speed, 10% diversity)
5. Simpan ke `comparison_results/`

## Perbedaan Antar Model (Ringkas)

**v1 (Baseline)** — Implementasi standar Content-Based Filtering. Cosine similarity dengan StandardScaler.

**v2 (Whenny)** — Mengganti scaler ke MinMax (range [0,1]) dan menerapkan bobot fitur eksplisit pada similarity. Hipotesis: nutrisi punya distribusi skewed, MinMax lebih stabil.

**v3 (Isrezal)** — RobustScaler yang tahan outlier (banyak makanan ekstrem di TKPI). Pakai sklearn `NearestNeighbors` untuk retrieval yang lebih efisien.

**v4 (Devani)** — Unsupervised clustering. K-Means kelompokkan makanan ke beberapa profil DASH, lalu retrieval hanya dari cluster yang cocok dengan target user.

**v5 (Najwa)** — Two-stage retrieval-and-rerank. Stage 1 ambil top-50 dengan cosine. Stage 2 re-rank dengan composite score `0.4*similarity + 0.6*DASH_score`. Memastikan rekomendasi tidak hanya mirip target tapi juga sehat.

## Metrik Evaluasi (Notebook 06)

| Metrik | Arah | Bobot Final |
|--------|------|-------------|
| Avg DASH Score @ Top-10 | Lebih tinggi lebih baik | 40% |
| Sodium Violations | Lebih rendah lebih baik | 30% |
| Inference Time (ms) | Lebih rendah lebih baik | 20% |
| Diversity (Jaccard antar profil) | Lebih rendah lebih baik | 10% |

## Output Akhir

Notebook 06 menghasilkan:
- `comparison_results/detailed_results.csv` — metrik per model per profil
- `comparison_results/final_ranking.csv` — ranking akhir
- Visualisasi 4 panel perbandingan
- Rekomendasi model untuk dipakai di backend produksi

## Reproducibility

Semua notebook menggunakan `random_state=42` di NumPy, Python `random`, dan scikit-learn untuk memastikan output identik di setiap run.
