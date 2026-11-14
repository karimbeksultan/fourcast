# What BNPL users complain about (US App Store)

**Sample:** the 500 most recent US App Store reviews of each of Klarna, Afterpay, Affirm and Zip, 2,000 reviews in total, pulled on 14 Nov 2026 from Apple's public review feed. 617 of them are rated 1–2 stars.
Date ranges: Klarna 11 Oct – 12 Nov 2026, Affirm 28 Oct – 12 Nov 2026, Zip 22 Sep – 13 Nov 2026, Afterpay 11 Dec 2025 – 12 Nov 2026. Afterpay has many more 1–2 star reviews in its last 500, so its window reaches back further.
How to rerun it: `python research/count_reviews.py`. Method and caveats are in `research/README.md`.

## 1. The problem Fourcast solves, verified by hand: 19 reviews
Keyword search found 24 low-rated candidates. We read each one and kept only the reviews that are about a payment debit itself. We also added 3 reviews from the paycheck list (section 3) that describe a debit landing before the paycheck.

| Complaint | Reviews | Apps |
|---|---|---|
| Autopay failed, switched itself off, charged twice or charged after it was turned off | 9 | Klarna 4, Afterpay 3, Affirm 2 |
| Late fee or a cut limit after one late payment | 5 | Klarna 3, Afterpay 1, Zip 1 |
| The debit lands before the paycheck, or before the due date | 4 | Afterpay 3, Klarna 1 |
| Bank overdraft fees blamed on the BNPL debit | 2 (1 also counted in the row above) | Afterpay 1, Klarna 1 |
| **Unique reviews** | **19 of 2,000 (~1%)**; 17 of them are rated 1–2 stars (17 of 617, ~3%) | |

Review IDs (Apple review IDs, for checking): autopay — Affirm 14723099809, 14738911915; Afterpay 14678482786, 13556974250, 14507609614; Klarna 14666045726, 14763137403, 14763009029, 14690389906. Late fee — Klarna 14669735037, 14689487551, 14654488824; Zip 14750486563; Afterpay 13639903215. Before the paycheck — Afterpay 14003423669, 14046219509, 13511268479; Klarna 14749273173. Overdraft — Afterpay 13837313419, Klarna 14749273173.

## 2. What dominates the 1–2 star reviews (keyword counts, not read one by one)
| Theme | Reviews out of 617 | Klarna | Afterpay | Affirm | Zip |
|---|---|---|---|---|---|
| Customer service | 144 | 14 | 117 | 5 | 8 |
| Declined purchase or cut spending limit | 93 | 18 | 61 | 7 | 7 |
| Account closed, frozen or fraud | 87 | 5 | 69 | 8 | 5 |
| App bugs or a bad update | 67 | 9 | 52 | 2 | 4 |
| Payment side (the 24 candidates behind section 1) | 24 | 10 | 9 | 3 | 2 |

A review can match more than one theme.

## 3. People already plan BNPL around their paycheck
**46 reviews** mention a paycheck, payday or a budget, and **36 of them are rated 4–5 stars**. Users describe BNPL as a way to get "between paydays" or to "stretch a paycheck". This is the cycle Payday Sync plans around.

## Three quotes for the slide
1. Afterpay, 3★, 27 Apr 2026 (review 14003423669): *"they try to take a payment off your card at 6 in the morning"*. The reviewer's paycheck lands at 3–4 pm the same day; they pay right away and Afterpay still lowers their limit.
2. Klarna, 2★, 7 Nov 2026 (review 14763137403): *"My automatic payments keep failing!"*
3. Afterpay, 1★, 11 Mar 2026 (review 13837313419): *"your payments will be applied incorrectly causing over draft fees"*

App Store pages: [Klarna](https://apps.apple.com/us/app/id1115120118) · [Afterpay](https://apps.apple.com/us/app/id1401019110) · [Affirm](https://apps.apple.com/us/app/id967040652) · [Zip](https://apps.apple.com/us/app/id1425045070). Feed used (one page of 50, pages 1–10): `https://itunes.apple.com/us/rss/customerreviews/page=1/id=<app id>/sortby=mostrecent/json`.

## What this means for the pitch (be honest on stage)
- **Reviews of lender apps are about the lender.** Most anger is about declines, limits and support. Few reviewers write about our problem, because each lender app shows only its own plans. Say ~1% (19 of 2,000), not "everyone complains about this".
- **Use the reviews for the story and the surveys for the size.** The size comes from surveys: 47% of BNPL users paid late in the last year (LendingTree 2026), and 63% hold several loans at once (CFPB). The reviews show what a late or failed debit feels like: limits cut over a few hours, late fees, overdraft fees.
- **The best quote for Payday Sync is quote 1:** the debit comes at 6 am and the paycheck at 3 pm.
