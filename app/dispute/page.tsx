"use client";

// F3 (LIMIT_GUARD.md): a ready letter for a plan that keeps charging after a return.
import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { draftDispute, ISSUES, type DisputeIssue, type Letter } from "@/components/dispute-template";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useQueryParam } from "@/hooks/use-query-param";
import { useToday } from "@/hooks/use-today";
import { formatShort, formatUSD } from "@/lib/dates";
import { planDebits } from "@/lib/plan";
import { cn } from "@/lib/utils";

const CFPB = "https://www.consumerfinance.gov/complaint/";

export default function DisputePage() {
  const [state] = useAppState();
  const today = useToday();
  const planId = useQueryParam("plan");
  const [issue, setIssue] = useState<DisputeIssue>("refund_not_applied");
  const [details, setDetails] = useState("");
  const [letter, setLetter] = useState<(Letter & { source: "ai" | "template" }) | null>(null);
  const [writing, setWriting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (state === undefined || !today) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    );
  }

  const plan = state?.plans.find((p) => p.id === planId);
  if (!state || !plan) {
    return (
      <section className="max-w-xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Write my dispute</h1>
        <p className="text-lg text-muted-foreground">Open a plan on Plans and choose &quot;I returned this&quot; first.</p>
        <Link href="/plans" className={cn(buttonVariants(), "h-12 px-6 text-base")}>
          Go to Guard
        </Link>
      </section>
    );
  }

  const left = planDebits(plan, today);
  const input = {
    lender: plan.lender,
    merchant: plan.merchant,
    installment: plan.installment,
    paymentsLeft: left.length,
    nextDue: left[0] ?? null,
    issue,
    returnedOn: plan.returnedOn ?? null,
    details,
  };

  const write = async () => {
    setWriting(true);
    setCopied(false);
    try {
      const res = await fetch("/api/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, today }),
      });
      if (res.ok) {
        const data = (await res.json()) as { letter?: Letter; source?: "ai" | "template" };
        if (data.letter?.subject && data.letter?.body) {
          setLetter({ ...data.letter, source: data.source === "ai" ? "ai" : "template" });
          return;
        }
      }
    } catch {
      // fall back to the template below
    } finally {
      setWriting(false);
    }
    setLetter({ ...draftDispute(input), source: "template" });
  };

  const copy = async () => {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${letter.subject}\n\n${letter.body}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <header className="max-w-3xl space-y-2">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Write my dispute</h1>
        <p className="text-lg text-muted-foreground">
          {plan.lender}
          {plan.merchant ? `, ${plan.merchant}` : ""}: {formatUSD(plan.installment)} × {left.length} left
          {left[0] ? `, next ${formatShort(left[0])}` : ""}.
          {plan.returnedOn ? ` Returned ${formatShort(plan.returnedOn)}.` : ""}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <form
          className="space-y-4 rounded-md border bg-card p-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void write();
          }}
        >
          <fieldset className="space-y-2">
            <legend className="mb-1 font-semibold">What went wrong?</legend>
            {ISSUES.map((i) => (
              <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-checked:border-primary has-checked:bg-ok-soft">
                <input type="radio" name="issue" value={i.id} checked={issue === i.id} onChange={() => setIssue(i.id)} className="accent-primary" />
                {i.label}
              </label>
            ))}
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="details">Anything else they should know? (optional)</Label>
            <textarea
              id="details"
              rows={3}
              maxLength={600}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="The store confirmed the return on Nov 10."
              className="w-full rounded-md border border-input bg-card p-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p className="text-xs text-muted-foreground">Don&apos;t add your name or card number here. The letter leaves blanks for them.</p>
          </div>
          <Button type="submit" className="h-12 px-6 text-base" disabled={writing}>
            {writing ? "Writing…" : letter ? "Write it again" : "Write my letter"}
          </Button>
        </form>

        <aside className="space-y-3 rounded-md border bg-card p-4 text-sm sm:p-5">
          <h2 className="text-lg font-semibold">Where to send it</h2>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>In the {plan.lender} app, open Help or Support and start a message about this order.</li>
            <li>Paste the letter and fill in the blanks.</li>
            <li>
              If they don&apos;t answer in 15 days, file with the{" "}
              <a href={CFPB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4">
                CFPB
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
              .
            </li>
          </ol>
        </aside>
      </div>

      {letter && (
        <section className="max-w-3xl space-y-3" aria-live="polite" aria-labelledby="letter">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="letter" className="text-2xl font-bold">
              Your letter
            </h2>
            <span className="text-xs text-muted-foreground">
              {letter.source === "ai" ? "Drafted by AI. Check it before you send it." : "Written from a template."}
            </span>
          </div>
          <div className="rounded-md border bg-card p-4 sm:p-6">
            <p className="font-semibold">Subject: {letter.subject}</p>
            <p className="mt-3 whitespace-pre-wrap">{letter.body}</p>
          </div>
          <Button variant="outline" className="h-11" onClick={copy}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? "Copied" : "Copy letter"}
          </Button>
        </section>
      )}
    </>
  );
}
