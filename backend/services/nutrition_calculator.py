"""
Kalkulasi target nutrisi personal berbasis DASH Diet.
Menggunakan rumus Mifflin-St Jeor untuk BMR, dikonversi ke TDEE dengan
Physical Activity Level (PAL), lalu disesuaikan dengan komorbid dan tekanan
darah.

Rujukan:
- Mifflin-St Jeor 1990: standar BMR untuk dewasa.
- WHO/FAO/UNU 2004: PAL ringan 1.40-1.69, sedang 1.70-1.99, berat ≥2.0.
- DRI IOM/NAM 2005: serat dewasa <50 thn (38 g M / 25 g F), >50 thn (30 g M / 21 g F).
- DRI NASEM 2019: kalium AI laki-laki 3400 mg, perempuan 2600 mg
  (merevisi turun angka lama 4700 mg dari DRI 2005).
- DASH-Sodium trial (NEJM 2001) dan AHA 2017: 1500 mg Na untuk hipertensi.
- KDIGO 2020: CKD G3-G4 non-dialisis, Na ≤2000 mg, K ≤2000-3000 mg, P 800-1000 mg.
"""

from typing import List, Optional, Union

# Faktor PAL per level aktivitas. Disinkronkan dengan models.profile.ActivityLevel.
PAL_FACTORS: dict[str, float] = {
    "sedentary": 1.20,    # bedrest / sangat tidak aktif
    "light": 1.375,       # kerja kantor, sedikit olahraga (default)
    "moderate": 1.55,     # olahraga 3-5x/minggu
    "active": 1.725,      # olahraga harian
    "very_active": 1.90,  # atlet / pekerja fisik berat
}

# Default kalau tidak diberi level eksplisit.
DEFAULT_ACTIVITY_LEVEL = "light"
DEFAULT_PAL = PAL_FACTORS[DEFAULT_ACTIVITY_LEVEL]

# Persentase energi dari lemak total — DASH/AMDR merekomendasikan ≤30%.
# Kami pakai 27% sebagai target moderat di tengah rentang 20-35%.
FAT_ENERGY_FRACTION = 0.27

# Threshold tekanan darah untuk pengetatan natrium.
# AHA/ACC 2017: ambang sistolik per stage hipertensi.
HYPERTENSION_STAGE1_SYSTOLIC = 130
HYPERTENSION_STAGE2_SYSTOLIC = 140


def resolve_pal(activity: Union[str, float, None]) -> float:
    """
    Konversi input activity (string label atau float angka) menjadi PAL.
    Tahan terhadap None dan label tidak dikenal — fallback ke default.
    """
    if activity is None:
        return DEFAULT_PAL
    if isinstance(activity, (int, float)):
        # Clamp ke rentang biologis wajar (1.0 - 2.5)
        return max(1.0, min(float(activity), 2.5))
    return PAL_FACTORS.get(str(activity).lower(), DEFAULT_PAL)


def calculate_bmr(gender: str, weight_kg: float, height_cm: float, age: int) -> float:
    """
    Hitung BMR (Basal Metabolic Rate) dengan rumus Mifflin-St Jeor.
      Laki-laki: BMR = (10 × BB) + (6.25 × TB) − (5 × usia) + 5
      Perempuan: BMR = (10 × BB) + (6.25 × TB) − (5 × usia) − 161
    """
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    return base + 5 if gender == "laki-laki" else base - 161


def calculate_tdee(bmr: float, activity_level: Union[str, float, None] = None) -> float:
    """
    Hitung TDEE (Total Daily Energy Expenditure) = BMR × PAL.

    Args:
        bmr: hasil calculate_bmr()
        activity_level: string ("sedentary"|"light"|"moderate"|"active"|"very_active")
                        atau float PAL langsung. None → default 'light'.
    """
    return bmr * resolve_pal(activity_level)


