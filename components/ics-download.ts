"use client";

import { buildIcs } from "@/lib/ics";
import type { AppState, ISODate } from "@/lib/types";

/** Download the calendar file with a reminder the evening before each payment (Plus). */
export function downloadIcs(state: AppState, today: ISODate) {
  const blob = new Blob([buildIcs(state, today, window.location.origin)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fourcast-payments.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari and Firefox need the URL a moment longer than the click.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
