"""
Match nama makanan di food_items_clean.csv dengan dataset HuggingFace
indonesian_food_nutrition_hf.csv untuk dapatkan image_url.

Algoritma matching yang KETAT (revisi):

Untuk setiap nama target, hitung composite score terhadap setiap kandidat HF:

  composite = 0.5 * jaccard(token_set) + 0.3 * sequence_ratio + 0.2 * len_ratio

di mana:
  - jaccard(token_set)  : irisan/gabungan kata-kata setelah normalisasi.
  - sequence_ratio      : SequenceMatcher untuk handle salah ketik / ordering.
  - len_ratio           : penalti perbedaan panjang nama.

PENTING:
  - Preparasi (goreng, bakar, rebus, dll) DIPERTAHANKAN sebagai token —
    karena "ayam goreng" ≠ "ayam panggang". Bug versi sebelumnya membuang
    kata preparasi sehingga "ayam X" semua jadi sama.
  - Nama dengan koma di-split jadi (main, prep) dan SEMUA tokennya
    digabung ulang: "Jampang huma, mentah" → tokens {jampang, huma, mentah}.
  - Stop-words umum yang non-informatif dibuang ("dan", "dengan", "var").
  - Kalau head-noun (kata pertama) berbeda → langsung penalti besar.

Threshold: ACCEPT_SCORE >= 0.62 → match diterima.
Skor di bawah itu → image_url dikosongkan supaya fallback generated visual
muncul, jauh lebih baik daripada salah gambar.

Output: food_items_clean.csv dengan kolom 'image_url' baru.
Idempotent: gunakan flag --force untuk re-match SEMUA item, atau biarkan
default untuk skip yang sudah punya URL valid.
"""

import argparse
import sys
from pathlib import Path
from difflib import SequenceMatcher

import pandas as pd

BACKEND = Path(__file__).resolve().parent.parent
ARTIFACTS = BACKEND / "ml" / "artifacts"
HF_DATASET = BACKEND.parent / "datasets" / "indonesian_food_nutrition_hf.csv"

# Kata yang tidak informatif untuk matching — buang dari token set.
STOP_WORDS: frozenset[str] = frozenset({
    "dan", "dengan", "atau", "var", "varitas", "variant",
    "the", "a", "an", "of",
})

# Token preparasi — masih DIPERTAHANKAN sebagai distinguisher penting
# (goreng vs bakar vs rebus berbeda bahan visual), tapi tidak dipenalti
# kalau hanya muncul di salah satu sisi (HF kadang nama lebih singkat).
PREPARATION_TOKENS: frozenset[str] = frozenset({
    "mentah", "segar", "kering", "rebus", "kukus", "goreng",
    "bakar", "panggang", "tumis", "matang", "asin", "manis",
    "tawar", "muda", "tua", "kalengan", "instan",
})

# Token preparasi yang KONFLIK keras — kalau salah satu sisi punya "goreng"
# dan sisi lain punya "rebus", itu makanan berbeda secara visual.
CONTRADICTORY_PREPS: list[tuple[frozenset[str], frozenset[str]]] = [
    (frozenset({"goreng", "bakar", "panggang", "tumis"}), frozenset({"rebus", "kukus", "mentah", "segar"})),
]

# Threshold composite score minimum untuk diterima sebagai match.
# Dipilih agar konservatif: salah gambar lebih buruk dari tidak ada gambar.
ACCEPT_SCORE = 0.55

# Score minimum untuk ditampilkan di log (yang ditolak).
LOG_REJECTED_FROM = 0.40


def tokenize(name: str) -> list[str]:
    """
    Pecah nama jadi token bersih.
    Koma diperlakukan sebagai pemisah biasa (bukan dibuang).
    """
    if not isinstance(name, str):
        return []
    s = name.lower()
    # Ganti tanda baca jadi spasi
    for ch in (",", ".", "(", ")", "/", "-", ";", ":"):
        s = s.replace(ch, " ")
    raw = s.split()
    return [t for t in raw if t and t not in STOP_WORDS and len(t) >= 2]


def jaccard(a: list[str], b: list[str]) -> float:
    """Jaccard similarity over token SETS."""
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def length_ratio(a: list[str], b: list[str]) -> float:
    """1.0 kalau jumlah token sama, turun proporsional kalau berbeda."""
    la, lb = len(a), len(b)
    if la == 0 or lb == 0:
        return 0.0
    return min(la, lb) / max(la, lb)


