# TensiMenu - Model Evaluation Report

**Decision**: GO

**Generated**: 2026-05-27 19:12

## Per-Persona Results

| Persona | Precision@10 | Avg DASH Score | Categories | Safety Violations | Top 3 Recommendations |
|---------|-------------:|---------------:|-----------:|------------------:|----------------------|
| Dewasa Sehat | 0.70 | 67.0 | 4 | 0 | Kacang kedelai, goreng, Tauco cap meong, Tahu telur |
| Hipertensi Sedang (perempuan) | 0.70 | 67.2 | 4 | 0 | Kacang kedelai, goreng, Tauco cap meong, Tauco |
| Hipertensi Berat + CKD | 0.90 | 69.5 | 3 | 0 | Tahu telur, Tauco cap meong, Lamtoro var, lokal dengan kulit |
| Diabetes T2 | 0.80 | 69.1 | 4 | 0 | Kacang kedelai, goreng, Tauco cap meong, Tahu telur |
| Lansia Perempuan | 0.80 | 69.1 | 4 | 0 | Kacang kedelai, goreng, Tauco cap meong, Tahu telur |

## Latency
- **P50**: 3.0ms
- **P95**: 4.8ms (target < 2000ms)
- **P99**: 5.5ms (target < 5000ms)

## Coverage
- **Items covered**: 125 / 822 (15.2%)
- **Target**: >= 10% (simulasi 30 hari pemakaian dengan anti-repetisi)

## Decision Factors
- ✅ Precision@10 >= 0.70 (semua persona)
- ✅ Safety violations = 0
- ✅ Latency P95 < 2s
- ✅ Latency P99 < 5s
- ✅ Coverage >= 10% (simulasi 30 hari pemakaian)

## Conclusion

Model **memenuhi semua threshold** dan siap diintegrasikan ke aplikasi web.