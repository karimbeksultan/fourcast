import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FAQ — Fourcast" };

const QA: [string, string][] = [
  [
    "Which services does Fourcast work with?",
    "Klarna, Afterpay, Affirm, Zip and PayPal Pay in 4. Any other plan works too if you type it in: the amount of each payment, how many are left and the next date.",
  ],
  [
    "Do I need to connect my bank?",
    "No. You type what's in checking, your paycheck and your rent once. No bank link, no email, no account. A check-in the night before a payment keeps the balance fresh.",
  ],
  [
    "Where is my data stored?",
    "Only in this browser. Nothing is saved on our server. Clear it any time with Start over on My plans.",
  ],
  [
    "How does reading a screenshot work?",
    "The screenshot or pasted text is sent once to Google's Gemini model, which pulls out the service, store, payment amount, payments left and next date. We don't keep the image. You check the result before adding the plan, and you can always type it in instead.",
  ],
  [
    "How is the forecast calculated?",
    "Day by day for the next 6 weeks: paychecks in, then rent, every plan payment and your everyday spending out. It's plain code, not AI, and the same numbers come out every time.",
  ],
  [
    "What is Payday Sync?",
    "Pay in 4 takes a payment every 2 weeks. If you're paid every week or every 2 weeks, buying on the right payday makes all 4 payments land on paydays. Fourcast finds that day for you.",
  ],
  [
    "How do reminders work?",
    "With Plus you download a calendar file. Each payment gets a reminder at 8 pm the evening before, with a link that asks one thing: what's in checking? Then you see if tomorrow is covered.",
  ],
  [
    "What does Plus cost, and can I cancel?",
    "$29.99 a year or $4.99 a month, free until your second payday. Cancel any time on Check a buy. In this demo no real payment is taken.",
  ],
  ["Is this financial advice?", "No. Fourcast counts your own numbers and shows the result. The decision is yours."],
];

export default function FaqPage() {
  return (
    <>
      <header className="max-w-3xl space-y-3">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">FAQ</h1>
        <p className="text-xl text-muted-foreground">What people ask before they add their first plan.</p>
      </header>

      <div className="max-w-3xl divide-y rounded-lg border bg-card">
        {QA.map(([q, a]) => (
          <details key={q} className="group px-5 py-1 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              {q}
              <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-5 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>

      <p className="text-lg">
        Still unsure?{" "}
        <Link href="/plans" className="font-semibold text-primary underline underline-offset-4">
          Try it with sample data
        </Link>
        . It takes a minute and nothing leaves your browser.
      </p>
    </>
  );
}
