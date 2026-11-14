"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "@/lib/dates";
import type { ISODate } from "@/lib/types";

const noSubscribe = () => () => {};

/** Today in the user's time zone. `undefined` during the server render, so dates never mismatch on hydration. */
export function useToday(): ISODate | undefined {
  return useSyncExternalStore(noSubscribe, todayISO, () => undefined);
}
