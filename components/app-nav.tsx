"use client";

// Site structure taken from zimran.io (sticky header, page links in the middle, one action on the right),
// with two kinds of tabs: what a buyer reads before paying, and the app itself.
import { CalendarDays, Menu, MoonStar, ShieldCheck, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

const focus = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function AppNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // /dispute belongs to Plans
  const active = (href: string) => path.startsWith(href) || (href === "/plans" && path.startsWith("/dispute"));
  const inApp = APP_TABS.some((t) => active(t.href));

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label="Fourcast home" className={cn("rounded-md", focus)} onClick={() => setOpen(false)}>
            <Logo />
          </Link>

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
            {/* One action: outside the app it opens Tonight; inside, adding a plan is the next most common job. */}
            <Link
              href={inApp ? "/plans" : "/tonight"}
              className={cn(
                "inline-flex h-11 items-center rounded-md bg-primary px-4 text-base font-semibold text-primary-foreground hover:bg-primary/90",
                focus,
              )}
            >
              {inApp ? "Add a plan" : "Open Tonight"}
            </Link>
            <button
              type="button"
              className={cn("flex size-11 items-center justify-center rounded-md md:hidden", focus)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="site-menu" aria-label="Site" className="border-t px-4 py-2 md:hidden">
            {SITE.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn("block rounded-md px-2 py-3 text-lg font-medium", focus)}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {inApp && (
          <nav aria-label="App" className="hidden border-t sm:block">
            <div className="mx-auto flex max-w-6xl gap-1 px-4">
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
        )}
      </header>

      {inApp && (
        <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
          <div className="grid grid-cols-4">
            {APP_TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active(t.href) ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:bg-muted",
                  active(t.href) ? "text-primary" : "text-muted-foreground",
                  "outline-none",
                )}
              >
                {active(t.href) && <span className="absolute inset-x-6 top-0 h-1 rounded-b bg-primary" aria-hidden />}
                <t.icon className="size-5" aria-hidden />
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
