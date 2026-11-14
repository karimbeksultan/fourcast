# Research (B6)

- `reviews.md`: what users of Klarna, Afterpay, Affirm and Zip complain about, from 2,000 recent US App Store reviews. It has a hand-checked count of the payment problems Fourcast solves, the themes that dominate, and three quotes.
- `benchmarks.md`: subscription benchmarks from RevenueCat and Adapty (2026 reports, 2025 data), plus finance install costs from Adjust. Each number has a link, and the file lists what the numbers change in our business case.
- `search-demand.md`: what people in the US type into Google about limit cuts, failed payments and refunds (Google autocomplete). It is evidence for the organic channel, with no search volumes.
- `count_reviews.py`: reruns the review counts (`python research/count_reviews.py`, no packages needed).

**How the reviews were collected (say this if asked):** Apple's public review feed, US store, the 500 most recent reviews per app, pulled 14 Nov 2026. Themes were counted by keyword. Payment-side reviews were then read one by one: 24 candidates, 16 kept, plus 3 found among the paycheck mentions. Google Play was not included. We did no interviews; these are public reviews, not a survey of our users.

The raw reviews are not committed, because they contain reviewers' names. The script downloads them again, and because the feed only shows the latest reviews, a rerun will differ slightly.

## BNPL pain research (15 Nov 2026)
- `bnpl-pain/REPORT.md`: full report in Russian: complaints, Fed/CFPB/Bankrate statistics, competitors, a scored problem matrix, risks, interview questions and a continue/pivot verdict.
- `bnpl-pain/complaints.csv`: 128 complaints (51 hand-coded App Store reviews, 77 CFPB complaints), each with a source link. Rebuild with `python research/bnpl-pain/build_db.py <cfpb_raw.json>`; the raw pulls are not committed.
