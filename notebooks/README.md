# TensiMenu — ML Notebooks

Folder ini berisi 5 versi model rekomendasi dari masing-masing anggota tim, plus 1 notebook perbandingan. **Model production menggunakan hybrid v1+v5** (two-stage retrieval-and-rerank).

## Model Production: Hybrid v1 + v5

**Arsitektur production** menggabungkan dua pendekatan terbaik:

### **Stage 1: Retrieval (v1 — Raditya)**
- Content-Based Filtering dengan cosine similarity
- StandardScaler normalization (robust terhadap outliers)
- Fast matrix multiplication: O(n) complexity
- **Output:** Top-N candidates berdasarkan similarity

### **Stage 2: Re-ranking (v5 — Najwa)**
- Composite scoring: `0.4 × similarity + 0.6 × DASH_score`
- Normalisasi similarity dan DASH score ke [0, 1]
- Balance antara **personalization** (user preference) dan **health** (DASH compliance)
- **Output:** Top-10 rekomendasi final

**Artifacts production:** `backend/ml/artifacts/` (v1.1.0)
- `scaler.pkl` — StandardScaler (trained on 822 items)
- `item_matrix.npy` — 822×5 normalized feature matrix
- `food_items_clean.csv` — master data dengan DASH scores
- `metadata.json` — model config & nutrient weights

**Kenapa hybrid v1+v5?**
- **Fast:** Cosine similarity (v1) efficient untuk 822 items
- **Accurate:** Composite re-rank (v5) prioritize makanan sehat
- **Balanced:** 40% preference + 60% health = personalized & safe
- **Production-ready:** Inference <100ms, tested pada 4 user profiles

---

## 📚 Daftar Notebook (Development & Research)

| # | Notebook | Author | Pendekatan | Status | Output |
|---|----------|--------|------------|--------|--------|
| 01 | `preprocessing_feature_engineering.ipynb` | Raditya | CBF + Cosine + StandardScaler | ✅ **PRODUCTION** | `artifacts/` |
| 02 | `weighted_cosine_minmax.ipynb` | Whenny | Weighted Cosine + MinMaxScaler | 📋 Research | `artifacts_v2/` |
| 03 | `knn_robustscaler.ipynb` | Isrezal | NearestNeighbors + RobustScaler | 📋 Research | `artifacts_v3/` |
| 04 | `kmeans_clustering.ipynb` | Devani | K-Means + Cluster-based Retrieval | 📋 Research | `artifacts_v4/` |
| 05 | `composite_dash_rerank.ipynb` | Najwa | Two-stage Retrieval-and-Rerank | ✅ **PRODUCTION** | `artifacts_v5/` |
| 06 | `model_comparison.ipynb` | Tim | Evaluasi & ranking semua model | 📋 Future | `comparison_results/` |

**Note:** Model v2-v4 adalah research alternatives untuk future A/B testing. Production menggunakan kombinasi v1+v5 yang sudah proven effective.

---

## Cara Menjalankan

### Production Model (v1 + v5)

Model ini sudah integrated di backend. Tidak perlu menjalankan notebook untuk production use.

**Location:** `backend/ml/content_based_filter.py`

**Usage:**
```python
from ml.content_based_filter import recommend
from ml.model_loader import load_artifacts

artifacts = load_artifacts()
recommendations = recommend(
    user_targets=user_targets,
    food_df=food_df,
    artifacts=artifacts,
    top_k=10,
    similarity_weight=0.4,  # v1 contribution
    dash_weight=0.6         # v5 contribution
)
```

### Development: Jalankan Notebook Individual

```bash
# v1 baseline (production)
jupyter notebook notebooks/01_preprocessing_feature_engineering.ipynb

# v5 composite (production)
jupyter notebook notebooks/05_najwa_composite_dash_rerank.ipynb

# Research alternatives (v2-v4)
jupyter notebook notebooks/02_whenny_weighted_cosine_minmax.ipynb
```

### Future: Model Comparison (v1-v5)

**Prerequisites:** Jalankan notebook 01-05 terlebih dahulu untuk generate semua artifacts.

```bash
jupyter notebook notebooks/06_model_comparison.ipynb
```

Notebook ini akan:
1. Memuat artefak dari semua model yang tersedia
2. Evaluasi pada 4 profil pengguna berbeda (hipertensi ringan, CKD, diabetes T2, lansia)
3. Hitung metrik: DASH Score, coverage, sodium violations, inference time, diversity
4. Generate ranking berdasarkan composite score
5. Simpan hasil ke `comparison_results/`


---

