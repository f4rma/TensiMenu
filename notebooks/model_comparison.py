import json, time, warnings
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.metrics.pairwise import cosine_similarity

warnings.filterwarnings('ignore')
sns.set_style('whitegrid')

# Mount Google Drive
try:
    from google.colab import drive
    drive.mount('/content/drive')
    IN_COLAB = True
    DRIVE_BASE = Path('/content/drive/MyDrive/TensiMenu_ML')
    print(f'Google Drive mounted. Base: {DRIVE_BASE}')
except ImportError:
    IN_COLAB = False
    DRIVE_BASE = Path('.')  # lokal: jalankan dari folder notebooks/
    print('Bukan di Colab — menggunakan path lokal.')

DASH_FEATURES = ['sodium_mg', 'potassium_mg', 'calcium_mg', 'fiber_g', 'fat_total_g']
NUTRIENT_WEIGHTS = {
    'sodium_mg':    {'direction': 'lower',  'weight': 0.30},
    'potassium_mg': {'direction': 'higher', 'weight': 0.25},
    'calcium_mg':   {'direction': 'higher', 'weight': 0.20},
    'fiber_g':      {'direction': 'higher', 'weight': 0.15},
    'fat_total_g':  {'direction': 'lower',  'weight': 0.10},
}

MODEL_DIRS = {
    'v1_cosine_standard': DRIVE_BASE / 'artifacts',
    'v2_weighted_minmax': DRIVE_BASE / 'artifacts_v2',
    'v3_knn_robust': DRIVE_BASE / 'artifacts_v3',
    'v4_kmeans': DRIVE_BASE / 'artifacts_v4',
    'v5_composite': DRIVE_BASE / 'artifacts_v5',
}

# Cek artefak tersedia
available = {}
for name, path in MODEL_DIRS.items():
    if path.exists() and (path / 'metadata.json').exists():
        available[name] = path
        print(f'✓ {name} tersedia di {path}')
    else:
        print(f'✗ {name} TIDAK tersedia di {path} — jalankan notebook terkait dulu')

if not available:
    raise RuntimeError('Tidak ada artefak yang tersedia. Jalankan notebook 01-05 dulu.')

# Helper functions
def calculate_personal_targets(profile):
    w, h, age, g = profile['weight_kg'], profile['height_cm'], profile['age'], profile['gender']
    bmr = (10*w) + (6.25*h) - (5*age) + (5 if g == 'laki-laki' else -161)
    t = {'sodium_mg': 2300.0, 'potassium_mg': 4000.0,
         'calcium_mg': 1200.0 if age > 50 else 1000.0,
         'fiber_g': 38.0 if g == 'laki-laki' else 25.0,
         'fat_total_g': round(bmr * 0.27 / 9, 1)}
    if 'ckd' in profile.get('comorbidities', []):
        t['sodium_mg'] = 1500.0; t['potassium_mg'] = 2000.0
    if profile.get('systolic_bp', 0) >= 150:
        t['sodium_mg'] = 1500.0
    return t

def calculate_dash_score(nutrition, targets):
    total = 0.0
    for n, c in NUTRIENT_WEIGHTS.items():
        actual = nutrition.get(n, 0.0); target = targets.get(n, 1.0)
        if target <= 0: cont = 0.0
        elif c['direction'] == 'higher': cont = min(actual / target, 1.0)
        else: cont = 1.0 if actual <= target else max(0.0, 1.0 - (actual - target) / target)
        total += cont * c['weight']
    return round(total * 100, 1)

# Test profiles untuk evaluasi
TEST_PROFILES = [
    {'name': 'Hipertensi Ringan', 'gender': 'laki-laki', 'weight_kg': 70, 'height_cm': 170, 'age': 45, 'comorbidities': [], 'systolic_bp': 140},
    {'name': 'CKD + Hipertensi', 'gender': 'perempuan', 'weight_kg': 60, 'height_cm': 158, 'age': 55, 'comorbidities': ['ckd'], 'systolic_bp': 160},
    {'name': 'Diabetes T2', 'gender': 'laki-laki', 'weight_kg': 85, 'height_cm': 175, 'age': 35, 'comorbidities': ['diabetes_t2'], 'systolic_bp': 135},
    {'name': 'Lansia Sehat', 'gender': 'perempuan', 'weight_kg': 55, 'height_cm': 155, 'age': 65, 'comorbidities': [], 'systolic_bp': 130},
]
print(f'Test profiles: {len(TEST_PROFILES)}')

def load_model(name, path):
    """Load artefak dan kembalikan dict berisi semua komponen."""
    scaler = joblib.load(path / 'scaler.pkl')
    X_scaled = np.load(path / 'item_matrix.npy')
    df = pd.read_csv(path / 'food_items_clean.csv')
    with open(path / 'metadata.json', encoding='utf-8') as f:
        meta = json.load(f)
    
    bundle = {'name': name, 'scaler': scaler, 'X': X_scaled, 'df': df, 'meta': meta}
    
    # Load model-specific files
    if (path / 'knn_model.pkl').exists():
        bundle['knn'] = joblib.load(path / 'knn_model.pkl')
    if (path / 'kmeans_model.pkl').exists():
        bundle['kmeans'] = joblib.load(path / 'kmeans_model.pkl')
    if (path / 'feature_weights.npy').exists():
        bundle['weights'] = np.load(path / 'feature_weights.npy')
    
    return bundle

