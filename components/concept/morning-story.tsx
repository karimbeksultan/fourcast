"use client";

// The landing's one authored moment: the same Friday morning played twice. First without Fourcast (autopay at
// 6 am takes checking below $0, the paycheck at 3 pm is too late, the limit is at risk), then with it (move money
// the evening before, the debit clears). Numbers come from the sample through lib/plan.ts, counted from today.
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react";
import { BellRing, CircleCheck, CircleX, Pause, Play, Sunrise, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import { moveAmount } from "@/lib/plan";
import type { DebitRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = {
  at: string;
  /** 0–1 position on the day bar (6 pm the day before → 6 pm the day). */
  pos: number;
  icon: typeof Sunrise;
  line: string;
  balance: number;
  tone: "neutral" | "short" | "ok" | "payday";
  stamp?: string;
};

function buildSteps(risk: DebitRisk, paycheck: number): { without: Step[]; withIt: Step[] } {
  const before = risk.morning + risk.amount; // the evening before, after everything else that day
  const move = moveAmount(risk.shortBy);
  const night = formatShort(addDays(risk.date, -1)).split(",")[0];
  const day = formatShort(risk.date).split(",")[0];
  return {
    without: [
      { at: `${night} 9 pm`, pos: 0.1, icon: Wallet, line: "In checking tonight", balance: before, tone: "neutral" },
      { at: `${day} 6 am`, pos: 0.5, icon: Sunrise, line: `${risk.lender} autopay takes ${formatUSD(risk.amount)}`, balance: risk.morning, tone: "short", stamp: "Payment failed" },
      { at: `${day} 3 pm`, pos: 0.88, icon: Wallet, line: `Paycheck lands, +${formatUSD(paycheck)}`, balance: risk.morning + paycheck, tone: "payday", stamp: risk.limit ? `Too late: ${formatUSD(risk.limit)} limit at risk` : "Too late: marked late" },
    ],
    withIt: [
      { at: `${night} 8 pm`, pos: 0.1, icon: BellRing, line: `Fourcast: move ${formatUSD(move)} in tonight`, balance: before + move, tone: "neutral" },
      { at: `${day} 6 am`, pos: 0.5, icon: Sunrise, line: `${risk.lender} autopay takes ${formatUSD(risk.amount)}`, balance: risk.morning + move, tone: "ok", stamp: "Cleared" },
      { at: `${day} 3 pm`, pos: 0.88, icon: Wallet, line: `Paycheck lands, +${formatUSD(paycheck)}`, balance: risk.morning + move + paycheck, tone: "payday", stamp: risk.limit ? `${formatUSD(risk.limit)} limit safe` : "On time" },
    ],
  };
}

function Counter({ cents, reduce }: { cents: number; reduce: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(cents);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = formatUSD(cents);
      last.current = cents;
      return;
    }
    const controls = animate(last.current, cents, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = formatUSD(Math.round(v))),
    });
    last.current = cents;
    return () => controls.stop();
  }, [cents, reduce]);
  return <span ref={ref}>{formatUSD(cents)}</span>;
}

const TONE = {
  neutral: "bg-card",
  short: "bg-short-soft",
  ok: "bg-ok-soft",
  payday: "bg-payday-soft",
} as const;

export function MorningStory({ risk, paycheck }: { risk: DebitRisk; paycheck: number }) {
  const reduce = useReducedMotion() ?? false;
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box, { amount: 0.4 });
  const { without, withIt } = buildSteps(risk, paycheck);
  // 0–2: without Fourcast, 3–5: with it. Reduced motion lands on the outcome and stays there.
  const [i, setI] = useState(reduce ? 5 : 0);
  // WCAG 2.2.2: a loop that runs longer than 5 seconds needs a way to stop it.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || !visible || paused) return;
    const t = window.setTimeout(() => setI((n) => (n + 1) % 6), i === 2 || i === 5 ? 3200 : 1900);
    return () => window.clearTimeout(t);
  }, [i, reduce, visible, paused]);

  const withFourcast = i >= 3;
  const steps = withFourcast ? withIt : without;
  const step = steps[i % 3];
  const Icon = step.icon;

  return (
    <div ref={box} className="rounded-lg bg-card p-4 text-foreground sm:p-6" aria-label="Example: the same morning without and with Fourcast">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {withFourcast ? "With Fourcast" : "Without Fourcast"}
          <span className="font-normal text-muted-foreground">, sample data</span>
        </p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1].map((k) => (
              <span key={k} className={cn("h-1.5 w-6 rounded-full transition-colors duration-500", (k === 1) === withFourcast ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          {!reduce && (
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Play the story" : "Pause the story"}
              className="flex size-11 items-center justify-center rounded-md border outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            </button>
          )}
        </div>
      </div>

      {/* The day bar: evening before → morning → afternoon */}
      <div className="relative mt-5 h-10" aria-hidden>
        <div className="absolute inset-x-0 top-4 h-1 rounded-full bg-muted" />
        <div className="absolute top-4 left-[44%] h-1 w-[12%] rounded-full bg-short/40" />
        {[
          { at: 0.1, label: "Evening" },
          { at: 0.5, label: "6 am" },
          { at: 0.88, label: "3 pm" },
        ].map((m) => (
          <span key={m.label} className="absolute top-7 -translate-x-1/2 text-xs text-muted-foreground" style={{ left: `${m.at * 100}%` }}>
            {m.label}
          </span>
        ))}
        <motion.span
          className={cn("absolute top-2.5 size-4 -translate-x-1/2 rounded-full ring-4 ring-card", step.tone === "short" ? "bg-short" : step.tone === "ok" ? "bg-ok" : step.tone === "payday" ? "bg-payday" : "bg-foreground")}
          animate={{ left: `${step.pos * 100}%` }}
          transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className={cn("mt-3 rounded-md p-4 transition-colors duration-500", TONE[step.tone])}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${withFourcast}-${i}`}
            initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3"
          >
            <Icon className="mt-1 size-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{step.at}</p>
              <p className="font-semibold text-pretty">{step.line}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        {/* No live region: the loop would announce a balance every two seconds. The figure text is enough. */}
        <p className={cn("tabular mt-3 text-4xl font-bold tracking-tight sm:text-5xl", step.balance < 0 && "text-short")}>
          <Counter cents={step.balance} reduce={reduce} />
        </p>
        <p className="text-sm text-muted-foreground">in checking</p>
      </div>

      <div className="mt-3 h-9">
        <AnimatePresence mode="popLayout">
          {step.stamp && (
            <motion.p
              key={step.stamp}
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
              // Lands after the balance has moved, so cause comes before verdict.
              transition={{ duration: 0.3, delay: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold",
                withFourcast ? "bg-ok text-primary-foreground" : "bg-short text-primary-foreground",
              )}
            >
              {withFourcast ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
              {step.stamp}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