## 🔍 Perbedaan Antar Model (Detail)

### **v1 — Baseline** 

**Pendekatan:** Content-Based Filtering standar
- **Scaler:** StandardScaler (mean=0, std=1)
- **Similarity:** Cosine similarity
- **Features:** 5 DASH nutrients (Na, K, Ca, Fiber, Fat)

**Kelebihan:**
- ✅ Simple & proven approach
- ✅ Fast inference (<50ms)
- ✅ Robust terhadap outliers (StandardScaler uses mean/std)
- ✅ Reproducible (random_state=42)

**Kekurangan:**
- ⚠️ Pure similarity tidak guarantee healthy recommendations
- ⚠️ Bisa return high-similarity tapi low-DASH items

**Use case:** Foundation untuk retrieval cepat

---

### **v2 — Weighted Cosine** 

**Pendekatan:** Weighted similarity dengan MinMaxScaler
- **Scaler:** MinMaxScaler (range [0,1])
- **Similarity:** Weighted cosine dengan explicit feature weights
- **Hipotesis:** Nutrisi punya distribusi skewed, MinMax lebih stabil

**Kelebihan:**
- ✅ Feature weights customizable
- ✅ Range [0,1] interpretable

**Kekurangan:**
- ⚠️ MinMaxScaler sensitif terhadap outliers (extreme values compress range)
- ⚠️ Tidak lebih baik dari StandardScaler untuk dataset ini

**Status:** Alternative untuk A/B testing

---

### **v3 — KNN** 

**Pendekatan:** K-Nearest Neighbors dengan RobustScaler
- **Scaler:** RobustScaler (uses median, tahan outliers ekstrem)
- **Retrieval:** sklearn NearestNeighbors (efficient indexing)

**Kelebihan:**
- ✅ RobustScaler sangat tahan outliers
- ✅ KNN indexing efficient untuk repeated queries

**Kekurangan:**
- ⚠️ Overhead indexing (fit KNN = 200ms vs cosine 30ms)
- ⚠️ Tidak signifikan lebih baik dari StandardScaler untuk dataset ini
- ⚠️ Added complexity tanpa improvement berarti

**Status:** Overkill untuk 822 items, consider untuk dataset >10K

---

### **v4 — K-Means Clustering**

**Pendekatan:** Cluster-based retrieval
- **Clustering:** K-Means grouping makanan by DASH profile
- **Retrieval:** Find user's nearest cluster, search only within cluster

**Kelebihan:**
- ✅ Reduce search space (cluster pruning)
- ✅ Interesting untuk visualisasi (cluster = "dietary archetypes")

**Kekurangan:**
- ⚠️ User targets sangat personal → cluster-based kurang akurat
- ⚠️ Clustering overhead + cosine within cluster = slower
- ⚠️ K selection subjective

**Status:** Interesting concept tapi tidak optimal untuk personalized recommendations

---

### **v5 — Composite Re-ranking** 

**Pendekatan:** Two-stage retrieval-and-rerank
- **Stage 1:** Cosine similarity → top-50 candidates
- **Stage 2:** Composite score = `0.4×similarity_norm + 0.6×DASH_norm`

**Kelebihan:**
- ✅ ✅ **Balance personalization + health** (best of both worlds)
- ✅ Similarity ensures user preference, DASH ensures safety
- ✅ Minimal overhead (re-rank only 50 items, not all 822)
- ✅ Tunable weights (adjust similarity:dash ratio per use case)


## 📚 References

- **DASH Diet Guidelines:** NIH/AHA 2019
- **Mifflin-St Jeor BMR:** Journal of the American Dietetic Association, 2005
- **Content-Based Filtering:** Recommender Systems Handbook (Ricci et al., 2011)
- **Cosine Similarity:** Information Retrieval (Manning et al., 2008)

---

## 👥 Contributors

| Notebook | Author | Kontribusi |
|----------|--------|------------|
| v1 | Raditya Putra Farma | Baseline CBF + StandardScaler (Production Stage 1) |
| v2 | Whenny Zenica | Weighted Cosine + MinMaxScaler (Research) |
| v3 | Isrezal Akbar | KNN + RobustScaler (Research) |
| v4 | Devani | K-Means Clustering (Research) |
| v5 | Najwa Kurnia | Composite Re-ranking (Production Stage 2) |
| v6 | Tim TensiMenu | Model Comparison & Evaluation (Future) |

---

**Last Updated:** 2026-06-02  
**Production Model:** v1+v5 Hybrid (Two-Stage Retrieval-and-Rerank)  
**Version:** 1.1.0
