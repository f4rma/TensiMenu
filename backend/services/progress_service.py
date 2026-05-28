"""
Service untuk tracker progres DASH Score TensiMenu.
"""

import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


def get_progress_trend(user_id: str, period_days: int = 7) -> list[dict]:
    """
    Ambil tren DASH Score untuk N hari terakhir dari consumption_logs.

    Returns:
        list of {"date": str, "dash_score": float | None}
        Satu entry per hari, None jika tidak ada log di hari tersebut.
    """
    from core.database import get_supabase
    supabase = get_supabase()

    cutoff = (datetime.now(timezone.utc) - timedelta(days=period_days)).date().isoformat()

    response = (
        supabase.table("consumption_logs")
        .select("log_date, dash_score")
        .eq("user_id", user_id)
        .gte("log_date", cutoff)
        .order("log_date", desc=False)
        .execute()
    )

    rows = response.data or []

    # Buat dict log_date → dash_score (ambil yang terakhir jika ada duplikat)
    log_map: dict[str, float] = {}
    for row in rows:
        log_date = row.get("log_date", "")
        dash_score = row.get("dash_score")
        if log_date and dash_score is not None:
            log_map[log_date] = float(dash_score)

    # Isi semua hari dalam periode (termasuk yang tidak ada log)
    trend = []
    for i in range(period_days):
        day = (datetime.now(timezone.utc) - timedelta(days=period_days - 1 - i)).date().isoformat()
        trend.append({
            "date": day,
            "dash_score": log_map.get(day),
        })

    return trend


def get_weekly_summary(user_id: str) -> dict:
    """
    Hitung ringkasan mingguan: rata-rata DASH Score, total natrium, total kalium.

    Returns:
        dict dengan keys: avg_dash_score, total_sodium_mg, total_potassium_mg,
                          days_logged, period_start, period_end
    """
    from core.database import get_supabase
    supabase = get_supabase()

    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).date().isoformat()
    today = datetime.now(timezone.utc).date().isoformat()

    response = (
        supabase.table("consumption_logs")
        .select("log_date, dash_score, total_sodium_mg, total_potassium_mg")
        .eq("user_id", user_id)
        .gte("log_date", cutoff)
        .execute()
    )

    rows = response.data or []

    if not rows:
        return {
            "period_start": cutoff,
            "period_end": today,
            "avg_dash_score": None,
            "total_sodium_mg": None,
            "total_potassium_mg": None,
            "days_logged": 0,
            "message": "Belum ada data untuk periode ini",
        }

    scores = [float(r["dash_score"]) for r in rows if r.get("dash_score") is not None]
    sodiums = [float(r["total_sodium_mg"]) for r in rows if r.get("total_sodium_mg") is not None]
    potassiums = [
        float(r["total_potassium_mg"]) for r in rows if r.get("total_potassium_mg") is not None
    ]
    unique_days = len({r["log_date"] for r in rows if r.get("log_date")})

    return {
        "period_start": cutoff,
        "period_end": today,
        "avg_dash_score": round(sum(scores) / len(scores), 1) if scores else None,
        "total_sodium_mg": round(sum(sodiums), 1) if sodiums else None,
        "total_potassium_mg": round(sum(potassiums), 1) if potassiums else None,
        "days_logged": unique_days,
    }


def get_compliance_percentage(user_id: str) -> dict:
    """
    Hitung persentase hari dengan DASH Score >= 60 (kepatuhan DASH).

    Returns:
        dict: total_days_logged, days_compliant, compliance_percentage
    """
    from core.database import get_supabase
    supabase = get_supabase()

    response = (
        supabase.table("consumption_logs")
        .select("log_date, dash_score")
        .eq("user_id", user_id)
        .execute()
    )

    rows = response.data or []

    if not rows:
        return {
            "total_days_logged": 0,
            "days_compliant": 0,
            "compliance_percentage": 0.0,
        }

    # Satu entry per hari (ambil skor tertinggi jika ada duplikat)
    day_scores: dict[str, float] = {}
    for row in rows:
        log_date = row.get("log_date", "")
        score = row.get("dash_score")
        if log_date and score is not None:
            day_scores[log_date] = max(day_scores.get(log_date, 0.0), float(score))

    total = len(day_scores)
    compliant = sum(1 for s in day_scores.values() if s >= 60)

    return {
        "total_days_logged": total,
        "days_compliant": compliant,
        "compliance_percentage": round(compliant / total * 100, 1) if total > 0 else 0.0,
    }


def check_reminder_needed(user_id: str, threshold_days: int = 2) -> bool:
    """
    Cek apakah pengguna tidak mencatat selama N hari berturut-turut.
    Digunakan untuk notifikasi pengingat di frontend.

    Returns:
        True jika perlu pengingat, False jika tidak
    """
    from core.database import get_supabase
    supabase = get_supabase()

    cutoff = (datetime.now(timezone.utc) - timedelta(days=threshold_days)).date().isoformat()

    response = (
        supabase.table("consumption_logs")
        .select("log_date")
        .eq("user_id", user_id)
        .gte("log_date", cutoff)
        .limit(1)
        .execute()
    )

    # Jika tidak ada log dalam N hari terakhir → perlu pengingat
    return not bool(response.data)
