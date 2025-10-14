"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Start with the provided initial value so server and first client render match.
  const [state, setState] = useState<T>(initialValue);

  // Read from localStorage after mount to avoid hydration mismatches.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        setState(JSON.parse(raw) as T);
      }
    } catch {}
    // Intentionally only depends on `key` so this runs on mount and when key changes.
  }, [key]);

  // Write updates to localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  // functional setState support
  const set: typeof setState = (upd: any) => {
    setState((prev) => (typeof upd === "function" ? upd(prev) : upd));
  };

  return [state, set] as const;
}