def sequence_ratio(a: list[str], b: list[str]) -> float:
    """SequenceMatcher pada string token yang di-join + sort."""
    sa = " ".join(sorted(a))
    sb = " ".join(sorted(b))
    if not sa or not sb:
        return 0.0
    return SequenceMatcher(None, sa, sb).ratio()


def composite_score(target_tokens: list[str], hf_tokens: list[str]) -> float:
    """
    Composite score yang fokus pada kecocokan ingredient utama:

      score = 0.55 * jaccard_ingredient
            + 0.25 * sequence_ratio
            + 0.20 * head_match_bonus

    Plus:
      - Penalti besar kalau head-noun (ingredient pertama) berbeda jauh.
      - Penalti telak kalau ada kontradiksi preparasi (goreng vs rebus).
      - Preparasi tokens dianggap "soft": tidak menarik turun jaccard kalau
        cuma ada di satu sisi.
    """
    if not target_tokens or not hf_tokens:
        return 0.0

    # Pisahkan ingredient tokens dari preparation tokens
    t_ing = [t for t in target_tokens if t not in PREPARATION_TOKENS]
    h_ing = [t for t in hf_tokens if t not in PREPARATION_TOKENS]
    t_prep = set(t for t in target_tokens if t in PREPARATION_TOKENS)
    h_prep = set(t for t in hf_tokens if t in PREPARATION_TOKENS)

    # Fallback kalau salah satu sisi tidak ada ingredient (semua preparasi)
    if not t_ing or not h_ing:
        t_ing = target_tokens
        h_ing = hf_tokens

    # Jaccard ingredient — token utama makanan
    j_ing = jaccard(t_ing, h_ing)

    # Sequence ratio pada ingredient (sorted untuk handle ordering)
    seq = sequence_ratio(t_ing, h_ing)

    # Head match bonus — kuat sekali kalau head sama persis.
    # Catatan: kalau token ingredient overlap sangat tinggi (j_ing >= 0.8),
    # urutan head tidak penting (e.g. "Daging Kuda" = "Kuda, daging").
    head_a = t_ing[0] if t_ing else ""
    head_b = h_ing[0] if h_ing else ""
    if j_ing >= 0.8:
        # Set hampir identik — anggap head match
        head_bonus = 1.0
    elif head_a == head_b:
        head_bonus = 1.0
    elif head_a and head_b and (
        (len(head_a) >= 4 and head_a in head_b)
        or (len(head_b) >= 4 and head_b in head_a)
    ):
        head_bonus = 0.7
    else:
        head_bonus = 0.0

    score = 0.55 * j_ing + 0.25 * seq + 0.20 * head_bonus

    # Penalti telak kalau ada kontradiksi preparasi
    for group_a, group_b in CONTRADICTORY_PREPS:
        if (t_prep & group_a and h_prep & group_b) or (t_prep & group_b and h_prep & group_a):
            score *= 0.4
            break

    # Bonus kecil kalau preparasi cocok eksplisit (goreng = goreng)
    if t_prep and h_prep and (t_prep & h_prep):
        score = min(1.0, score + 0.05)

    # Penalti kalau head-noun benar-benar berbeda DAN ingredient juga tidak overlap
    if head_bonus == 0.0 and j_ing < 0.6:
        score *= 0.5

    return score


def find_best_match(
    target_name: str, hf_records: list[tuple[list[str], str]]
) -> tuple[str | None, float, str | None]:
    """
    Cari best match di HF dataset.
    Return (image_url, score, hf_name_matched).
    """
    target_tokens = tokenize(target_name)
    if not target_tokens:
        return None, 0.0, None

    best_score = 0.0
    best_url: str | None = None
    best_name: str | None = None

    for hf_tokens, url, hf_name in hf_records:
        # Quick skip: tidak ada token yang sama sama sekali → 0 score, lewati
        if not (set(target_tokens) & set(hf_tokens)):
            continue

        score = composite_score(target_tokens, hf_tokens)
        if score > best_score:
            best_score = score
            best_url = url
            best_name = hf_name

    if best_score >= ACCEPT_SCORE:
        return best_url, best_score, best_name
    return None, best_score, best_name


