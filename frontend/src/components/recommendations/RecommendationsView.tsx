"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowDown, Inbox, Loader2 } from "lucide-react";

import RegionFilter, { type RegionValue } from "./RegionFilter";
import FoodCard from "./FoodCard";
import type { FoodRecommendation } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BATCH_SIZE = 12; // jumlah item per "Tampilkan Lebih Banyak"
const MAX_TOTAL = 100; // batas keras agar UX tidak overload

interface RecommendationsViewProps {
  initialRecommendations: FoodRecommendation[];
  /** Apakah backend tersedia */
  backendAvailable?: boolean;
  /** Apakah user punya komorbid CKD — kalau ya, tampilkan fosfor di kartu */
  isCkd?: boolean;
}

/**
 * View interaktif untuk halaman rekomendasi.
 * Mendukung filter wilayah, paginasi load-more, dan konfirmasi konsumsi.
 */
export default function RecommendationsView({
  initialRecommendations,
  backendAvailable = true,
  isCkd = false,
}: RecommendationsViewProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [regionFilter, setRegionFilter] = useState<RegionValue>("all");
  const [confirmedCodes, setConfirmedCodes] = useState<Set<string>>(new Set());
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Recommendations state — dimulai dari initial, bisa di-extend via load more
  const [allRecommendations, setAllRecommendations] = useState<FoodRecommendation[]>(
    initialRecommendations
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter berdasarkan region
  const filtered = useMemo(() => {
    if (regionFilter === "all") return allRecommendations;
    return allRecommendations.filter((food) => matchesRegion(food.region, regionFilter));
  }, [regionFilter, allRecommendations]);

  const handleLoadMore = async () => {
    if (loadingMore || reachedEnd) return;

    const accessToken = session?.accessToken;
    if (!accessToken) {
      setLoadError("Sesi tidak valid. Silakan login ulang.");
      return;
    }

    if (allRecommendations.length >= MAX_TOTAL) {
      setReachedEnd(true);
      return;
    }

    setLoadingMore(true);
    setLoadError(null);

    try {
      const offset = allRecommendations.length;
      const url = new URL(`${API_URL}/api/v1/recommendations`);
      url.searchParams.set("top_k", String(BATCH_SIZE));
      url.searchParams.set("offset", String(offset));

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (!response.ok) {
        // Surface status code untuk memudahkan debugging
        let detail = "";
        try {
          const body = await response.json();
          detail = body?.detail?.error || body?.detail || "";
        } catch {
          /* abaikan */
        }
        throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
      }

      const data = await response.json();
      const newItems: FoodRecommendation[] = (data?.recommendations ?? []).map(
        (r: Record<string, unknown>) => ({
          food_code: String(r.food_code ?? ""),
          name: String(r.name ?? ""),
          category: String(r.category ?? ""),
          region: (r.region as string | null) ?? null,
          description: (r.description as string | null) ?? null,
          image_url: (r.image_url as string | null) ?? null,
          energy_kcal: Number(r.energy_kcal ?? 0),
          sodium_mg: Number(r.sodium_mg ?? 0),
          potassium_mg: Number(r.potassium_mg ?? 0),
          fiber_g: Number(r.fiber_g ?? 0),
          fat_total_g: Number(r.fat_total_g ?? 0),
          phosphorus_mg: Number(r.phosphorus_mg ?? 0),
          default_serving_g: Number(r.default_serving_g ?? 100),
          dash_score: Number(r.dash_score ?? 0),
          dash_category: String(r.dash_category ?? ""),
          tags: (r.tags as string[]) ?? undefined,
          is_estimated: Boolean(r.is_estimated ?? false),
        })
      );

      // Dedupe (anti-repetisi backend mungkin ngirim ulang setelah fallback)
      setAllRecommendations((prev) => {
        const existingCodes = new Set(prev.map((f) => f.food_code));
        const dedupedNew = newItems.filter((f) => !existingCodes.has(f.food_code));
        return [...prev, ...dedupedNew];
      });

      // Kalau backend kirim lebih sedikit dari yang diminta → sudah habis
      if (newItems.length < BATCH_SIZE) {
        setReachedEnd(true);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? `Gagal memuat rekomendasi tambahan (${err.message}).`
          : "Terjadi kesalahan."
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleConfirm = async (foodCode: string, servingG: number) => {
    setConfirmError(null);
    const accessToken = session?.accessToken;
    if (!accessToken) {
      const msg = "Sesi tidak valid. Silakan login ulang.";
      setConfirmError(msg);
      throw new Error(msg);
    }

    // Porsi (gram) dari input user di kartu. Fallback ke porsi standar item.
    const item = allRecommendations.find((f) => f.food_code === foodCode);
    const resolvedServing =
      servingG && servingG > 0 ? servingG : item?.default_serving_g ?? 100;

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/v1/recommendations/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          food_codes: [foodCode],
          servings_g: [resolvedServing],
        }),
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? `Tidak dapat terhubung ke server: ${err.message}`
          : "Tidak dapat terhubung ke server.";
      setConfirmError(msg);
      throw err;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const errMsg =
        body?.detail?.error ||
        (typeof body?.detail === "string" ? body.detail : null) ||
        `Gagal menyimpan konsumsi (HTTP ${response.status}).`;
      setConfirmError(errMsg);
      throw new Error(errMsg);
    }

    setConfirmedCodes((prev) => new Set(prev).add(foodCode));
    router.refresh();
  };

  return (
    <>
      {/* Header dengan deskripsi + filter */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-brand-charcoal">
            Rekomendasi Menu DASH
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-charcoal-soft">
            Pilihan hidangan tradisional Indonesia yang telah disesuaikan dengan
            standar diet DASH untuk membantu mengontrol tekanan darah Anda.
          </p>
        </div>
        <RegionFilter value={regionFilter} onChange={setRegionFilter} />
      </div>

      {/* Banner error konfirmasi konsumsi */}
      {confirmError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span className="font-semibold shrink-0">Gagal:</span>
          <span className="flex-1">{confirmError}</span>
          <button
            type="button"
            onClick={() => setConfirmError(null)}
            className="text-rose-600 hover:text-rose-800 text-xs underline"
            aria-label="Tutup pesan error"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Grid rekomendasi */}
      {filtered.length === 0 ? (
        <EmptyRecommendations
          backendAvailable={backendAvailable}
          regionFilter={regionFilter}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((food, idx) => (
              <FoodCard
                key={food.food_code}
                food={food}
                animationDelay={Math.min(idx * 60, 600)}
                consumed={confirmedCodes.has(food.food_code)}
                onConfirm={handleConfirm}
                showPhosphorus={isCkd}
              />
            ))}
          </div>

          {/* Load more / status footer */}
          <div className="mt-10 flex flex-col items-center gap-3">
            {loadError && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs text-rose-700"
              >
                {loadError}
              </p>
            )}

            {/* Counter */}
            <p className="text-xs text-brand-charcoal-muted">
              Menampilkan{" "}
              <span className="font-semibold text-brand-charcoal">
                {filtered.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-brand-charcoal">
                {allRecommendations.length}
              </span>{" "}
              rekomendasi
              {regionFilter !== "all" && " (terfilter)"}
            </p>

            {/* Load more button (hanya tampil kalau filter "all") */}
            {regionFilter === "all" && !reachedEnd && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-2xl border border-brand-primary/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-primary shadow-glass-sm transition-all duration-200 hover:bg-brand-primary hover:text-white hover:shadow-brand-cta active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat rekomendasi...
                  </>
                ) : (
                  <>
                    Tampilkan {BATCH_SIZE} Lainnya
                    <ArrowDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}

            {/* Reached end */}
            {regionFilter === "all" && reachedEnd && (
              <p className="text-xs italic text-brand-charcoal-muted">
                Anda sudah melihat semua rekomendasi yang tersedia untuk profil Anda.
              </p>
            )}

            {/* Filter aktif notice */}
            {regionFilter !== "all" && (
              <p className="text-xs text-brand-charcoal-muted">
                Hapus filter wilayah untuk memuat lebih banyak rekomendasi.
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}

/**
 * Helper: cek apakah field region match dengan filter user.
 * Kompatibel dengan dataset TKPI ("Indonesia") dan masakan Nusantara
 * ("Sumatera Barat", "Jakarta", dll).
 */
function matchesRegion(region: string | null | undefined, filter: RegionValue): boolean {
  if (!region) return false;
  const r = region.toLowerCase();

  if (r.includes(filter)) return true;

  const aliases: Partial<Record<RegionValue, string[]>> = {
    sunda: ["jawa barat"],
    betawi: ["jakarta"],
    bugis: ["sulawesi selatan"],
    manado: ["sulawesi utara"],
    padang: ["sumatera barat", "minang"],
    batak: ["sumatera utara"],
  };

  return aliases[filter]?.some((alias) => r.includes(alias)) ?? false;
}

function EmptyRecommendations({
  backendAvailable,
  regionFilter,
}: {
  backendAvailable: boolean;
  regionFilter: RegionValue;
}) {
  return (
    <div className="rounded-3xl bg-white border border-dashed border-brand-charcoal/15 p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary mb-4">
        <Inbox className="h-6 w-6" strokeWidth={2} />
      </span>
      <p className="text-base font-semibold text-brand-charcoal">
        {!backendAvailable
          ? "Belum bisa memuat rekomendasi"
          : regionFilter !== "all"
            ? "Tidak ada rekomendasi untuk wilayah ini"
            : "Belum ada rekomendasi"}
      </p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-brand-charcoal-soft">
        {!backendAvailable
          ? "Pastikan server backend sedang berjalan, lalu refresh halaman."
          : regionFilter !== "all"
            ? "Coba pilih wilayah lain atau lihat semua rekomendasi."
            : "Lengkapi profil terlebih dahulu untuk mendapatkan rekomendasi yang dipersonalisasi."}
      </p>
    </div>
  );
}
