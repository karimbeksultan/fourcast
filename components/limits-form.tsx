"use client";

// F4 (LIMIT_GUARD.md): the spending limit each app shows, typed in. Only shown, never calculated.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUSD } from "@/lib/dates";
import type { AppState, Lender } from "@/lib/types";
import { toCents, toDollars } from "./copy";

export function LimitsForm({ state, onSave }: { state: AppState; onSave: (next: AppState) => void }) {
  const lenders = [...new Set(state.plans.map((p) => p.lender))].filter((l) => l !== "Other") as Lender[];
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(lenders.map((l) => [l, state.limits?.[l] ? toDollars(state.limits[l]!) : ""])),
  );
  const [error, setError] = useState<string | null>(null);

  if (lenders.length === 0) return null;
  const saved = lenders.filter((l) => state.limits?.[l]);

  if (!editing) {
    return (
      <div className="space-y-2 border-t pt-3 text-sm">
        <p className="font-semibold">Limits your apps show</p>
        {saved.length > 0 ? (
          <dl className="tabular grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {saved.map((l) => (
              <div key={l} className="contents">
                <dt className="text-muted-foreground">{l}</dt>
                <dd>{formatUSD(state.limits![l]!)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted-foreground">Optional. Add them to see what&apos;s at stake when a payment is at risk.</p>
        )}
        <Button variant="outline" className="h-11 px-4" onClick={() => setEditing(true)}>
          {saved.length > 0 ? "Edit limits" : "Add limits"}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 border-t pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const limits: Partial<Record<Lender, number>> = { ...state.limits };
        for (const l of lenders) {
          const raw = values[l]?.trim() ?? "";
          if (!raw) {
            delete limits[l];
            continue;
          }
          const cents = toCents(raw);
          if (cents === null || cents <= 0) return setError(`Enter the ${l} limit as an amount, like 1000.`);
          limits[l] = cents;
        }
        setError(null);
        onSave({ ...state, limits });
        setEditing(false);
      }}
    >
      <p className="text-sm font-semibold">Limits your apps show</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {lenders.map((l) => (
          <div key={l} className="space-y-1.5">
            <Label htmlFor={`limit-${l}`}>{l} limit</Label>
            <Input
              id={`limit-${l}`}
              className="h-11"
              inputMode="decimal"
              placeholder="$1,000"
              value={values[l] ?? ""}
              onChange={(e) => setValues({ ...values, [l]: e.target.value })}
            />
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-short" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="h-10">
          Save limits
        </Button>
        <Button type="button" variant="ghost" className="h-10" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
