"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

import { useDebouncedValue } from "./useDebouncedValue";
import type { FoodSearchResult, SearchStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

interface UseFoodSearchResult {
  results: FoodSearchResult[];
  status: SearchStatus;
  error: string | null;
}

/**
 * Custom hook untuk pencarian makanan dengan auto-debounce dan abort control.
 *
 * Tanggung jawab tunggal: handle data fetching + state.
 * Component tidak perlu tahu detail implementasi (debouncing, abort, error mapping).
 *
 * @param query — input string dari user
 * @returns { results, status, error }
 */
export function useFoodSearch(query: string): UseFoodSearchResult {
  const { data: session } = useSession();
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Track latest request untuk abort kalau ada query baru
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Reset kalau query terlalu pendek
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus("idle");
      setError(null);
      return;
    }

    if (!session?.accessToken) {
      setStatus("error");
      setError("Sesi tidak valid. Silakan login ulang.");
      return;
    }

    // Cancel request sebelumnya kalau masih in-flight
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("loading");
    setError(null);

    const fetchData = async () => {
      try {
        const url = new URL(`${API_URL}/api/v1/foods/search/query`);
        url.searchParams.set("q", debouncedQuery);
        url.searchParams.set("limit", "20");

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const items: FoodSearchResult[] = data?.items ?? [];

        // Cek apakah controller sudah di-abort sebelum set state
        if (controller.signal.aborted) return;

        setResults(items);
        setStatus(items.length === 0 ? "empty" : "success");
      } catch (err) {
        if (controller.signal.aborted) return;
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        if (isAbort) return;

        setStatus("error");
        setError(
          err instanceof Error
            ? "Gagal memuat hasil pencarian"
            : "Terjadi kesalahan tidak terduga"
        );
      }
    };

    fetchData();

    return () => controller.abort();
  }, [debouncedQuery, session?.accessToken]);

  return { results, status, error };
}
