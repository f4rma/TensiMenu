"""
Klasifikasi tekanan darah TensiMenu.

Sumber kebenaran kategori BP di sisi backend. Selaras dengan
frontend `classifyBP` di components/blood-pressure/types.ts.

Acuan:
  - Hipertensi: AHA/ACC 2017.
  - Hipotensi: ambang umum sistolik <= 90 mmHg atau diastolik <= 60 mmHg.
"""

from __future__ import annotations

from typing import Optional

# --- Ambang sistolik (mmHg) ---
CRISIS_SYSTOLIC = 180
STAGE2_SYSTOLIC = 140
STAGE1_SYSTOLIC = 130
ELEVATED_SYSTOLIC = 120
HYPOTENSION_SYSTOLIC = 90

# --- Ambang diastolik (mmHg) ---
CRISIS_DIASTOLIC = 120
STAGE2_DIASTOLIC = 90
STAGE1_DIASTOLIC = 80
HYPOTENSION_DIASTOLIC = 60

# --- Label kategori — HARUS sama dengan BPCategory di frontend ---
CAT_HYPOTENSION = "Hipotensi"
CAT_NORMAL = "Normal"
CAT_ELEVATED = "Elevated"
CAT_STAGE1 = "Hipertensi Stage 1"
CAT_STAGE2 = "Hipertensi Stage 2"
CAT_CRISIS = "Krisis Hipertensi"


def classify_bp(systolic: int, diastolic: int) -> str:
    """
    Klasifikasikan tekanan darah ke salah satu kategori.

    Urutan pengecekan: kondisi tinggi diperiksa lebih dulu agar tekanan
    sistolik tinggi dengan diastolik rendah (mis. 150/55, isolated systolic
    hypertension) tetap masuk kategori hipertensi, bukan hipotensi.
    """
    if systolic >= CRISIS_SYSTOLIC or diastolic >= CRISIS_DIASTOLIC:
        return CAT_CRISIS
    if systolic >= STAGE2_SYSTOLIC or diastolic >= STAGE2_DIASTOLIC:
        return CAT_STAGE2
    if systolic >= STAGE1_SYSTOLIC or diastolic >= STAGE1_DIASTOLIC:
        return CAT_STAGE1
    if systolic >= ELEVATED_SYSTOLIC:
        return CAT_ELEVATED
    if systolic <= HYPOTENSION_SYSTOLIC or diastolic <= HYPOTENSION_DIASTOLIC:
        return CAT_HYPOTENSION
    return CAT_NORMAL


# Pesan saran singkat per kategori untuk ditampilkan bersama rekomendasi.
BP_ADVISORY = {
    CAT_HYPOTENSION: (
        "Tekanan darah Anda tergolong rendah (hipotensi). Rekomendasi tidak "
        "membatasi natrium secara ketat; jaga asupan cairan yang cukup dan "
        "konsultasikan dengan dokter bila sering pusing atau lemas."
    ),
    CAT_STAGE1: (
        "Tekanan darah Anda tergolong Hipertensi Stage 1. Target natrium "
        "diturunkan ke 2000 mg/hari untuk membantu menurunkan tekanan darah."
    ),
    CAT_STAGE2: (
        "Tekanan darah Anda tergolong Hipertensi Stage 2. Target natrium "
        "dibatasi ketat ke 1500 mg/hari sesuai pendekatan DASH-Sodium."
    ),
    CAT_CRISIS: (
        "Tekanan darah Anda berada pada level krisis. Segera hubungi tenaga "
        "medis. Target natrium dibatasi ketat ke 1500 mg/hari."
    ),
}


def get_bp_advisory(category: str) -> Optional[str]:
    """
    Pesan saran singkat sesuai kategori BP untuk ditampilkan bersama
    rekomendasi makanan. Mengembalikan None jika tidak ada catatan khusus
    (mis. Normal / Elevated).
    """
    return BP_ADVISORY.get(category)
