"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { lowestLine } from "@/components/copy";
import type { Timeline } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Dollars that count up when they appear (Magic UI Number Ticker). Screen readers get the final amount. */
export function Money({ cents, className }: { cents: number; className?: string }) {
  const value = Math.abs(cents) / 100;
  const label = value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  return (
    <span className={cn("tabular whitespace-nowrap", className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden>
        $<NumberTicker value={value} decimalPlaces={2} className="tracking-normal text-current" />
      </span>
    </span>
  );
}

/** "Lowest point: $12.50 short on Fri, Dec 4, in the morning before your paycheck lands." One wording, from copy.ts. */
export function LowestLine({ timeline, className }: { timeline: Timeline; className?: string }) {
  return <p className={cn("tabular", className)}>{lowestLine(timeline)}</p>;
}
