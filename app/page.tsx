"use client";

// Scaffold page: proves the contract works end to end on sample data.
// A3 (Ayat) replaces it with the real "/" screen from DESIGN.md.
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToday } from "@/hooks/use-today";
import { formatShort, formatUSD } from "@/lib/dates";
import { buildTimeline, checkPurchase } from "@/lib/plan";
import { getSampleKlarnaPlan, getSampleState } from "@/lib/sample";

export default function Home() {
  const today = useToday();
  const result = useMemo(() => {
    if (!today) return null;
    const sample = getSampleState(today);
    const state = { ...sample, plans: [...sample.plans, getSampleKlarnaPlan(today)] };
    return {
      timeline: buildTimeline(state, today),
      verdict: checkPurchase(state, { price: 24_000, payments: 4 }, today),
    };
  }, [today]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Fourcast</h1>
        <Badge variant="secondary">Sample data</Badge>
      </div>
      <p className="text-muted-foreground">See every Pay in 4 before it lands.</p>

      {!result ? (
        <p className="text-muted-foreground">Loading your next 6 weeks…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {result.timeline.status === "ok" ? "You're fine." : result.timeline.status === "tight" ? "It's tight." : "You'll be short."}
              </CardTitle>
              <CardDescription>
                Lowest point: {formatUSD(result.timeline.lowest.balance)} on {formatShort(result.timeline.lowest.date)}.{" "}
                {formatUSD(result.timeline.owed)} owed, {result.timeline.debitsInWindow} payments in 6 weeks.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{result.verdict.verdict === "fits" ? "It fits." : "Not right now."}</CardTitle>
              <CardDescription>$240 in 4 payments, bought today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {result.verdict.deepest && (
                <p>
                  You&apos;d be {formatUSD(result.verdict.deepest.amount)} short on {formatShort(result.verdict.deepest.date)}.
                </p>
              )}
              {result.verdict.bestDay && <p>It fits if you buy on or after {formatShort(result.verdict.bestDay)}.</p>}
              {result.verdict.paydaySync && (
                <p>Buy {formatShort(result.verdict.paydaySync.buyOn)}: all 4 payments land on paydays.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <p className="mt-auto text-xs text-muted-foreground">Not financial advice. Your data stays in your browser.</p>
    </main>
  );
}
