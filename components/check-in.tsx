"use client";

// The return mechanic (FAQ Q100): every calendar reminder links to /?due=YYYY-MM-DD.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import { applyCheckIn, buildTimeline } from "@/lib/plan";
import type { AppState, ISODate } from "@/lib/types";
import { toCents } from "./copy";

export function CheckIn({
  due,
  state,
  today,
  onSave,
  onClose,
}: {
  due: ISODate;
  state: AppState;
  today: ISODate;
  onSave: (next: AppState) => void;
  onClose: () => void;
}) {
  const [balance, setBalance] = useState("");
  const [result, setResult] = useState<{ ok: boolean; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!state.money) return null;
  const day = buildTimeline(state, today).days.find((d) => d.date === due);
  const debits = day?.events.filter((e) => e.kind === "debit") ?? [];
  // Morning model (LIMIT_GUARD.md F1): lenders take the payment before the paycheck lands.
  const morning = due === addDays(today, 1) ? "tomorrow morning" : due === today ? "this morning" : `the morning of ${formatShort(due)}`;
  const paydayLater = day?.events.some((e) => e.kind === "paycheck") ?? false;
  const what = debits.length
    ? `${debits.map((e) => (e.kind === "debit" ? `${e.lender} takes ${formatUSD(e.amount)}` : "")).join(" and ")} ${morning}${paydayLater ? ", before your paycheck lands" : ""}`
    : `Nothing is due ${morning}`;

  const update = () => {
    const cents = toCents(balance);
    if (cents === null) return setError("Enter what's in checking, like 412.30.");
    setError(null);
    // The typed number is what's in checking now, at the end of today. Money.balance is the start of today,
    // so applyCheckIn puts today's debits and spending back; otherwise they'd be subtracted twice.
    const next = applyCheckIn(state, cents, today);
    onSave(next);
    const after = buildTimeline(next, today).days.find((d) => d.date === due);
    if (after) setResult({ ok: after.morning >= 0, amount: Math.abs(after.morning) });
  };

  return (
    <section className="space-y-3 rounded-md border-2 border-payday bg-card p-4" aria-labelledby="checkin">
      <h2 id="checkin" className="text-xl font-semibold text-balance">
        {what}. What&apos;s in checking right now?
      </h2>
      {!result ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update();
          }}
        >
          <div className="min-w-40 flex-1 space-y-1.5">
            <Label htmlFor="checkin-balance">Balance in checking</Label>
            <Input
              id="checkin-balance"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "checkin-error" : undefined}
              className="h-11"
              inputMode="decimal"
              placeholder="$412.30"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="h-11 px-5 text-base">
            Update
          </Button>
          {error && (
            <p id="checkin-error" className="w-full text-sm text-short" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="space-y-2" role="status">
          <p className={result.ok ? "text-lg font-semibold text-ok" : "text-lg font-semibold text-short"}>
            {result.ok
              ? `You're covered: ${formatUSD(result.amount)} left after it that morning.`
              : `You'll be ${formatUSD(result.amount)} short ${morning}. Move money in tonight${paydayLater ? " or pay it by hand after your paycheck lands" : ""}.`}
          </p>
          <Button variant="outline" className="h-10" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </section>
  );
}
