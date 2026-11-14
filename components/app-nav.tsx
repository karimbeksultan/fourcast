"use client";

import { CalendarDays, ListChecks, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Plans", icon: ListChecks },
  { href: "/timeline", label: "Forecast", icon: CalendarDays },
  { href: "/check", label: "Check a buy", icon: ShoppingBag },
];

// Zimran-style: a flat violet bar on top, a black tab bar on phones.
export function AppNav() {
  const path = usePathname();
  return (
    <>
      <header className="sticky top-0 z-20 bg-payday text-on-payday">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-on-payday/60"
          >
            fourcast
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={path === l.href ? "page" : undefined}
                className={cn(
                  "rounded-md px-4 py-2 text-base font-medium outline-none focus-visible:ring-3 focus-visible:ring-on-payday/60",
                  path === l.href ? "bg-foreground text-on-payday" : "text-on-payday/75 hover:text-on-payday",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 bg-foreground pb-[env(safe-area-inset-bottom)] text-on-payday sm:hidden"
      >
        <div className="grid grid-cols-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path === l.href ? "page" : undefined}
              className={cn(
                "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:bg-on-payday/10",
                path === l.href ? "text-on-payday" : "text-on-payday/55",
              )}
            >
              {path === l.href && <span className="absolute inset-x-6 top-0 h-1 bg-payday" aria-hidden />}
              <l.icon className="size-5" aria-hidden />
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
