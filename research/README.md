# Research (B6)

- `reviews.md`: what users of Klarna, Afterpay, Affirm and Zip complain about, from 2,000 recent US App Store reviews. It has a hand-checked count of the payment problems Fourcast solves, the themes that dominate, and three quotes.
- `benchmarks.md`: subscription benchmarks from RevenueCat and Adapty (2026 reports, 2025 data), plus finance install costs from Adjust. Each number has a link, and the file lists what the numbers change in our business case.
- `search-demand.md`: what people in the US type into Google about limit cuts, failed payments and refunds (Google autocomplete). It is evidence for the organic channel, with no search volumes.
- `count_reviews.py`: reruns the review counts (`python research/count_reviews.py`, no packages needed).

**How the reviews were collected (say this if asked):** Apple's public review feed, US store, the 500 most recent reviews per app, pulled 14 Nov 2026. Themes were counted by keyword. Payment-side reviews were then read one by one: 24 candidates, 16 kept, plus 3 found among the paycheck mentions. Google Play was not included. We did no interviews; these are public reviews, not a survey of our users.

The raw reviews are not committed, because they contain reviewers' names. The script downloads them again, and because the feed only shows the latest reviews, a rerun will differ slightly.

## Numbers on the slides
Every number in `pitch/Fourcast-pitch-deck.pdf`, with where it comes from. Checked against the source pages on 15 Nov 2026. **verified**: the source says it. **assumption**: our own estimate or arithmetic, shown so anyone can redo it. Quotation marks mark exact wording from government sources and reviews; for commercial reports the wording is paraphrased and the number is exact.

