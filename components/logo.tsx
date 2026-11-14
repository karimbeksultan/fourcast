// Fourcast mark: a "4" whose crossbar runs on as a horizon, with the morning sun rising past it.
// Four payments, one forecast: the morning before the money arrives. Colors come from the theme.
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden focusable="false">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M16 6.5 6.5 19h20M16 6.5v19"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 17.4a4 4 0 0 1 8 0z" className="fill-tight-soft" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[1.6rem] leading-none font-bold tracking-[-0.035em]">
        four<span className="text-primary">cast</span>
      </span>
    </span>
  );
}
