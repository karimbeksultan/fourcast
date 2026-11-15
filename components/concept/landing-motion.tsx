"use client";

// Supporting pieces for the landing: the headline (static), the marquee band, and three
// colored panels whose small live pieces show the three answers. Every piece has a reduced-motion path.
import { motion, useInView, useReducedMotion } from "motion/react";
import { Check, CircleX, PackageCheck, Pause, Play, Store, Wallet } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/logo";
import { Marquee } from "@/components/ui/marquee";
import { formatShort, formatUSD } from "@/lib/dates";
import type { DebitRisk, TimelineDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The headline as plain text with the highlighted phrase on its plate. Static on purpose: it is the first thing on the page. */
export function RevealHeadline({ words, highlight, className }: { words: string[]; highlight: string; className?: string }) {
  return (
    <h1 className={className}>
      {words.join(" ")} <span className="mt-[0.14em] inline-block rounded-md bg-payday px-2.5 pb-[0.1em] leading-none text-on-payday">{highlight}</span>
    </h1>
  );
}

/** A moving statement band, with the Fourcast mark between repeats. Pauses on hover; still for reduced motion. */
export function Band({ text, tone = "ink" }: { text: string; tone?: "ink" | "sky" }) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  // The loop only runs while the band is on screen.
  const onScreen = useInView(ref, { margin: "100px" });
  // WCAG 2.2.2: moving text needs a pause control, not only pause-on-hover.
  const [paused, setPaused] = useState(false);
  const item = (
    <span className="flex items-center gap-8 text-2xl font-bold tracking-tight whitespace-nowrap sm:text-3xl">
      {text}
      <LogoMark className="size-9" />
    </span>
  );
  return (
    <div
      ref={ref}
      className={cn(
        "relative py-4",
        tone === "ink" ? "bg-foreground text-background" : "bg-payday-soft text-foreground",
        (!onScreen || paused) && "[&_.animate-marquee]:[animation-play-state:paused]",
      )}
    >
      {!reduce && (
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Play moving text" : "Pause moving text"}
          className={cn(
            "absolute top-1/2 right-2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tone === "ink" ? "bg-foreground hover:bg-background/15" : "bg-payday-soft hover:bg-foreground/10",
          )}
        >
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
        </button>
      )}
      <p className="sr-only">{text}</p>
      {reduce ? (
        <div className="mx-auto flex max-w-6xl px-4" aria-hidden>
          {item}
        </div>
      ) : (
        <Marquee pauseOnHover className="[--duration:28s] [--gap:2rem]" aria-hidden>
          {item}
          {item}
        </Marquee>
      )}
    </div>
  );
}

function Panel({ className, children }: { className: string; children: ReactNode }) {
  // The panel stays still under the pointer; only its surface lifts (no flicker at the edge).
  return (
    <li className="group">
      <div className={cn("flex h-full flex-col gap-5 rounded-lg p-6 transition-transform duration-300 ease-out group-hover:-translate-y-1 sm:p-7", className)}>
        {children}
      </div>
    </li>
  );
}

/** Three answers as three panels, each with a small piece of the real product moving inside it. */
export function AnswerPanels({ risk, days }: { risk: DebitRisk | null; days: TimelineDay[] }) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLUListElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.35 });
  const on = reduce || seen;
  // Three weeks, so the short mornings (the reason this panel exists) are in view.
  const mornings = days.slice(0, 21);
  const top = Math.max(1, ...mornings.map((d) => d.morning));
  const bottom = Math.max(1, ...mornings.map((d) => -d.morning));

  return (
    <ul ref={ref} className="grid gap-4 md:grid-cols-3">
      <Panel className="bg-foreground text-background">
        <h3 className="text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">Will tomorrow&apos;s payments clear?</h3>
        <p className="text-pretty text-background/90">One sentence the evening before, and the one thing to do about it.</p>
        <motion.div
          className="mt-auto rounded-md bg-short-soft p-3 text-foreground"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={on ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          <p className="flex items-center gap-2 font-semibold">
            <CircleX className="size-4 text-short" aria-hidden />
            {risk ? `${risk.lender} won't clear on ${formatShort(risk.date)}` : "Every payment clears"}
          </p>
          {risk && (
            <p className="tabular mt-1 text-sm text-pretty">
              {formatUSD(risk.shortBy)} short at 6 am. Move it in the night before.
            </p>
          )}
        </motion.div>
      </Panel>

      <Panel className="bg-payday-soft text-foreground">
        <h3 className="text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">What do my next mornings look like?</h3>
        <p className="text-pretty">Balances after autopay, before the paycheck, with every lender on one strip.</p>
        <div className="mt-auto flex h-32 items-stretch gap-[3px]" aria-hidden>
          {mornings.map((d, i) => {
            const h = Math.max(8, d.morning >= 0 ? (d.morning / top) * 100 : (-d.morning / bottom) * 100);
            const pay = d.events.some((e) => e.kind === "paycheck");
            return (
              <div key={d.date} className="flex h-full flex-1 flex-col">
                <div className="flex flex-[3] items-end">
                  {d.morning >= 0 && (
                    <motion.span
                      className={cn("block w-full rounded-t-sm", pay ? "bg-payday" : "bg-primary")}
                      style={{ height: `${h}%`, originY: 1 }}
                      initial={reduce ? false : { scaleY: 0 }}
                      animate={on ? { scaleY: 1 } : undefined}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.04, ease: EASE }}
                    />
                  )}
                </div>
                <span className="h-px bg-foreground/40" />
                <div className="flex flex-1 items-start">
                  {d.morning < 0 && (
                    <motion.span
                      className="block w-full rounded-b-sm bg-short"
                      style={{ height: `${h}%`, originY: 0 }}
                      initial={reduce ? false : { scaleY: 0 }}
                      animate={on ? { scaleY: 1 } : undefined}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.04, ease: EASE }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="bg-primary text-primary-foreground">
        <h3 className="text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">Where is my refund?</h3>
        <p className="text-pretty">Followed from the box you sent back to the credit on your plan.</p>
        <ol className="mt-auto space-y-2" aria-label="Refund steps">
          {[
            { icon: PackageCheck, label: "You sent it back" },
            { icon: Store, label: "Store refunded" },
            { icon: Wallet, label: "Lender credited" },
          ].map((s, i) => (
            <motion.li
              key={s.label}
              className="flex items-center gap-3 rounded-md bg-primary-foreground/10 px-3 py-2 font-semibold"
              initial={reduce ? false : { opacity: 0.35 }}
              animate={on ? { opacity: 1 } : undefined}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.45 }}
            >
              <motion.span
                className="flex size-6 items-center justify-center rounded-full bg-primary-foreground text-primary"
                initial={reduce ? false : { scale: 0.4 }}
                animate={on ? { scale: 1 } : undefined}
                transition={{ duration: 0.35, delay: 0.35 + i * 0.45, ease: EASE }}
              >
                {i < 2 ? <Check className="size-3.5" aria-hidden /> : <s.icon className="size-3.5" aria-hidden />}
              </motion.span>
              {s.label}
            </motion.li>
          ))}
        </ol>
      </Panel>
    </ul>
  );
}
