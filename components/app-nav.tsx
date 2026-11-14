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

export function AppNav() {
  const path = usePathname();
  return (
    <>
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Fourcast
          </Link>
          <nav aria-label="Main" className="hidden gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={path === l.href ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  path === l.href ? "bg-payday-soft text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path === l.href ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium outline-none focus-visible:bg-muted",
                path === l.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              <l.icon className="size-5" aria-hidden />
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
