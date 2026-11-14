"use client";

// The memorable thing (DESIGN.md): 42 days as a US calendar, 7 × 6.
import { House } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShort, formatUSD, parts } from "@/lib/dates";
import { TIGHT_BELOW, dayLow } from "@/lib/plan";
import type { DebitRisk, ISODate, Timeline, TimelineDay, Verdict } from "@/lib/types";
import { LENDER_MARK } from "./copy";

export type Tone = "ok" | "tight" | "short" | "fit" | "nofit";

export type Cell = {
  date: ISODate;
  tone: Tone;
  payday: boolean;
  marks: string[];
  rent: boolean;
  label: string;
  /** A plan payment that day may not go through in the morning (Guard). */
  risk?: "fails" | "tight";
};

const TONE_CLASS: Record<Tone, string> = {
  ok: "border border-border bg-card",
  tight: "bg-tight-soft",
  short: "bg-short-soft",
  fit: "bg-ok-soft",
  nofit: "bg-muted",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function weekday(date: ISODate): number {
  const { year, month, day } = parts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function toneOf(balance: number): Tone {
  if (balance < 0) return "short";
  if (balance < TIGHT_BELOW) return "tight";
  return "ok";
}

function dayLabel(day: TimelineDay): string {
  const parts = day.events.map((e) =>
    e.kind === "paycheck"
      ? `payday +${formatUSD(e.amount)}`
      : e.kind === "rent"
        ? `rent ${formatUSD(e.amount)}`
        : e.kind === "debit"
          ? `${e.lender} ${formatUSD(e.amount)}`
          : `new buy ${formatUSD(e.amount)}`,
  );
  const morning = day.morning < day.balance ? `${formatUSD(day.morning)} in the morning, ` : "";
  return `${formatShort(day.date)}: ${morning}${formatUSD(day.balance)} at end of day${parts.length ? `, ${parts.join(", ")}` : ""}`;
}

export function cellsFromTimeline(t: Timeline, risks: DebitRisk[] = []): Cell[] {
  const worst = new Map<ISODate, "fails" | "tight">();
  for (const r of risks) if (worst.get(r.date) !== "fails") worst.set(r.date, r.level);
  return t.days.map((d) => {
    const risk = worst.get(d.date);
    return {
      date: d.date,
      tone: toneOf(dayLow(d)),
      payday: d.events.some((e) => e.kind === "paycheck"),
      rent: d.events.some((e) => e.kind === "rent"),
      marks: d.events.flatMap((e) => (e.kind === "debit" ? [LENDER_MARK[e.lender]] : [])),
      label: dayLabel(d) + (risk === "fails" ? ", a payment may not go through that morning" : risk === "tight" ? ", a payment leaves almost nothing that morning" : ""),
      risk,
    };
  });
}

export function cellsFromVerdict(v: Verdict, t: Timeline): Cell[] {
  const paydays = new Set(t.paydays);
  return v.fitsByDay.map((f, i) => {
    const day = t.days[i];
    return {
      date: f.date,
      tone: f.fits ? "fit" : "nofit",
      payday: paydays.has(f.date),
      rent: day?.events.some((e) => e.kind === "rent") ?? false,
      marks: day?.events.flatMap((e) => (e.kind === "debit" ? [LENDER_MARK[e.lender]] : [])) ?? [],
      label: `${formatShort(f.date)}: ${f.fits ? "fits" : "doesn't fit"} if you buy that day`,
    };
  });
}

export function ForecastGrid({
  cells,
  today,
  ring,
  ringTone = "ink",
  selected,
  onSelect,
  animate = false,
  className,
}: {
  cells: Cell[];
  today: ISODate;
  ring?: ISODate | null;
  ringTone?: "ink" | "payday";
  selected?: ISODate | null;
  onSelect?: (date: ISODate) => void;
  animate?: boolean;
  className?: string;
}) {
  if (cells.length === 0) return null;
  const lead = weekday(cells[0].date);
  const slots: (Cell | null)[] = [...Array.from({ length: lead }, () => null), ...cells];
  const rows: (Cell | null)[][] = [];
  for (let i = 0; i < slots.length; i += 7) rows.push(slots.slice(i, i + 7));

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-7 gap-1.5 pb-1.5 text-center text-xs text-muted-foreground" aria-hidden>
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div role="grid" aria-label="Next 6 weeks" className="flex flex-col gap-1.5">
        {rows.map((row, r) => (
          <div
            key={r}
            role="row"
            className={cn("grid grid-cols-7 gap-1.5", animate && "forecast-row")}
            style={animate ? { animationDelay: `${r * 120}ms` } : undefined}
          >
            {row.map((cell, c) => {
              if (!cell) return <span key={c} role="gridcell" aria-hidden />;
              const { day, month } = parts(cell.date);
              const first = cell.date === cells[0].date || day === 1;
              const isRing = ring === cell.date;
              const Tag = onSelect ? "button" : "div";
              return (
                <Tag
                  key={cell.date}
                  role="gridcell"
                  type={onSelect ? "button" : undefined}
                  onClick={onSelect ? () => onSelect(cell.date) : undefined}
                  aria-label={`${WEEKDAY_NAMES[weekday(cell.date)]}, ${cell.label}`}
                  aria-selected={onSelect ? selected === cell.date : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col justify-between overflow-hidden rounded-[4px] p-1 text-left outline-none sm:min-h-16 sm:p-1.5",
                    TONE_CLASS[cell.tone],
                    onSelect && "cursor-pointer transition-[box-shadow] focus-visible:ring-3 focus-visible:ring-ring/50",
                    cell.date === today && "ring-1 ring-foreground",
                    isRing && (ringTone === "payday" ? "ring-3 ring-payday" : "ring-3 ring-foreground"),
                    selected === cell.date && !isRing && "ring-2 ring-primary",
                    cell.risk === "fails" && "outline-2 -outline-offset-2 outline-short",
                    cell.risk === "tight" && "outline-2 -outline-offset-2 outline-tight",
                  )}
                >
                  {cell.risk && (
                    <span
                      className={cn(
                        "absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white",
                        cell.risk === "fails" ? "bg-short" : "bg-tight",
                      )}
                      aria-hidden
                    >
                      !
                    </span>
                  )}
                  {cell.payday && <span className="absolute inset-x-0 top-0 h-1.5 bg-payday" aria-hidden />}
                  <span className="tabular text-[11px] leading-none text-foreground/80 sm:text-xs">
                    {first ? `${new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${day}` : day}
                  </span>
                  <span className="flex items-end gap-0.5 text-[10px] leading-none font-semibold text-foreground sm:text-[11px]">
                    {cell.rent && <House className="size-3" aria-hidden />}
                    {cell.marks.slice(0, 2).map((m, i) => (
                      <span key={i}>{m}</span>
                    ))}
                  </span>
                </Tag>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ForecastLegend({ mode = "balance" }: { mode?: "balance" | "fit" }) {
  const item = (swatch: string, text: string) => (
    <span className="flex items-center gap-1.5">
      <span className={cn("inline-block size-3 rounded-[3px]", swatch)} aria-hidden />
      {text}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-3 rounded-full bg-payday" aria-hidden />
        Payday
      </span>
      {mode === "balance" && (
        <span className="flex items-center gap-1.5">
          <span className="flex size-3.5 items-center justify-center rounded-full bg-short text-[9px] font-bold text-white" aria-hidden>
            !
          </span>
          May not go through that morning
        </span>
      )}
      {mode === "balance" ? (
        <>
          {item("border border-border bg-card", "Over $100")}
          {item("bg-tight-soft", "Under $100")}
          {item("bg-short-soft", "Below $0")}
        </>
      ) : (
        <>
          {item("bg-ok-soft", "Fits if you buy that day")}
          {item("bg-muted", "Doesn't fit")}
        </>
      )}
      <span>K, A, Af: a plan payment</span>
    </div>
  );
}

export function DayStory({ day, today }: { day: TimelineDay; today: ISODate }) {
  // Morning first (payments go out before the paycheck lands), then the paycheck and the day's spending.
  const label = (e: TimelineDay["events"][number]) =>
    e.kind === "paycheck"
      ? "Paycheck"
      : e.kind === "rent"
        ? "Rent"
        : e.kind === "debit"
          ? `${e.lender}${e.merchant ? `, ${e.merchant}` : ""}`
          : "New buy";
  const out = day.events.filter((e) => e.kind !== "paycheck").map((e) => ({ text: label(e), amount: -e.amount }));
  const paid = day.events.filter((e) => e.kind === "paycheck").map((e) => ({ text: label(e), amount: e.amount }));
  const hasMorning = out.length > 0;
  const money = (v: number, strong = false) => (
    <span className={cn("tabular", strong && "font-semibold", v < 0 && "text-short", v > 0 && !strong && "text-ok")}>
      {v < 0 ? "−" : v > 0 && !strong ? "+" : ""}
      {formatUSD(Math.abs(v))}
    </span>
  );
  return (
    <div className="space-y-2">
      <p className="font-semibold">{day.date === today ? "Today" : formatShort(day.date)}</p>
      <ul className="space-y-1 text-sm">
        {out.map((r, i) => (
          <li key={`o${i}`} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{r.text}</span>
            {money(r.amount)}
          </li>
        ))}
        {hasMorning && (
          <li className="flex justify-between gap-4 border-t pt-1">
            <span>{paid.length > 0 ? "Before your paycheck lands" : "After this morning's payments"}</span>
            <span className={cn("tabular font-medium", day.morning < 0 && "text-short")}>
              {day.morning < 0 ? "−" : ""}
              {formatUSD(Math.abs(day.morning))}
            </span>
          </li>
        )}
        {paid.map((r, i) => (
          <li key={`p${i}`} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{r.text}</span>
            {money(r.amount)}
          </li>
        ))}
        {day.spend > 0 && (
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">Everyday spending</span>
            {money(-day.spend)}
          </li>
        )}
        <li className="flex justify-between gap-4 border-t pt-1 font-semibold">
          <span>End of day</span>
          <span className={cn("tabular", day.balance < 0 && "text-short")}>
            {day.balance < 0 ? "−" : ""}
            {formatUSD(Math.abs(day.balance))}
          </span>
        </li>
      </ul>
    </div>
  );
}
