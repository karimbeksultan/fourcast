# Research (B6)

- `reviews.md`: what users of Klarna, Afterpay, Affirm and Zip complain about, from 2,000 recent US App Store reviews. It has a hand-checked count of the payment problems Fourcast solves, the themes that dominate, and three quotes.
- `benchmarks.md`: subscription benchmarks from RevenueCat and Adapty (2026 reports, 2025 data), plus finance install costs from Adjust. Each number has a link, and the file lists what the numbers change in our business case.
- `count_reviews.py`: reruns the review counts (`python research/count_reviews.py`, no packages needed).

**How the reviews were collected (say this if asked):** Apple's public review feed, US store, the 500 most recent reviews per app, pulled 14 Nov 2026. Themes were counted by keyword. Payment-side reviews were then read one by one: 24 candidates, 16 kept, plus 3 found among the paycheck mentions. Google Play was not included. We did no interviews; these are public reviews, not a survey of our users.

The raw reviews are not committed, because they contain reviewers' names. The script downloads them again, and because the feed only shows the latest reviews, a rerun will differ slightly.
