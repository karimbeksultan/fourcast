"use client";

import { useSyncExternalStore } from "react";
import { getStateSnapshot, saveState, subscribeState } from "@/lib/storage";
import type { AppState } from "@/lib/types";

/**
 * Saved state from this browser.
 * `undefined` while the page is still loading (server render), `null` when nothing is saved yet.
 * Show the loading state for `undefined`, the empty state for `null`.
 * `save` returns false when nothing was saved (the state failed the schema, or storage is blocked): show an error.
 */
export function useAppState(): [AppState | null | undefined, (next: AppState) => boolean] {
  const state = useSyncExternalStore(subscribeState, getStateSnapshot, () => undefined);
  return [state, saveState];
}
