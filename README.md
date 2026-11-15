# Fourcast — know tonight if tomorrow's payment will clear

**Never lose your limit to a payment that's 5 hours late.**

Autopay for Klarna, Afterpay, Affirm and Zip runs in the morning; the paycheck lands in the afternoon. One payment that bounces for a few hours can cut a spending limit from $1,000 to $200. Each lender's app only sees its own plans. Fourcast puts all of them next to your paycheck, finds the payments that won't make it, and tells you the night before what to do: *"Move $25 into checking tonight, or pay it by hand after your paycheck lands."*

**Live:** https://fourcast-zimran.vercel.app — no sign-up, and your plans are saved only in your browser. Press **Try it with sample data**: it opens **Tonight**: Klarna's $80 autopay won't clear, $12.50 short that morning (opened on Nov 15, that's Thu, Dec 3), so move $25 into checking the evening before. Zip on payday morning is next.

Built for Business Cup 2.0 (AIESEC NU × Zimran), track **Money**, for adults in the US aged 25–45.

## What it does
| Screen | What you get |
|---|---|
| **Tonight** (`/tonight`) | One sentence about the next payment that won't clear and the one thing to do the evening before; three weeks of *morning* balances (after autopay, before the paycheck); a **returns tracker** (sent back → store refunded → lender credited) with a **dispute letter** when it stalls; what you owe per lender. |
| **Plans** (`/plans`) | Your plans and your money, the inputs. Add a plan by pasting text, a screenshot or four fields. Each plan shows **"2 of 4 paid"** and its payment history; **Payments** lists what's coming up and what's already paid across lenders. |
| **Forecast** (`/timeline`) | Your next 6 weeks as a calendar: paydays, rent, every plan payment, the lowest point. Download the dates to your calendar (`.ics`) with an 8 pm reminder the night before each payment. |
| **Before you buy** (`/check`) | Whether a new Pay in 4 fits, which payment it would make fail, and **Payday Sync**: the day to buy so every payment lands the morning after a payday. |

The app screens share one frame (`components/app-shell.tsx`): a sidebar with the four screens on desktop, tabs on tablets, a bottom bar on phones, and a bar on top whenever you're looking at **sample data**.

**Free:** Tonight, all plans, returns and dispute letters, the forecast, "fits / not right now". **Plus** ($29.99 a year or $4.99 a month, free until your second payday): the night-before reminders with check-in, Payday Sync and the first day it fits, the exact shortfall. Payments run in **Stripe test mode** (card `4242 4242 4242 4242`); no real money moves.

## How it works
- **The math is plain code, not AI.** `lib/plan.ts` simulates 42 days from your balance, paychecks, rent, everyday spending and every plan. Every screen uses one *morning model*: each payment is checked against yesterday's end-of-day balance minus that morning's debits, before the paycheck (`debitRisks`, `dayLow`), so Tonight, Plans, Forecast and Before you buy give the same answer. The evening check-in (`applyCheckIn`) takes what's in checking now and never counts today's debits twice. Payment history (`planHistory`) is inferred from each plan, because there is no bank link. Every demo number is a golden test in `lib/plan.test.ts`; the rules and expected numbers are in [`demo_inputs.md`](demo_inputs.md).
- **AI does two small jobs, always with a fallback.** It reads a pasted confirmation or a screenshot into a plan (`/api/read-plan`; without it you type four fields), and it can polish a dispute letter (`/api/dispute`; the template always works, and the AI draft is used only if it keeps every fact). Models: Gemini Flash-Lite via Google AI Studio; when one model's free quota runs out (429) the next takes over at once, and Gemma 4 31B is the slow last resort.
- **No accounts, no bank link.** State lives in `localStorage` with a versioned zod schema. The server stores nothing; keys stay on the server. Two things leave the browser, only when you ask: the text or screenshot you want read into a plan, and your notes for a dispute letter, go to Google's Gemini models. The footer and the FAQ say so.

## Run it
```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 39 golden tests: the demo numbers, the morning model, check-in, payment history, edge cases
npm run build
```
Everything works without keys: reading screenshots falls back to manual entry, dispute letters use the template, and the paywall uses a demo checkout. To turn them on, copy `.env.example` to `.env` and add a free Google AI Studio key (`LLM_1_API_KEY`, `LLM_2_API_KEY`) and a Stripe **test** key (`STRIPE_SECRET_KEY=sk_test_…`; live keys are refused).

## Deploy
Vercel with its GitHub integration: every push to `main` is a production deploy. Keys live in Vercel → Settings → Environment Variables. After each deploy: `npm run smoke -- https://fourcast-zimran.vercel.app` (all pages, `/api/health`, and both APIs, with no AI call). Rollback: Vercel → Deployments → Instant Rollback.

## Evidence and decisions
- [`research/bnpl-pain/REPORT.md`](research/bnpl-pain/REPORT.md) (in Russian) and [`complaints.csv`](research/bnpl-pain/complaints.csv): 128 sourced complaints and the Federal Reserve numbers (26% of pay-later users paid late, 11% had a payment set off an overdraft or NSF fee).
- [`research/reviews.md`](research/reviews.md): 2,000 recent US App Store reviews of Klarna, Afterpay, Affirm and Zip; the payment-side complaints were read by hand.
- [`research/search-demand.md`](research/search-demand.md): people already search "why did klarna lower my limit" and "klarna payment failed but money in bank" (Google US autocomplete), the organic channel.
- [`research/benchmarks.md`](research/benchmarks.md): RevenueCat, Adapty and Adjust 2026 numbers behind the price and the growth plan.
- [`CONCEPT.md`](CONCEPT.md): why Tonight is the home screen. [`LIMIT_GUARD.md`](LIMIT_GUARD.md): the morning-model spec. [`docs/case-compliance.md`](docs/case-compliance.md): the product checked against the case and the organizers' FAQ. [`BRIEF.md`](BRIEF.md) → "Решения": the decision log (in Russian).

## Key dependencies
Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, zod, Vitest. AI: Google AI Studio (Gemini Flash-Lite, Gemma 4 as the last resort), optional OpenRouter. Payments: Stripe test mode. Hosting: Vercel.

*Not financial advice.*
