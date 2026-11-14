# Fourcast — Limit Guard for Pay in 4

**Never lose your limit to a payment that's 5 hours late.**

Autopay for Klarna, Afterpay, Affirm and Zip runs in the morning; the paycheck lands in the afternoon. One payment that bounces for a few hours can cut a spending limit from $1,000 to $200. Each lender's app only sees its own plans. Fourcast puts all of them next to your paycheck, finds the payments that won't make it, and tells you the night before what to do: *"Move $25 into checking tonight, or pay it by hand after your paycheck lands."*

**Live:** https://fourcast-zimran.vercel.app — no sign-up, your data stays in your browser. Try **Try It With Sample Data**, then add the sample Klarna plan.

Built for Business Cup 2.0 (AIESEC NU × Zimran), track **Money**, for adults in the US aged 25–45.

## What it does
| Tab | What you get |
|---|---|
| **Guard** (`/plans`) | Which plan payments fail or leave almost nothing on the morning they're taken, and what to do the night before. Mark a plan **returned** and get a **dispute letter** for the lender, with the CFPB link. |
| **Forecast** (`/timeline`) | Your next 6 weeks as a calendar: paydays, rent, every plan payment, the lowest point. Download the dates to your calendar (`.ics`) with an 8 pm reminder the night before each payment. |
| **Before you buy** (`/check`) | Whether a new Pay in 4 fits, and **Payday Sync**: the day to buy so every payment lands the morning after a payday. |

**Free:** all plans, Guard, the forecast, "fits / not right now". **Plus** ($29.99 a year, free until your second payday): the night-before reminders with check-in, Payday Sync and the first day it fits, the exact shortfall, dispute letters. Payments run in **Stripe test mode** (card `4242 4242 4242 4242`); no real money moves.

## How it works
- **The math is plain code, not AI.** `lib/plan.ts` simulates 42 days from your balance, paychecks, rent, everyday spending and every plan. Guard uses a *morning model*: each payment is checked against yesterday's end-of-day balance minus that morning's debits, before the paycheck (`debitRisks`). Every demo number is a golden test in `lib/plan.test.ts`; the rules and expected numbers are in [`demo_inputs.md`](demo_inputs.md).
- **AI does two small jobs, always with a fallback.** It reads a pasted confirmation or a screenshot into a plan (`/api/read-plan`; without it you type four fields), and it can polish a dispute letter (`/api/dispute`; the template always works, and the AI draft is used only if it keeps every fact). Models: Gemini Flash-Lite via Google AI Studio; when one model's free quota runs out (429) the next takes over at once, and Gemma 4 31B is the slow last resort.
- **No accounts, no bank link.** State lives in `localStorage` with a versioned zod schema. The server stores nothing; keys stay on the server.

## Run it
```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 23 golden tests: the demo numbers, the morning model, edge cases
npm run build
```
Everything works without keys: reading screenshots falls back to manual entry, dispute letters use the template, and the paywall uses a demo checkout. To turn them on, copy `.env.example` to `.env` and add a free Google AI Studio key (`LLM_1_API_KEY`, `LLM_2_API_KEY`) and a Stripe **test** key (`STRIPE_SECRET_KEY=sk_test_…`; live keys are refused).

## Deploy
Vercel with its GitHub integration: every push to `main` is a production deploy. Keys live in Vercel → Settings → Environment Variables. After each deploy: `npm run smoke -- https://fourcast-zimran.vercel.app` (all pages, `/api/health`, and both APIs, with no AI call). Rollback: Vercel → Deployments → Instant Rollback.

## Evidence and decisions
- [`research/reviews.md`](research/reviews.md): 2,000 recent US App Store reviews of Klarna, Afterpay, Affirm and Zip; the payment-side complaints were read by hand.
- [`research/benchmarks.md`](research/benchmarks.md): RevenueCat, Adapty and Adjust 2026 numbers behind the price and the growth plan.
- [`LIMIT_GUARD.md`](LIMIT_GUARD.md): the current spec. [`BRIEF.md`](BRIEF.md) → "Решения": the decision log (in Russian).

## Key dependencies
Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, zod, Vitest. AI: Google AI Studio (Gemini Flash-Lite, Gemma 4 as the last resort), optional OpenRouter. Payments: Stripe test mode. Hosting: Vercel.

*Not financial advice.*
