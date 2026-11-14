"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import { shrinkImage } from "@/lib/image";
import { getSampleKlarnaText } from "@/lib/sample";
import { LENDERS, type ISODate, type Lender, type Plan, type ReadPlanResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toCents, toDollars } from "./copy";

type Mode = "paste" | "screenshot" | "manual";

const ERRORS: Record<string, string> = {
  no_keys: "Reading screenshots is off right now. Type the plan in instead.",
  unreadable: "That doesn't look like a pay-later plan. Check the text or type it in.",
  timeout: "That took too long. Type the plan in instead.",
  too_large: "That image is too big. Try a smaller screenshot or type it in.",
};

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AddPlan({ today, sample, onAdd }: { today: ISODate; sample: boolean; onAdd: (plan: Plan) => void }) {
  const [mode, setMode] = useState<Mode>("paste");
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Plan | null>(null);
  const [manual, setManual] = useState({ lender: "Klarna" as Lender, merchant: "", amount: "", left: "3", next: addDays(today, 7) });
  const [manualError, setManualError] = useState<string | null>(null);

  const read = async (body: { text?: string; imageBase64?: string }) => {
    setReading(true);
    setError(null);
    setFound(null);
    try {
      const res = await fetch("/api/read-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, today }),
      });
      const data = (await res.json()) as ReadPlanResponse;
      if ("plan" in data) setFound(data.plan);
      else setError(ERRORS[data.code] ?? data.error);
    } catch {
      setError("Couldn't reach Fourcast. Check your connection or type the plan in.");
    } finally {
      setReading(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await read({ imageBase64: await shrinkImage(file) });
    } catch {
      setError("Couldn't open that image. Try another screenshot or type the plan in.");
    }
  };

  const toManual = (from?: Plan) => {
    if (from) {
      setManual({
        lender: from.lender,
        merchant: from.merchant,
        amount: toDollars(from.installment),
        left: String(from.paymentsLeft),
        next: from.nextDue,
      });
    }
    setMode("manual");
    setFound(null);
  };

  const addManual = () => {
    const installment = toCents(manual.amount);
    const left = Number(manual.left);
    if (!installment || installment <= 0) return setManualError("Enter the amount of each payment.");
    if (!Number.isInteger(left) || left < 1 || left > 12) return setManualError("Payments left should be 1 to 12.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(manual.next)) return setManualError("Pick the date of the next payment.");
    setManualError(null);
    onAdd({
      id: `plan-${Date.now().toString(36)}`,
      lender: manual.lender,
      merchant: manual.merchant.trim(),
      installment,
      paymentsLeft: left,
      nextDue: manual.next,
      intervalDays: 14,
    });
    setManual({ ...manual, merchant: "", amount: "" });
  };

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setError(null);
      }}
      className={cn(
        "h-10 flex-1 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        mode === m ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4" aria-labelledby="add-plan">
      <h2 id="add-plan" className="text-lg font-semibold">
        Add a plan
      </h2>
      <div role="tablist" className="flex gap-1 rounded-xl bg-muted p-1">
        {tab("paste", "Paste text")}
        {tab("screenshot", "Screenshot")}
        {tab("manual", "Type it in")}
      </div>

      {mode === "paste" && !found && (
        <div className="space-y-2">
          <Label htmlFor="plan-text">Paste the confirmation email or app text</Label>
          <textarea
            id="plan-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-input bg-card p-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="You paid $80.00 at Target. Next payment: $80.00 on…"
          />
          <div className="flex flex-wrap gap-2">
            <Button className="h-11 px-5 text-base" disabled={reading || !text.trim()} onClick={() => read({ text })}>
              Read plan
            </Button>
            {sample && !text && (
              <Button variant="outline" className="h-11" onClick={() => setText(getSampleKlarnaText(today))}>
                Paste the sample Klarna text
              </Button>
            )}
          </div>
        </div>
      )}

      {mode === "screenshot" && !found && (
        <div className="space-y-2">
          <Label htmlFor="plan-file">Screenshot of the plan in Klarna, Afterpay or Affirm</Label>
          <Input id="plan-file" type="file" accept="image/*" className="h-11 py-2" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      )}

      {reading && (
        <div className="flex flex-wrap items-center gap-3 text-sm" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Reading your plan…
          <Button variant="link" className="h-auto p-0" onClick={() => toManual()}>
            Type it in instead
          </Button>
        </div>
      )}

      {error && !reading && (
        <div className="space-y-2 rounded-lg bg-short-soft p-3 text-sm" role="alert">
          <p>{error}</p>
          {mode !== "manual" && (
            <Button variant="outline" className="h-10" onClick={() => toManual()}>
              Type it in
            </Button>
          )}
        </div>
      )}

      {found && (
        <div className="space-y-3 rounded-xl border p-3">
          <p className="text-sm text-muted-foreground">Check what we read:</p>
          <p className="font-semibold">
            {found.lender}
            {found.merchant && <span className="font-normal text-muted-foreground">, {found.merchant}</span>}
          </p>
          <p className="tabular text-sm">
            {formatUSD(found.installment)} × {found.paymentsLeft} left, next {formatShort(found.nextDue)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-11 px-5 text-base"
              onClick={() => {
                onAdd(found);
                setFound(null);
                setText("");
              }}
            >
              Add plan
            </Button>
            <Button variant="outline" className="h-11" onClick={() => toManual(found)}>
              Fix something
            </Button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            addManual();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="m-lender">Service</Label>
            <select
              id="m-lender"
              className={selectClass}
              value={manual.lender}
              onChange={(e) => setManual({ ...manual, lender: e.target.value as Lender })}
            >
              {LENDERS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-merchant">Store (optional)</Label>
            <Input id="m-merchant" className="h-11" value={manual.merchant} onChange={(e) => setManual({ ...manual, merchant: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-amount">Each payment</Label>
            <Input
              id="m-amount"
              className="h-11"
              inputMode="decimal"
              placeholder="$80.00"
              value={manual.amount}
              onChange={(e) => setManual({ ...manual, amount: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-left">Payments left</Label>
            <Input
              id="m-left"
              className="h-11"
              inputMode="numeric"
              value={manual.left}
              onChange={(e) => setManual({ ...manual, left: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="m-next">Next payment</Label>
            <Input id="m-next" type="date" className="h-11" value={manual.next} onChange={(e) => setManual({ ...manual, next: e.target.value })} />
          </div>
          {manualError && (
            <p className="text-sm text-short sm:col-span-2" role="alert">
              {manualError}
            </p>
          )}
          <Button type="submit" className="h-11 px-5 text-base sm:col-span-2 sm:justify-self-start">
            Add plan
          </Button>
        </form>
      )}
    </section>
  );
}
