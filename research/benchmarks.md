# Subscription benchmarks for Fourcast Plus ($29.99/year)

The organizers suggested RevenueCat and Adapty for these numbers (FAQ Q33). Neither report breaks out Finance as its own category: RevenueCat puts Finance inside **Utilities**, and Adapty's eight categories include Utilities but not Finance. All numbers below are medians unless noted. Every number was checked on the linked page on 14 Nov 2026.

## Conversion
| Metric | Value | Source |
|---|---|---|
| Trial → paid, trial 17–32 days | 42.5% (top quartile above 59.4%) | [RevenueCat, State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps-2026/) (115,000+ apps, 2025 data) |
| Trial → paid, trial 10–16 days | 35.4% | same |
| Trial → paid, trial 5–9 days | 37.4% | same |
| Trial → paid, trial ≤ 4 days | 25.5% | same |
| Download → paid by day 35, all apps | 2.0% | same |
| Download → paid by day 35, freemium / hard paywall | 2.1% / 10.7% | same; [RevenueCat blog, 2026 benchmarks](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026) |
| Download → trial by day 30, Utilities (includes Finance) | 6.5% | [RevenueCat 2026, Utilities](https://www.revenuecat.com/state-of-subscription-apps-2026-utilities/) |
| Trial → paid, all apps (Adapty's default view) | 27.8% | [Adapty, State of In-App Subscriptions 2026](https://adapty.io/state-of-in-app-subscriptions-report/) (16,000+ apps, 2025 data) |
| Install → trial, North America | 14.5% | same |

## Renewal and retention of yearly plans
| Metric | Value | Source |
|---|---|---|
| Yearly subscribers still subscribed after 1 year | freemium 28%, hard paywall 27% | [RevenueCat blog, 2026 benchmarks](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026) |
| Yearly subscribers who cancel in year 1 | ~72% in 2026 (~56% in 2025); 35% of those cancellations happen in month 1 | same |
| 1-year retention on yearly plans, Utilities | 22.1% | [Adapty 2026](https://adapty.io/state-of-in-app-subscriptions-report/) |
| Refunds | 8.3% of revenue (default view) | same |

## Price
| Metric | Value | Source |
|---|---|---|
| Median yearly price, all apps | $34.80 | [RevenueCat 2026, Utilities page](https://www.revenuecat.com/state-of-subscription-apps-2026-utilities/) |
| Median yearly plan vs monthly plan | about 3× the monthly price | [Adapty 2026](https://adapty.io/state-of-in-app-subscriptions-report/) |

## Acquisition cost (not in RevenueCat or Adapty)
| Metric | Value | Source |
|---|---|---|
| Finance app cost per install, North America, 2025 | $4.13 (from $7.03 in 2024) | Adjust, Mobile App Trends 2026, via [PPC Land, 22 Feb 2026](https://ppc.land/adjusts-2026-mobile-app-report-finance-sessions-up-21-gaming-cpi-jumps-30/) |
| Finance app cost per install, global, 2025 | $1.13 (from $1.51) | same |
| Finance app retention, day 1 / 7 / 30 | 12% / 6% / 2% | same |

## What this changes in BRIEF → "Business"
1. **Renewal 40% is too optimistic.** The benchmark is 27–28% after one year (RevenueCat), or 22.1% for Utilities (Adapty). Use **28%**. Yearly LTV ≈ $26 net (after Stripe fees and 8.3% refunds) × 1 / (1 − 0.28) ≈ **$36**. The old figure was $45.
2. **$29.99 a year sits just below the $34.80 median yearly price.** The price is defensible: it is about one overdraft ($26.77), and below what a typical app charges.
3. **The trial ends at the second payday, 14–28 days in.** The benchmark for a 10–32 day trial is **35–42% trial → paid**, so use ~35%.
4. **Paid installs do not pay back.** At $4.13 per install and 2.1% freemium download → paid, a paying user costs about **$200**, far above our ~$26 CAC ceiling. Even a hard paywall (10.7%) gives ~$39. So the plan has to be organic: search at the moment of pain ("Klarna late fee", "afford another Afterpay") and the shareable Payday Sync screenshot. Say this on stage before the jury asks.
5. **"5% of 17.6M pay" is a different denominator.** Benchmarks measure payers per download (2.0–2.1%), not per person in the market. Keep 5% labeled as an assumption, and state that it needs about 2.4× the median download → paid rate applied to the whole beachhead.

## Three numbers for the slide
- **42.5%**: median trial → paid for 17–32 day trials (RevenueCat 2026). Our trial runs to the second payday.
- **28%**: yearly subscribers still paying after one year (RevenueCat 2026), so LTV ≈ $36 on $29.99 ($26 net).
- **$4.13**: what a finance app install costs in North America (Adjust 2026), which is why we grow through search and shared screenshots, not ads.
