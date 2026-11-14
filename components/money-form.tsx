"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, parts } from "@/lib/dates";
import type { ISODate, Money, PayFrequency } from "@/lib/types";
import { FREQUENCY_LABEL, toCents, toDollars } from "./copy";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MoneyForm({ initial, today, onSave }: { initial: Money | null; today: ISODate; onSave: (money: Money) => void }) {
  const [f, setF] = useState({
    balance: initial ? toDollars(initial.balance) : "",
    paycheck: initial ? toDollars(initial.paycheck) : "",
    frequency: (initial?.frequency ?? "biweekly") as PayFrequency,
    nextPayday: initial?.nextPayday ?? addDays(today, 7),
    rent: initial ? toDollars(initial.rent) : "",
    rentDay: String(initial?.rentDay ?? parts(addDays(today, 14)).day),
    weeklySpend: initial ? toDollars(initial.weeklySpend) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = () => {
    const balance = toCents(f.balance);
    const paycheck = toCents(f.paycheck);
    const rent = f.rent.trim() ? toCents(f.rent) : 0;
    const weeklySpend = f.weeklySpend.trim() ? toCents(f.weeklySpend) : 0;
    const rentDay = Number(f.rentDay);
    if (balance === null) return setError("Enter what's in checking now, like 920.50.");
    if (paycheck === null || paycheck < 0) return setError("Enter your take-home pay per paycheck.");
    if (rent === null || rent < 0) return setError("Rent should be an amount, or leave it empty.");
    if (weeklySpend === null || weeklySpend < 0) return setError("Everyday spending should be an amount, or leave it empty.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.nextPayday)) return setError("Pick your next payday.");
    if (!Number.isInteger(rentDay) || rentDay < 1 || rentDay > 31) return setError("Rent day should be 1 to 31.");
    setError(null);
    onSave({ balance, paycheck, frequency: f.frequency, nextPayday: f.nextPayday, rent, rentDay, weeklySpend });
  };

  const field = (id: keyof typeof f, label: string, hint?: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`money-${id}`}>{label}</Label>
      <Input
        id={`money-${id}`}
        className="h-11"
        inputMode="decimal"
        placeholder={placeholder}
        value={f[id]}
        onChange={set(id)}
        aria-describedby={hint ? `money-${id}-hint` : undefined}
      />
      {hint && (
        <p id={`money-${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {field("balance", "Balance in checking", "What your bank app shows right now.", "$920.50")}
      {field("paycheck", "Take-home pay", "Per paycheck, after taxes.", "$1,450")}
      <div className="space-y-1.5">
        <Label htmlFor="money-frequency">How often</Label>
        <select id="money-frequency" className={selectClass} value={f.frequency} onChange={set("frequency")}>
          {(Object.keys(FREQUENCY_LABEL) as PayFrequency[]).map((k) => (
            <option key={k} value={k}>
              {FREQUENCY_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="money-next">Next payday</Label>
        <Input id="money-next" type="date" className="h-11" value={f.nextPayday} onChange={set("nextPayday")} />
      </div>
      {field("rent", "Rent", "Leave empty if you don't pay rent.", "$1,200")}
      <div className="space-y-1.5">
        <Label htmlFor="money-rentDay">Rent day</Label>
        <Input id="money-rentDay" className="h-11" inputMode="numeric" value={f.rentDay} onChange={set("rentDay")} />
      </div>
      {field("weeklySpend", "Everyday spending per week", "Groceries, gas, eating out.", "$280")}
      {error && (
        <p className="text-sm text-short sm:col-span-2" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="h-11 px-5 text-base sm:col-span-2 sm:justify-self-start">
        Save my money
      </Button>
    </form>
  );
}