models = {name: load_model(name, path) for name, path in available.items()}
for name, m in models.items():
    print(f'{name}: {len(m["df"])} item, {m["X"].shape}')

def recommend_v1_cosine(model, profile, top_k=10):
    """Baseline cosine."""
    targets = calculate_personal_targets(profile)
    user_vec = np.array([targets[f] for f in DASH_FEATURES])
    user_scaled = model['scaler'].transform(user_vec.reshape(1, -1))
    sims = cosine_similarity(user_scaled, model['X'])[0]
    df = model['df'].copy(); df['similarity'] = sims
    return df.nlargest(top_k, 'similarity')

def recommend_v2_weighted(model, profile, top_k=10):
    targets = calculate_personal_targets(profile)
    user_vec = np.array([targets[f] for f in DASH_FEATURES])
    user_scaled = model['scaler'].transform(user_vec.reshape(1, -1))[0]
    weights = model.get('weights', np.ones(len(DASH_FEATURES)))
    sqrt_w = np.sqrt(weights)
    user_w = (user_scaled * sqrt_w).reshape(1, -1)
    items_w = model['X'] * sqrt_w
    sims = cosine_similarity(user_w, items_w)[0]
    df = model['df'].copy(); df['similarity'] = sims
    return df.nlargest(top_k, 'similarity')

def recommend_v3_knn(model, profile, top_k=10):
    targets = calculate_personal_targets(profile)
    user_vec = np.array([targets[f] for f in DASH_FEATURES])
    user_scaled = model['scaler'].transform(user_vec.reshape(1, -1))
    distances, indices = model['knn'].kneighbors(user_scaled, n_neighbors=top_k)
    df = model['df'].iloc[indices[0]].copy()
    df['similarity'] = 1 - distances[0]
    return df

def recommend_v4_kmeans(model, profile, top_k=10, n_clusters=2):
    targets = calculate_personal_targets(profile)
    user_vec = np.array([targets[f] for f in DASH_FEATURES])
    user_scaled = model['scaler'].transform(user_vec.reshape(1, -1))
    centroid_dists = np.linalg.norm(model['kmeans'].cluster_centers_ - user_scaled, axis=1)
    closest = np.argsort(centroid_dists)[:n_clusters]
    df = model['df'].copy()
    candidates = df[df['cluster'].isin(closest)]
    cand_idx = candidates.index.tolist()
    sims = cosine_similarity(user_scaled, model['X'][cand_idx])[0]
    candidates = candidates.copy(); candidates['similarity'] = sims
    return candidates.nlargest(top_k, 'similarity')

def recommend_v5_composite(model, profile, top_k=10, alpha=0.4, candidate_size=50):
    targets = calculate_personal_targets(profile)
    user_vec = np.array([targets[f] for f in DASH_FEATURES])
    user_scaled = model['scaler'].transform(user_vec.reshape(1, -1))
    sims = cosine_similarity(user_scaled, model['X'])[0]
    df = model['df'].copy(); df['similarity'] = sims
    candidates = df.nlargest(candidate_size, 'similarity').copy()
    candidates['dash_score'] = candidates.apply(
        lambda r: calculate_dash_score({f: r[f] for f in DASH_FEATURES}, targets), axis=1
    )
    sim_norm = (candidates['similarity'] - candidates['similarity'].min()) / (candidates['similarity'].max() - candidates['similarity'].min() + 1e-9)
    dash_norm = candidates['dash_score'] / 100.0
    candidates['composite_score'] = alpha * sim_norm + (1 - alpha) * dash_norm
    return candidates.nlargest(top_k, 'composite_score')

RECOMMENDERS = {
    'v1_cosine_standard': recommend_v1_cosine,
    'v2_weighted_minmax': recommend_v2_weighted,
    'v3_knn_robust': recommend_v3_knn,
    'v4_kmeans': recommend_v4_kmeans,
    'v5_composite': recommend_v5_composite,
}

def evaluate_recommendations(recs_df, profile, sodium_limit=None):
    """Hitung metrik untuk satu hasil rekomendasi."""
    targets = calculate_personal_targets(profile)
    if sodium_limit is None:
        sodium_limit = targets['sodium_mg']
    
    # DASH Score per item
    dash_scores = []
    for _, row in recs_df.iterrows():
        nutr = {f: row[f] for f in DASH_FEATURES}
        dash_scores.append(calculate_dash_score(nutr, targets))
    
    # Coverage (kategori unik)
    n_categories = recs_df['category'].nunique() if 'category' in recs_df.columns else 0
    
    # Violations (item dengan sodium > limit)
    violations = (recs_df['sodium_mg'] > sodium_limit).sum() if 'sodium_mg' in recs_df.columns else 0
    
    return {
        'mean_dash_score': np.mean(dash_scores),
        'min_dash_score': np.min(dash_scores),
        'max_dash_score': np.max(dash_scores),
        'n_categories': n_categories,
        'sodium_violations': int(violations),
    }

