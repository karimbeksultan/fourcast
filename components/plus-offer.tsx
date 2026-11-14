"use client";

// The Plus offer (paywall). Shown on Guard and on Before you buy. Stripe test mode when the server
// has a key, otherwise a clearly labelled demo checkout.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addDays, formatShort } from "@/lib/dates";
import type { AppState, ISODate, Timeline } from "@/lib/types";

export function PlusOffer({
  state,
  timeline,
  today,
  save,
  id = "plus",
}: {
  state: AppState;
  timeline: Timeline;
  today: ISODate;
  save: (s: AppState) => void;
  id?: string;
}) {
  const [step, setStep] = useState<"offer" | "checkout">("offer");
  const [plan, setPlan] = useState<"year" | "month">("year");
  const [opening, setOpening] = useState(false);
  const trialEnds = timeline.paydays[1] ?? addDays(today, 28);

  const startTrial = async () => {
    setOpening(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trialEnds }),
      });
      const data = (await res.json()) as { url?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // fall through to the demo checkout
    }
    setOpening(false);
    setStep("checkout");
  };

  return (
    <aside id={id} className="h-fit scroll-mt-28 space-y-4 rounded-md border-2 border-payday bg-card p-4 sm:p-5" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        Get a heads-up the night before
      </h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>A reminder at 8 pm before a payment won&apos;t make it, with a one-tap check-in</li>
        <li>Payday Sync: the day to buy so every payment lands the morning after payday</li>
        <li>The exact day a new buy would run you short, and the first day it fits</li>
      </ul>

      {step === "offer" ? (
        <>
          <div>
            <p className="tabular text-3xl font-bold">$29.99 a year</p>
            <p className="text-sm text-muted-foreground">or $4.99 a month</p>
          </div>
          <p className="text-sm">Free for your next 2 paydays, until {formatShort(trialEnds)}. Cancel any time.</p>
          <Button className="h-12 w-full text-base" onClick={startTrial} disabled={opening}>
            {opening ? "Opening checkout…" : "Start free trial"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Payments run in Stripe test mode. Use card 4242 4242 4242 4242, any future date and any CVC. No real money moves.
          </p>
        </>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save({ ...state, plus: { since: today, trialEnds, via: "demo" } });
          }}
        >
          <p className="rounded-lg bg-tight-soft px-3 py-2 text-sm">Demo checkout — no real payment.</p>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">After the trial</legend>
            {(
              [
                ["year", "$29.99 a year", "Save 50%"],
                ["month", "$4.99 a month", ""],
              ] as const
            ).map(([value, label, note]) => (
              <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-payday has-checked:bg-payday-soft">
                <input type="radio" name={`${id}-plan`} value={value} checked={plan === value} onChange={() => setPlan(value)} className="accent-payday" />
                <span className="tabular font-medium">{label}</span>
                {note && <span className="ml-auto text-xs text-muted-foreground">{note}</span>}
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-muted-foreground">Nothing is charged before {formatShort(trialEnds)}.</p>
          <Button type="submit" className="h-12 w-full text-base">
            Start my free trial
          </Button>
        </form>
      )}
    </aside>
  );
}
