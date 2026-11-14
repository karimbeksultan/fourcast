# Search demand: people type our problem into Google

**Why this file:** paid installs don't pay back for us (a finance app install costs $4.13 in North America, see `benchmarks.md`), so growth has to come from search at the moment of pain. This checks whether people actually search for that pain.

**Method:** Google autocomplete for the US (`hl=en`, `gl=us`), pulled on 14 Nov 2026 from Google's public suggest endpoint for 12 seed phrases. Google only suggests queries that people actually type. **Caveat:** autocomplete proves the phrases are searched, not how often. Volumes need Google Keyword Planner (an Ads account), which we didn't have during the hackathon.

## What people search, by Fourcast feature
| Fourcast feature | Suggested queries (verbatim, US) |
|---|---|
| **Guard: a limit cut after a late or failed payment** | "why did klarna lower my limit" · "klarna keeps lowering my limit" · "klarna purchase power went down after payment" · "my klarna purchase power went down for no reason" · "afterpay lowered my limit reddit" · "why has afterpay lowered my limit" · "afterpay spending limit went down" · "cash app afterpay limit went down" · "affirm lowered my limit" · "why did my affirm limit decrease" · "zip pay in 4 reduction to spend limit" |
| **Guard: the payment that didn't go through** | "klarna payment failed but money in bank" · "klarna payment failed but money deducted" · "afterpay keeps saying payment failed" · "what happens if an afterpay payment fails" · "afterpay failed payment fee" · "afterpay late payment grace period" · "klarna late payment grace period reddit" · "klarna late payment credit score" |
| **Returns and the dispute letter** | "afterpay refund not showing up" · "afterpay refund to cancelled card" · "klarna refund not received" · "klarna refund issued but not received" · "klarna refund not full amount" |

## What it means for growth
- **Every row is a landing page we can write.** "Why did Klarna lower my limit?" can answer the question honestly (lenders don't publish their rules; a payment that bounced for a few hours is a common trigger) and then link to Guard: *"See which of your payments won't make it, before the morning they're taken."*
- **"…reddit" keeps showing up** ("afterpay lowered my limit reddit", "klarna late payment grace period reddit"). People look for other borrowers' stories, so community answers are a second organic channel, posted by the community's rules.
- **For the slide:** quote 2–3 phrases verbatim next to the $4.13 install cost. The point is that the demand already exists in search, so we don't have to buy it.
