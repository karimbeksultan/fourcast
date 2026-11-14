// Everything lives in this browser (no sign-up, FAQ Q135). Read it after mount:
// on the server there is no localStorage. Broken or old data is dropped, never thrown.
import { AppStateSchema } from "./schema";
import type { AppState } from "./types";

const KEY = "fourcast:v1";

export function emptyState(): AppState {
  return { version: 1, money: null, plans: [], plus: null, sample: false };
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null; // storage blocked
  }
}

function parse(raw: string): AppState | null {
  try {
    const parsed = AppStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  const raw = readRaw();
  if (!raw) return null;
  const state = parse(raw);
  if (!state) clearState();
  return state;
}

// For useSyncExternalStore (hooks/use-app-state.ts): same object until the data changes.
const listeners = new Set<() => void>();
let lastRaw: string | null = null;
let lastState: AppState | null = null;

export function getStateSnapshot(): AppState | null {
  const raw = readRaw();
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastState = raw ? parse(raw) : null;
  }
  return lastState;
}

export function subscribeState(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const notify = () => listeners.forEach((l) => l());

/**
 * Saves only what loadState() can read back: a state that fails the schema (say, a 14-digit amount)
 * is not written, so it can never wipe the saved plans. false → nothing was saved; show an error.
 */
export function saveState(state: AppState): boolean {
  if (typeof window === "undefined") return false;
  const parsed = AppStateSchema.safeParse(state);
  if (!parsed.success) return false;
  let saved = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(parsed.data));
  } catch {
    saved = false; // private mode or full storage
  }
  notify();
  return saved;
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  notify();
}
