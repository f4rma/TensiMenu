"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Command } from "lucide-react";

import SearchInput from "./SearchInput";
import SearchResults from "./SearchResults";
import FoodDetailModal from "./FoodDetailModal";
import { useFoodSearch } from "./useFoodSearch";
import type { FoodSearchResult } from "./types";

interface GlobalSearchProps {
  /** Optional override: kalau di-set, akan dipanggil instead of buka detail modal */
  onSelectFood?: (food: FoodSearchResult) => void;
}

/**
 * Komponen pencarian global gaya command-palette / Spotlight.
 *
 * Behavior:
 * - Tombol trigger di navbar dengan shortcut Ctrl+K
 * - Klik hasil → buka FoodDetailModal yang menampilkan nutrisi lengkap
 * - User bisa "Tambah ke Catatan Konsumsi" langsung dari modal detail
 *
 * Bisa juga dipakai dengan custom onSelectFood untuk override behavior default.
 */
export default function GlobalSearch({ onSelectFood }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, status, error } = useFoodSearch(query);

  // Keyboard shortcut: Ctrl+K / Cmd+K untuk buka, ESC untuk tutup
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSelectedFood(null); // tutup detail kalau ada
        setOpen(true);
      } else if (e.key === "Escape") {
        if (selectedFood) {
          setSelectedFood(null);
        } else if (open) {
          setOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, selectedFood]);

  // Focus input saat modal terbuka
  useEffect(() => {
    if (open) {
      // Delay sedikit agar transition selesai
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      // Reset query saat tutup modal search (bukan saat buka detail)
      if (!selectedFood) {
        setQuery("");
      }
    }
  }, [open, selectedFood]);

  const handleSelect = (food: FoodSearchResult) => {
    if (onSelectFood) {
      // Override mode — caller handle behavior
      onSelectFood(food);
      setOpen(false);
      setQuery(""); // reset query
      return;
    }

    // Default: buka detail modal, tutup search tapi jangan reset query
    setSelectedFood(food);
    // Query tidak di-reset agar saat user kembali dari detail, hasil pencarian masih ada
  };

  // Handler untuk menutup detail modal dan kembali ke search
  const handleCloseDetail = () => {
    setSelectedFood(null);
    setOpen(true); // buka kembali search modal
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2.5 rounded-2xl border border-brand-charcoal/10 bg-white px-3.5 py-2 text-sm text-brand-charcoal-muted transition-all duration-150 hover:border-brand-primary/30 hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label="Cari makanan"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Cari makanan...</span>
        <span className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-brand-charcoal/15 bg-brand-cream-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-charcoal-muted">
          <Command className="h-2.5 w-2.5" />K
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pencarian makanan"
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh] pb-4 animate-in fade-in duration-200"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="relative w-full max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-300 rounded-3xl bg-white shadow-glass-lg overflow-hidden flex flex-col max-h-[70vh]">
            {/* Search input */}
            <div className="border-b border-brand-charcoal/5 p-3">
              <SearchInput
                ref={inputRef}
                value={query}
                onChange={setQuery}
                loading={status === "loading"}
                placeholder="Cari nama makanan, mis. 'rendang', 'tahu'..."
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              <SearchResults
                results={results}
                status={status}
                query={query}
                error={error}
                onSelectFood={handleSelect}
              />
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between gap-3 border-t border-brand-charcoal/5 bg-brand-cream-soft px-4 py-2 text-[10px] text-brand-charcoal-muted">
              <span>
                Tekan{" "}
                <kbd className="rounded border border-brand-charcoal/15 bg-white px-1 py-0.5 font-mono">
                  ESC
                </kbd>{" "}
                untuk tutup
              </span>
              <span className="hidden sm:inline">{results.length} hasil</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal — muncul setelah klik hasil pencarian */}
      <FoodDetailModal
        food={selectedFood}
        onClose={handleCloseDetail}
      />
    </>
  );
}
