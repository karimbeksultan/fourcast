"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/** One query parameter from the address bar, read in the browser only (no Suspense needed). */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}
