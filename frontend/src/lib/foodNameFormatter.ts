/**
 * Format nama makanan agar lebih natural untuk user.
 *
 * Dataset TKPI 2017 pakai notasi "Nama, kondisi/preparasi":
 *   "Jampang huma, mentah" → "Jampang Huma (Mentah)"
 *   "Ikan kayu, kering" → "Ikan Kayu (Kering)"
 *   "Beras giling var pelita, mentah" → "Beras Giling Var Pelita (Mentah)"
 *   "Daun kelor, segar" → "Daun Kelor (Segar)"
 *
 * Untuk masakan Nusantara yang sudah formatted dengan baik (mis. "Rendang Sapi"),
 * tidak ada perubahan.
 */

const PREPARATION_KEYWORDS = [
  "mentah",
  "segar",
  "kering",
  "rebus",
  "kukus",
  "goreng",
  "bakar",
  "panggang",
  "tumis",
  "matang",
  "asin",
  "manis",
  "tawar",
  "muda",
  "tua",
  "kalengan",
  "instan",
];

/**
 * Bersihkan nama makanan dengan smart formatting.
 *
 * Rules:
 * 1. Kalau ada koma diikuti keyword preparasi → ganti jadi "(Preparasi)"
 * 2. Capitalize Each Word kecuali kata sambung (var, dengan, dll)
 * 3. Trim whitespace berlebihan
 */
export function formatFoodName(rawName: string): string {
  if (!rawName) return "";

  let cleaned = rawName.trim();

  // Cek pola "Nama, preparasi" atau "Nama, preparasi1, preparasi2"
  const commaIdx = cleaned.indexOf(",");
  if (commaIdx > 0) {
    const mainPart = cleaned.slice(0, commaIdx).trim();
    const restParts = cleaned
      .slice(commaIdx + 1)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Cek apakah semua part setelah koma adalah preparation keywords
    const allArePreparations = restParts.every((part) =>
      PREPARATION_KEYWORDS.some((kw) => part.toLowerCase().includes(kw))
    );

    if (allArePreparations && restParts.length > 0) {
      // Format: "Nama Utama (Preparasi 1, Preparasi 2)"
      const preparations = restParts.map(capitalizeWords).join(", ");
      return `${capitalizeWords(mainPart)} (${preparations})`;
    }

    // Kalau bukan preparation keyword, biarkan koma asli (mungkin nama spesies, dll)
    // Tapi tetap clean capitalization
  }

  return capitalizeWords(cleaned);
}

const LOWERCASE_WORDS = new Set([
  "var",
  "dan",
  "atau",
  "dengan",
  "tanpa",
  "untuk",
  "dari",
  "di",
  "ke",
  "yang",
]);

function capitalizeWords(text: string): string {
  return text
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && LOWERCASE_WORDS.has(lower)) {
        return lower;
      }
      // Pertahankan kapitalisasi di kata mixed (mis. "DASH", "CKD")
      if (/^[A-Z]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