| Slide | Number on the slide | Source | What the source says | Status |
|---|---|---|---|---|
| 2 | 26% of US pay-later users paid late in the past year | [Federal Reserve, SHED 2025, Credit](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-credit.htm) | "Slightly more than one-fourth of BNPL users were late making a payment"; the BNPL table gives 26 percent overall | verified |
| 2 | 31% of users aged 30–44 paid late | [same page](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-credit.htm), table "Buy Now, Pay Later (BNPL) use (by demographic characteristics)" | Paid late, among users: 18–29 32%, 30–44 31%, 45–59 22%, 60+ 12% | verified |
| 2 | 11% had a pay-later payment set off an overdraft or NSF fee | [same page](https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-credit.htm) | "Eleven percent of adults who used BNPL had a payment trigger an overdraft or non-sufficient funds (NSF) fee." | verified |
| 2 | "at 6 in the morning"; paycheck at 3–4 pm | Afterpay, US App Store, 3★, 27 Apr 2026, review 14003423669 (`reviews.md`, quote 1) | Reviewer's own words; one review | verified, one person |
| 2 | "Missed a $7 payment by 5 hours… spending power went from 1000 to 200" | Afterpay, US App Store, 1★, 16 May 2026, review 14070646713 | The slide shortens it: the review says "a 7 dollar payment" and "To 200 dollars" | verified, one person; shortened |
| 3 | A third of pay-later borrowers hold loans at several lenders (33%) | [CFPB, 13 Jan 2025](https://www.consumerfinance.gov/about-us/newsroom/cfpb-research-reveals-heavy-buy-now-pay-later-use-among-borrowers-with-high-credit-balances-and-multiple-pay-in-four-loans), 2022 data | "33 percent took out loans from multiple BNPL lenders" | verified |
| 3 | Competitor table ("We didn't find it") | Public product pages and reviews, Nov 2026 | Our own look, not exhaustive | our check |
| 5 | 50 golden tests | `lib/plan.test.ts` | 50 tests on 15 Nov (`npm test`) | verified |
| 6 | 447 of Klarna's 3,261 complaints | [CFPB complaint database API](https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?company=Klarna%20AB&size=0&no_aggs=false), queried 15 Nov 2026 | Total 3,261; 447 under the issue "Problem with a purchase shown on your statement" (second after "Problem when making payments", 495) | verified; "unresolved purchase disputes" is our wording for that issue |
| 7 | About 6 loans a year per lender | [CFPB Data Spotlight, Dec 2025](https://files.consumerfinance.gov/f/documents/cfpb_bnpl-market-report_2025-12.pdf), 2023 data | 6.3 loans per user per lender (as recorded in `bnpl-pain/REPORT.md`) | read by the team on 15 Nov; not re-checked in this pass (PDF) |
| 7, 8 | $29.99 a year, $4.99 a month | `lib/stripe.ts`, live Stripe test checkout | Our price | our choice |
| 8 | About $26 after fees and refunds | Stripe 2.9% + $0.30; refunds 8.3% of revenue (Adapty 2026, `benchmarks.md`) | $29.99 − $1.17 − 8.3% × $29.99 ≈ $26.33 | **assumption** (derived) |
| 8 | Trial to paid 35–42% for trials of 10–32 days | [RevenueCat, State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps-2026/) | Medians: 17–32 days 42.5%; 10–16 days 35.4% (in the report's funnel takeaways; the blog post does not have it). All app categories, not finance | verified on the report page; safer wording: "25.5–42.5% by trial length" |
| 8 | 28% of yearly plans still paying after a year | [RevenueCat blog, 2026 benchmarks](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026) | Freemium apps retain 28% of yearly subscribers after one year, hard-paywall apps 27% | verified |
| 8 | LTV about $36 | Derived | $26 × 1 / (1 − 0.28) ≈ $36.10: assumes the same 28% renewal every year | **assumption** (derived) |
| 8 | CAC ceiling $26 | Derived | First-year net revenue of a yearly plan | **assumption** (derived) |
| 8 | $4.13 an install | Adjust, Mobile App Trends 2026, via [PPC Land, 22 Feb 2026](https://ppc.land/adjusts-2026-mobile-app-report-finance-sessions-up-21-gaming-cpi-jumps-30/) | Finance cost per install in North America fell from $7.03 to $4.13 in 2025. Mobile installs, not web visits | verified (secondary source) |
| 8 | 2.1% to paid | [RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps-2026/) | Day-35 download-to-paid, freemium median 2.1% (hard paywall 10.7%). The blog's text calls the same figure "trial-to-paid"; the report and the chart say download-to-paid | verified; we use download-to-paid |
| 8 | ≈ $200 a payer from ads | Derived | $4.13 ÷ 2.1% ≈ $197 | derived from two verified numbers |
| 8 | Search: what a visit may cost | Derived | CAC ≤ $26 at 2.1% visitor-to-paid means at most **$0.55 a visit**. Whether a web visitor converts like an app download is not measured | **assumption** |
| 8 | Search phrases | `search-demand.md`, Google US autocomplete, Nov 2026 | Phrases exist; volumes are not measured | verified, no volumes |
| 8 | 17.6M Americans hold plans at several lenders | CFPB: [credit records, June 2025](https://files.consumerfinance.gov/f/documents/cfpb_update-credit-invisibles-estimate_2025-06.pdf) and [BNPL, Jan 2025](https://www.consumerfinance.gov/about-us/newsroom/cfpb-research-reveals-heavy-buy-now-pay-later-use-among-borrowers-with-high-credit-balances-and-multiple-pay-in-four-loans) | ≈ 251M adults with a credit record (Dec 2020) × 21.2% used BNPL (2022) × 33% at several lenders (2022) = 17.6M. Mixed years; all ages, not 25–45 | **assumption** (our estimate; inputs verified) |
| 8 | 2% → about 350,000 payers, about $15M ARR | Derived | 17.6M × 2% = 352,000; × $42 ≈ $14.8M. The 2% benchmark is payers per download, here applied to everyone in the market | **assumption** |
| 8 | About $42 a year per payer | Derived | 60% yearly at $29.99 + 40% monthly at $4.99 × 12, no churn, before fees. Not the same basis as the $26 net used for LTV | **assumption**; optimistic |
| 8 | $100M ARR needs 2.4M payers | Derived | $100M ÷ $42 ≈ 2.38M, about 14% of the 17.6M | **assumption** (the ambitious case, labelled so on the slide) |
| 9 | 128 sourced complaints: 51 App Store reviews, 77 CFPB | `bnpl-pain/complaints.csv` | 128 rows: 77 CFPB Consumer Complaint Database, 51 Apple App Store (US) | verified |
| 9 | One overdraft costs $26.77 on average | [Bankrate, 2025 checking account and ATM fee study](https://www.bankrate.com/banking/checking/checking-account-survey/) | Average overdraft fee $26.77, down from $27.08; average NSF fee $16.82 | verified. Slightly less than a year of Plus ($29.99), not more |
| 9 | Cushion raised over $20M and closed in 2024 | [Banking Dive, 5 Feb 2025](https://www.bankingdive.com/news/cushion-shutters-after-8-years-fintech-bnpl-loan-aggregator/739258) | Raised more than $21M; wound down at the end of 2024; the founder said it did not reach the scale needed | verified |

**What this changes on the slides** (for the deck owner):
- Slide 8: cite the report, not the blog, for 35–42%, or say "25.5–42.5% by trial length". Say that $42 a payer is before fees and churn, while LTV uses $26 net, so LTV is about $36, not $37. Say that 2% is a download-to-paid benchmark applied to the whole market.
- Slide 9: an overdraft ($26.77) costs slightly less than a year of Plus ($29.99); "about a year of Plus" is right, "more than" would not be.

## BNPL pain research (15 Nov 2026)
- `bnpl-pain/REPORT.md`: full report in Russian: complaints, Fed/CFPB/Bankrate statistics, competitors, a scored problem matrix, risks, interview questions and a continue/pivot verdict.
- `bnpl-pain/complaints.csv`: 128 complaints (51 hand-coded App Store reviews, 77 CFPB complaints), each with a source link. Rebuild with `python research/bnpl-pain/build_db.py <cfpb_raw.json>`; the raw pulls are not committed.
