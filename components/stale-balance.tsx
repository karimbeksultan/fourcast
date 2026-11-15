// Says when the balance was typed on an earlier day, so the answer on this screen may be off, and
// offers the one-number check-in. Only compares two dates: money is still counted in lib/plan.ts.
import { RefreshCw } from "lucide-react";
import { formatShort } from "@/lib/dates";
import type { AppState, ISODate } from "@/lib/types";

export function StaleBalance({ state, today }: { state: AppState; today: ISODate }) {
  const on = state.money?.balanceOn;
  // Older saved data has no date: say nothing rather than guess.
  if (!on || on >= today) return null;
  return (
    <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-tight-soft px-4 py-2" role="status">
      <span className="flex items-center gap-2">
        <RefreshCw className="size-4 shrink-0 text-tight" aria-hidden />
        Your balance is from {formatShort(on)}. Update it so the answer here is right.
      </span>
      <a
        href={`/plans?due=${today}`}
        className="inline-flex min-h-11 items-center rounded-md border border-foreground/25 bg-card px-4 font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Update my balance
      </a>
    </p>
  );
}