def prepare_hf_records(hf_df: pd.DataFrame) -> list[tuple[list[str], str, str]]:
    """Pre-tokenize HF dataset sekali, return list of (tokens, url, name)."""
    records: list[tuple[list[str], str, str]] = []
    for _, row in hf_df.iterrows():
        name = str(row.get("name", "") or "").strip()
        url = str(row.get("image", "") or "").strip()
        if not name or not url or not url.startswith("http"):
            continue
        tokens = tokenize(name)
        if not tokens:
            continue
        records.append((tokens, url, name))
    return records


def main() -> int:
    parser = argparse.ArgumentParser(description="Match TKPI dishes to HF dataset images")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-match semua item (timpa image_url yang sudah ada)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Jalankan matching tapi jangan simpan ke CSV",
    )
    parser.add_argument(
        "--debug-rejected",
        action="store_true",
        help="Tampilkan kandidat near-miss yang ditolak",
    )
    args = parser.parse_args()

    print("=" * 72)
    print("MATCH FOOD IMAGES — TKPI ↔ HuggingFace (strict composite scoring)")
    print("=" * 72)

    tkpi_path = ARTIFACTS / "food_items_clean.csv"
    if not tkpi_path.exists():
        print(f"ERROR: {tkpi_path} tidak ditemukan")
        return 1

    tkpi = pd.read_csv(tkpi_path)
    print(f"TKPI dataset       : {len(tkpi)} items")

    if not HF_DATASET.exists():
        print(f"ERROR: {HF_DATASET} tidak ditemukan")
        return 1

    hf_df = pd.read_csv(HF_DATASET)
    print(f"HuggingFace dataset: {len(hf_df)} items")
    print(f"Threshold accept   : {ACCEPT_SCORE}")
    print(f"Force re-match     : {args.force}")
    print(f"Dry run            : {args.dry_run}\n")

    hf_records = prepare_hf_records(hf_df)
    print(f"HF records valid   : {len(hf_records)}\n")

    if "image_url" not in tkpi.columns:
        tkpi["image_url"] = ""

    # Reset image_url kalau --force
    if args.force:
        tkpi["image_url"] = ""

    matched = 0
    skipped = 0
    rejected_examples: list[tuple[str, str, float]] = []
    sample_matches: list[tuple[float, str, str]] = []

    for idx, row in tkpi.iterrows():
        existing = str(row.get("image_url", "") or "").strip()
        if existing and existing.startswith("http"):
            skipped += 1
            continue

        name = str(row.get("name", "") or "")
        url, score, hf_name = find_best_match(name, hf_records)

        if url:
            tkpi.at[idx, "image_url"] = url
            matched += 1
            if len(sample_matches) < 15:
                sample_matches.append((score, name, hf_name or ""))
        elif args.debug_rejected and score >= LOG_REJECTED_FROM and hf_name:
            if len(rejected_examples) < 20:
                rejected_examples.append((name, hf_name, score))

    if sample_matches:
        sample_matches.sort(reverse=True)
        print("[ Sample matches (high score) ]")
        for score, target, src in sample_matches[:8]:
            print(f"  ✓ {score:.3f}  {target:45s} ← {src}")
        if len(sample_matches) > 8:
            print("  [ Sample matches (lower) ]")
            for score, target, src in sample_matches[-4:]:
                print(f"  ~ {score:.3f}  {target:45s} ← {src}")
        print()

    if rejected_examples:
        print("[ Near-miss rejected (score < ACCEPT) ]")
        for target, src, score in rejected_examples[:15]:
            print(f"  ✗ {score:.3f}  {target:45s} ↛ {src}")
        print()

    total = len(tkpi)
    no_match = total - matched - skipped
    coverage = (matched + skipped) / total if total else 0
    print("[ Result ]")
    print(f"  Matched     : {matched}")
    print(f"  Already had : {skipped}")
    print(f"  No match    : {no_match}")
    print(f"  Coverage    : {coverage:.1%}\n")

    if args.dry_run:
        print("[DRY-RUN] Tidak menyimpan perubahan.")
    else:
        tkpi.to_csv(tkpi_path, index=False)
        print(f"[OK] Disimpan ke {tkpi_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
