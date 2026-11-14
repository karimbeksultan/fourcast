"use client";

// TEMPORARY (G-A3): which plans the user returned, until Plan.status / returnedOn land in the contract (G-B1).
// Kept in its own localStorage key so the main state schema stays untouched. Then read plan.status and delete this.
import { useSyncExternalStore } from "react";
import type { ISODate } from "@/lib/types";

const KEY = "fourcast:returns:v1";
type Returns = Record<string, ISODate>; // planId → returned on

const listeners = new Set<() => void>();
let lastRaw: string | null = null;
let last: Returns = {};

function read(): Returns {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      last =
        parsed && typeof parsed === "object"
          ? Object.fromEntries(
              Object.entries(parsed as Record<string, unknown>).filter(
                (e): e is [string, string] => typeof e[1] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e[1]),
              ),
            )
          : {};
    } catch {
      last = {};
    }
  }
  return last;
}

function write(next: Returns) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked: the mark lasts for this visit only
  }
  listeners.forEach((l) => l());
}

const EMPTY: Returns = {};

export function useReturns(): Returns {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}

export function markReturned(planId: string, on: ISODate) {
  write({ ...read(), [planId]: on });
}

export function undoReturned(planId: string) {
  const next = { ...read() };
  delete next[planId];
  write(next);
}
