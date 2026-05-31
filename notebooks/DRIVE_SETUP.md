# Setup Google Drive Bersama — TensiMenu

## Struktur Folder di Google Drive

Buat folder bersama di Google Drive dengan struktur:

```
My Drive/
└── TensiMenu_ML/
    ├── datasets/
    │   └── TKPI_2017_dataset  .csv
    ├── artifacts/          ← output notebook 01 (Raditya)
    ├── artifacts_v2/       ← output notebook 02 (Whenny)
    ├── artifacts_v3/       ← output notebook 03 (Isrezal)
    ├── artifacts_v4/       ← output notebook 04 (Devani)
    ├── artifacts_v5/       ← output notebook 05 (Najwa)
    └── comparison_results/ ← output notebook 06
```

## Langkah Setup

1. **Satu orang** (Raditya) buat folder `TensiMenu_ML` di Google Drive
2. Share folder ke semua anggota (Editor access)
3. Upload `TKPI_2017_dataset  .csv` ke subfolder `datasets/`
4. Setiap anggota buka notebook masing-masing di Colab
5. Jalankan cell pertama (mount Drive) — akan minta izin akses
6. Semua artefak otomatis tersimpan ke Drive bersama

## Path di Notebook

Semua notebook menggunakan path:
```python
DRIVE_BASE = '/content/drive/MyDrive/TensiMenu_ML'
DATA_PATH = f'{DRIVE_BASE}/datasets/TKPI_2017_dataset  .csv'
ARTIFACTS_DIR = Path(f'{DRIVE_BASE}/artifacts_vX')  # sesuai versi
```

## Push ke GitHub

Setelah notebook selesai dijalankan:
1. Download notebook dari Colab (File → Download .ipynb)
2. Letakkan di folder `notebooks/` di repo lokal
3. Commit dan push dari akun GitHub masing-masing

```bash
git add notebooks/0X_<nama>_<approach>.ipynb
git commit -m "feat(ml): add model vX - <approach> by <nama>"
git push origin main
```
