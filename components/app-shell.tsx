"use client";

// The frame around every page, in two modes.
// Site (/, /pricing, /faq): a sticky header with page links and one action.
// App (/tonight, /plans, /timeline, /check, /dispute): a workspace. From 1024 px a sidebar holds the four
// screens, the one action and the plan status; below that, a compact header with tabs (a bottom bar on phones).
// A bar on top says when the numbers are sample data, the way a payments dashboard marks its test mode.
import { CalendarDays, FlaskConical, Menu, MoonStar, Plus, ShieldCheck, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { saveAcks } from "@/lib/concept";
import { formatShort } from "@/lib/dates";
import { clearState } from "@/lib/storage";
import type { AppState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const SITE = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export const APP_TABS = [
  { href: "/tonight", label: "Tonight", icon: MoonStar },
  { href: "/plans", label: "Plans", icon: ShieldCheck },
  { href: "/timeline", label: "Forecast", icon: CalendarDays },
  { href: "/check", label: "Before you buy", icon: ShoppingBag },
];

/** What leaves the browser, said plainly: plans stay here, AI reading and letter drafts go to Google's Gemini. */
const FOOTNOTE =
  "Not financial advice. Your plans are saved only in this browser. Text or screenshots you ask Fourcast to read, and the notes for a dispute letter, are sent to Google's Gemini AI and are not stored by us.";

const focus = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const action =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold whitespace-nowrap text-primary-foreground hover:bg-primary/90 sm:px-4 sm:text-base";

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [state] = useAppState();
  const [open, setOpen] = useState(false);
  // /dispute belongs to Plans
  const active = (href: string) => path.startsWith(href) || (href === "/plans" && path.startsWith("/dispute"));
  const inApp = APP_TABS.some((t) => active(t.href));
  const sample = Boolean(state?.sample);

  const menu = open && (
    <nav id="site-menu" aria-label="Site" className={cn("border-t px-4 py-2", !inApp && "md:hidden")}>
      {SITE.map((l) => (
        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn("block rounded-md px-2 py-3 text-lg font-medium", focus)}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
  const menuButton = (
    <button
      type="button"
      className={cn("flex size-11 items-center justify-center rounded-md", !inApp && "md:hidden", focus)}
      aria-expanded={open}
      aria-controls="site-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={() => setOpen(!open)}
    >
      {open ? <X /> : <Menu />}
    </button>
  );
  const home = (
    <Link href="/" aria-label="Fourcast home" className={cn("rounded-md", focus)} onClick={() => setOpen(false)}>
      <Logo />
    </Link>
  );

  if (!inApp) {
    return (
      <>
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
            {home}
            <nav aria-label="Site" className="hidden items-center gap-1 md:flex">
              {SITE.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={path === l.href ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-base font-medium",
                    path === l.href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    focus,
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/tonight" className={cn(action, focus)}>
                Open Tonight
              </Link>
              {menuButton}
            </div>
          </div>
          {menu}
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-8 sm:pt-10 sm:pb-12">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-6 text-xs text-pretty text-muted-foreground">{FOOTNOTE}</footer>
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col" style={{ "--bar": sample ? "2.5rem" : "0rem" } as CSSProperties}>
      {sample && <SampleBar />}

      <div className="flex flex-1">
        <aside className="sticky top-[var(--bar)] hidden h-[calc(100dvh-var(--bar))] w-56 shrink-0 flex-col border-r bg-card lg:flex">
          <div className="flex h-16 items-center px-4">{home}</div>
          <nav aria-label="App" className="flex flex-col gap-0.5 px-2">
            {APP_TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active(t.href) ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 font-medium",
                  active(t.href) ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  focus,
                )}
              >
                <t.icon className={cn("size-4.5 shrink-0", active(t.href) && "text-primary")} aria-hidden />
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="px-2 pt-4">
            <Link href="/plans#add" className={cn(action, "h-10 w-full sm:text-sm", focus)}>
              <Plus className="size-4" aria-hidden />
              Add a plan
            </Link>
          </div>

          <div className="mt-auto space-y-3 border-t p-4 text-sm">
            <Membership state={state} />
            <nav aria-label="Help" className="flex flex-col gap-1.5">
              {SITE.slice(1).map((l) => (
                <Link key={l.href} href={l.href} className={cn("rounded-sm text-muted-foreground hover:text-foreground", focus)}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur lg:hidden">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
              {home}
              <div className="flex items-center gap-2">
                <Link href="/plans#add" className={cn(action, focus)}>
                  Add a plan
                </Link>
                {menuButton}
              </div>
            </div>
            {menu}
            <nav aria-label="App" className="hidden border-t sm:block">
              <div className="flex gap-1 px-4 sm:px-6">
                {APP_TABS.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={active(t.href) ? "page" : undefined}
                    className={cn(
                      "relative flex h-12 items-center gap-2 px-3 text-base font-medium",
                      active(t.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      focus,
                    )}
                  >
                    <t.icon className="size-4" aria-hidden />
                    {t.label}
                    {active(t.href) && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-primary" aria-hidden />}
                  </Link>
                ))}
              </div>
            </nav>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-12 lg:px-8">{children}</main>
          <footer className="mx-auto w-full max-w-6xl px-4 pb-24 text-xs text-pretty text-muted-foreground sm:px-6 sm:pb-6 lg:px-8">
            {FOOTNOTE}
          </footer>
        </div>
      </div>

      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-4">
          {APP_TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active(t.href) ? "page" : undefined}
              className={cn(
                "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:bg-muted",
                active(t.href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              {active(t.href) && <span className="absolute inset-x-6 top-0 h-1 rounded-b bg-primary" aria-hidden />}
              <t.icon className="size-5" aria-hidden />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Says, on every app screen, that these are example numbers, and offers the way out. */
function SampleBar() {
  return (
    <aside
      aria-label="Sample data"
      className="z-40 flex h-10 shrink-0 items-center justify-between gap-3 bg-foreground px-4 text-sm text-background sm:px-6 lg:sticky lg:top-0"
    >
      <p className="flex min-w-0 items-center gap-2">
        <FlaskConical className="size-4 shrink-0" aria-hidden />
        <span className="font-semibold whitespace-nowrap">Sample data</span>
        <span className="hidden truncate text-background/80 sm:inline">Example numbers, counted live from today.</span>
      </p>
      <button
        type="button"
        onClick={() => {
          clearState();
          saveAcks({});
        }}
        className="rounded-sm font-semibold whitespace-nowrap underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-background/60"
      >
        Clear sample data
      </button>
    </aside>
  );
}

function Membership({ state }: { state: AppState | null | undefined }) {
  if (!state) return null;
  return state.plus ? (
    <p>
      <span className="font-semibold">Plus is on</span>
      <span className="text-muted-foreground"> until {formatShort(state.plus.trialEnds)}</span>
    </p>
  ) : (
    <p className="flex items-center justify-between gap-2">
      <span className="font-semibold">Free plan</span>
      <Link href="/pricing" className={cn("rounded-sm font-semibold text-primary underline-offset-4 hover:underline", focus)}>
        See Plus
      </Link>
    </p>
  );
}