# Run evaluasi semua kombinasi
results = []
for model_name, model in models.items():
    if model_name not in RECOMMENDERS:
        continue
    fn = RECOMMENDERS[model_name]
    
    for profile in TEST_PROFILES:
        # Inference time
        start = time.perf_counter()
        recs = fn(model, profile, top_k=10)
        elapsed_ms = (time.perf_counter() - start) * 1000
        
        metrics = evaluate_recommendations(recs, profile)
        metrics.update({
            'model': model_name,
            'profile': profile['name'],
            'inference_ms': round(elapsed_ms, 2),
        })
        results.append(metrics)

results_df = pd.DataFrame(results)
print('=== HASIL EVALUASI ===')
results_df

summary = results_df.groupby('model').agg({
    'mean_dash_score': 'mean',
    'min_dash_score': 'mean',
    'n_categories': 'mean',
    'sodium_violations': 'sum',
    'inference_ms': 'mean',
}).round(2)
summary.columns = ['Avg DASH Score', 'Min DASH Score', 'Avg Categories', 'Total Violations', 'Avg Inference (ms)']
summary = summary.sort_values('Avg DASH Score', ascending=False)
print('=== RINGKASAN PER MODEL ===')
summary

# Visualisasi perbandingan
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# 1. Avg DASH Score
summary['Avg DASH Score'].plot(kind='barh', ax=axes[0,0], color='steelblue')
axes[0,0].set_title('Average DASH Score @ Top-10 (lebih tinggi = lebih baik)')
axes[0,0].set_xlabel('DASH Score (0-100)')

# 2. Inference Time
summary['Avg Inference (ms)'].plot(kind='barh', ax=axes[0,1], color='coral')
axes[0,1].set_title('Inference Time (lebih rendah = lebih cepat)')
axes[0,1].set_xlabel('Milidetik')

# 3. Coverage
summary['Avg Categories'].plot(kind='barh', ax=axes[1,0], color='mediumseagreen')
axes[1,0].set_title('Diversity (jumlah kategori unik @ Top-10)')
axes[1,0].set_xlabel('Kategori unik')

# 4. Violations
summary['Total Violations'].plot(kind='barh', ax=axes[1,1], color='crimson')
axes[1,1].set_title('Pelanggaran Batas Natrium (lebih rendah = lebih aman)')
axes[1,1].set_xlabel('Total pelanggaran')

plt.suptitle('Perbandingan 5 Model TensiMenu', y=1.0, fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()

def jaccard(a, b):
    a, b = set(a), set(b)
    return len(a & b) / len(a | b) if (a | b) else 0.0

diversity_results = {}
for model_name, model in models.items():
    if model_name not in RECOMMENDERS: continue
    fn = RECOMMENDERS[model_name]
    
    rec_sets = [
        fn(model, p, top_k=10)['food_code'].tolist()
        for p in TEST_PROFILES
    ]
    
    # Pairwise Jaccard
    pairs = []
    for i in range(len(rec_sets)):
        for j in range(i+1, len(rec_sets)):
            pairs.append(jaccard(rec_sets[i], rec_sets[j]))
    
    diversity_results[model_name] = np.mean(pairs)

div_df = pd.Series(diversity_results, name='Avg Jaccard').sort_values()
print('=== DIVERSITY (Jaccard antar profil) ===')
print('Lebih rendah = rekomendasi lebih PERSONAL\n')
div_df.round(3)

# Final scoring (composite)
final = summary.copy()
final['Diversity'] = div_df

# Normalisasi (lebih baik = nilai lebih tinggi)
norm_dash = final['Avg DASH Score'] / 100
norm_safety = 1 - (final['Total Violations'] / (final['Total Violations'].max() + 1))
norm_speed = 1 - (final['Avg Inference (ms)'] / final['Avg Inference (ms)'].max())
norm_diversity = 1 - final['Diversity']  # rendah = lebih baik

final['Final Score'] = (0.4 * norm_dash + 0.3 * norm_safety + 0.2 * norm_speed + 0.1 * norm_diversity).round(3)
final = final.sort_values('Final Score', ascending=False)

print('=== FINAL RANKING ===')
print(final[['Avg DASH Score', 'Total Violations', 'Avg Inference (ms)', 'Diversity', 'Final Score']])
print(f'\n🏆 Model terbaik: {final.index[0]}')
print(f'   Final score: {final.iloc[0]["Final Score"]}')

# Simpan hasil perbandingan
OUTPUT = Path('comparison_results')
OUTPUT.mkdir(exist_ok=True)
results_df.to_csv(OUTPUT / 'detailed_results.csv', index=False)
final.to_csv(OUTPUT / 'final_ranking.csv')
print(f'✓ Hasil tersimpan di {OUTPUT.resolve()}')
