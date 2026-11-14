"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
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

/** "Lowest point: $27.50 on Thu, Dec 3, the day before payday." with the amount counting up. */
export function LowestLine({ timeline, className }: { timeline: Timeline; className?: string }) {
  const { balance, date } = timeline.lowest;
  const beforePayday = timeline.paydays.includes(addDays(date, 1));
  return (
    <p className={cn("tabular", className)}>
      Lowest point: <span className={balance < 0 ? "text-short" : undefined}>{formatUSD(Math.abs(balance))}</span>
      {balance < 0 ? " short" : ""} on {formatShort(date)}
      {beforePayday ? ", the day before payday." : "."}
    </p>
  );
}
