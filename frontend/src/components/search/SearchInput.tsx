"use client";

import { forwardRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Tampilkan spinner di sebelah kanan */
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Input field khusus pencarian dengan icon, clear button, dan loading indicator.
 * Pure UI — tidak ada logic search di sini.
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, loading = false, placeholder = "Cari makanan...", className }, ref) => {
    return (
      <div
        className={cn(
          "group relative flex items-center",
          className
        )}
      >
        {/* Search icon */}
        <Search
          className="pointer-events-none absolute left-4 h-4 w-4 text-brand-charcoal-muted group-focus-within:text-brand-primary transition-colors duration-150"
          aria-hidden="true"
        />

        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "h-11 w-full rounded-2xl bg-white border border-brand-charcoal/10",
            "pl-11 pr-10 text-sm text-brand-charcoal placeholder:text-brand-charcoal-muted",
            "transition-all duration-150",
            "focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15",
            "shadow-glass-sm"
          )}
        />

        {/* Right side: loading or clear button */}
        <div className="absolute right-3 flex items-center gap-1">
          {loading && (
            <Loader2
              className="h-4 w-4 animate-spin text-brand-primary"
              aria-label="Mencari"
            />
          )}
          {!loading && value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-brand-charcoal-muted transition-colors duration-150 hover:bg-brand-charcoal/5 hover:text-brand-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
