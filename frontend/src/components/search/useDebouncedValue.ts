"use client";

import { useEffect, useState } from "react";

/**
 * Generic hook untuk debounce nilai apa pun.
 * Mencegah API call berlebihan saat user mengetik cepat.
 *
 * @example
 * const debouncedQuery = useDebouncedValue(query, 300);
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