def calculate_personal_targets(
    gender: str,
    weight_kg: float,
    height_cm: float,
    age: int,
    comorbidities: Optional[List[str]] = None,
    systolic_bp: Optional[int] = None,
    activity_level: Union[str, float, None] = None,
) -> dict:
    """
    Hitung target nutrisi harian personal berdasarkan profil pengguna.

    Prioritas penyesuaian (yang lebih ketat menang):
      1. CKD: Na 2000, K 2000, P 800.
      2. Hipertensi Stage 2 (sistolik ≥140): Na 1500.
      3. Hipertensi Stage 1 (sistolik 130-139): Na 2000.
         Kalau user juga CKD, ambil yang paling ketat.
      Hipotensi / Normal / Pra-Hipertensi (sistolik <130): Na tetap baseline 2300.

    Args:
        gender: "laki-laki" atau "perempuan"
        weight_kg, height_cm, age: dari profil
        comorbidities: list code komorbid (mis. ["ckd", "hypertension"])
        systolic_bp: tekanan darah sistolik terbaru (mmHg). Idealnya dari
            blood_pressure_records, fallback ke profile.systolic_bp.
        activity_level: label string atau PAL float. Default 'light' (1.375).

    Returns:
        dict target nutrisi harian (mg/g/kkal)
    """
    if comorbidities is None:
        comorbidities = []

    bmr = calculate_bmr(gender, weight_kg, height_cm, age)
    tdee = calculate_tdee(bmr, activity_level)

    # Serat: DRI IOM/NAM 2005, dibedakan usia ≤50 vs >50
    if gender == "laki-laki":
        fiber_target = 38.0 if age <= 50 else 30.0
    else:
        fiber_target = 25.0 if age <= 50 else 21.0

    # Kalium: DRI NASEM 2019 Adequate Intake (AI), dibedakan gender.
    # Catatan: angka lama 4700 mg (DRI 2005) telah DIREVISI TURUN oleh NASEM
    # 2019 karena bukti pendukungnya tidak cukup kuat.
    #   - Laki-laki dewasa (19+): 3400 mg
    #   - Perempuan dewasa (19+): 2600 mg
    potassium_target = 3400.0 if gender == "laki-laki" else 2600.0

    # Target dasar DASH (untuk dewasa sehat)
    targets = {
        "sodium_mg": 2300.0,
        "potassium_mg": potassium_target,
        "calcium_mg": 1200.0 if age > 50 else 1000.0,
        "fiber_g": fiber_target,
        # Lemak dari TDEE (bukan BMR), 9 kkal/g
        "fat_total_g": round(tdee * FAT_ENERGY_FRACTION / 9, 1),
        "energy_kcal": round(tdee),
        "phosphorus_mg": 1250.0,
    }

    # Penyesuaian CKD (KDIGO 2020 untuk G3-G4 non-dialisis)
    is_ckd = "ckd" in comorbidities
    if is_ckd:
        targets["sodium_mg"] = 2000.0
        targets["potassium_mg"] = 2000.0
        targets["phosphorus_mg"] = 800.0

    # Penyesuaian hipertensi (DASH-Sodium / AHA 2017), bertingkat per stage.
    # Ambil ambang natrium yang paling ketat antara kondisi BP dan CKD.
    #   - Stage 2+ (sistolik >=140): natrium 1500 mg
    #   - Stage 1 (sistolik 130-139): natrium 2000 mg
    #   - <130 (Normal/Pra-Hipertensi/Hipotensi): tetap baseline (tidak dibatasi)
    # Catatan: penderita hipotensi sengaja TIDAK dibatasi natriumnya — diet
    # penurun tekanan darah kurang sesuai untuk kondisi tekanan darah rendah.
    if systolic_bp is not None:
        if systolic_bp >= HYPERTENSION_STAGE2_SYSTOLIC:
            targets["sodium_mg"] = min(targets["sodium_mg"], 1500.0)
        elif systolic_bp >= HYPERTENSION_STAGE1_SYSTOLIC:
            targets["sodium_mg"] = min(targets["sodium_mg"], 2000.0)

    return targets
