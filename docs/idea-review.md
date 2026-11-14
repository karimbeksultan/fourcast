# Fourcast — idea review (14.11, before the 17:00 start)

> **Simulated.** Every voice below is a role played by AI from our own BRIEF and public numbers. "Jasmine" is a persona, not a real interview. Use this to decide, not as evidence on a slide.

## Scores today vs. after the agreed changes
| Criterion (weight) | Today | After changes | What moves it |
|---|---|---|---|
| Does it work (40%) | 7 | 8 | Golden tests on `lib/plan.ts` prove the numbers aren't hardcoded; date and money rules remove off-by-one bugs |
| What do we sell (20%) | 4 | 6 | Free plans + timeline, Plus sells the *answer* (Payday Sync, best day, night-before check-ins), yearly price |
| Who do we sell to (15%) | 6 | 7 | Honest beachhead: multi-lender borrowers (17.6M), one persona, real App Store complaints |
| Why does it make money (15%) | 3 | 5 | Yearly plan, LTV table at 10/20/30% churn with a CAC ceiling; still no proof of payment |
| Is it new (10%) | 5 | 7 | Payday Sync: pick the buy day so every Pay-in-4 debit lands on a payday |
| **Weighted total** | **~55** | **~69** | |

Feasibility (CTO panel): **7/10** for the demo flow in ~19 hours, if scope stays as agreed below.

## The room
*CEO, CFO, Business Analyst (BA), Product Manager (PM), customer Jasmine (31, Columbus OH, paid biweekly, 4 plans), CTO, Senior SWE, Team Lead (TL).*

**CEO:** We score it 55 today. The math is real, but is this a business or a nice calculator?
**BA:** Our own CFPB numbers say the average borrower has about one open plan at a time. A free tier of three plans almost never hits the paywall.
**Jasmine:** And I have four, so I'd hit it on day one. That feels like a trap. I'm not paying $5 to see my own payments.
**PM:** What would you pay for?
**Jasmine:** For not eating the next $34 overdraft. If it says "Afterpay on the 30th, you'll be $9 short" and it's right, $4.99 beats one overdraft.
**CFO:** Then sell the answer, not the list. And a monthly plan on a six-week debt cycle churns hard: at 20% monthly churn LTV is ~$22, at 30% it's ~$15.
**BA:** Sell yearly up front. $29.99 is about one overdraft, and the cash lands on day one.
**Jasmine:** Yearly is fine if I can try it first, through a couple of paydays, and cancel on the site.
**CEO:** Agreed on money: all plans and the timeline free, Plus is the answer, $29.99/year with $4.99/month as the anchor, free through two paydays.
**PM:** Jasmine, why come back tomorrow?
**Jasmine:** Tomorrow I wouldn't. On payday I would. And the night before a payment, if my calendar pings me, I'll type my balance. One box I can do.
**CTO:** That also fixes our stale-balance problem. Every calendar event links to `/?due=YYYY-MM-DD`: "Tomorrow Afterpay takes $20. What's in checking?" One number, one verdict.
**BA:** Is anything here actually new? A tracker could copy a purchase check in a sprint.
**PM:** Pay in 4 charges every 14 days, the same rhythm as a biweekly paycheck. Start a plan on the right day and all four payments land on paydays. Nobody picks the buy day from your pay cycle.
**Jasmine:** "Buy Friday and all four payments land on paydays"? I'd screenshot that and send it to my sister.
**CEO:** That's the line for the pitch. Payday Sync is the signature feature.
**Senior SWE:** It's cheap: `checkPurchase` already scans every day for the best one. Return the whole 42 days and the frontend draws a fit strip.
**TL:** Then we cut to pay for it: `/plus` becomes a section on `/check`, "Explain in plain English" is out, OpenRouter is optional.
**CTO:** One thing I won't cut: 40% of the score is "not hardcoded" and they read the repo. One test file with the demo numbers as golden cases, plus timezone edge cases. One hour, right after the logic.
**TL:** Our TASKS say "no tests". I'll trade that rule for one file and one GitHub Action, not a suite.
**CFO:** And the market slide must stop using 63%. The pain is several *lenders*: 33%, about 17.6M people. Say that's the beachhead and name the expansion: any autopay that lands before payday.
**BA:** Plus one real signal of demand: complaint counts from App Store reviews, which are already in the plan.
**Jasmine:** Just make the screenshot part actually work.
**Senior SWE:** One 10-second budget: Gemma first, Gemini Flash fires at 4 s in parallel, first valid answer wins. "Enter manually" is visible from second one.
**CEO:** Then we have a deal.

## What everyone agreed
**Product promise (Jasmine's words):** "On payday, tell me what's really mine, and warn me the night before a payment would overdraft me."

**Pricing**
- **Free:** unlimited plans, the 6-week timeline, the yes/no verdict.
- **Plus:** Payday Sync and the best buy day, the exact short day and amount, night-before check-ins.
- **Price:** $29.99/year (default), $4.99/month shown as the anchor. Free through two paydays, cancel on the site. In the demo, a "Preview Plus" toggle shows the full answer.

**Retention:** payday (every 14 days) and the night before each debit (every 3–4 days with 4 plans), both through calendar links with a one-number check-in.

**Market:** beachhead = borrowers with plans at several lenders, 251M × 21.2% × 33% ≈ **17.6M** (CFPB). Expansion = any automatic payment that lands before payday (size to be found with a source, not invented).

## Build list
| Priority | Change | Owner | Hours |
|---|---|---|---|
| Must | **Payday Sync**: plan's position in the pay cycle; best start day so every debit lands on a payday; badge on plans, line on `/check` | B logic 1, A UI 1 | 2 |
| Must | **Fit strip on `/check`**: `checkPurchase` returns `fitsByDay` for 42 days, colored 6-week strip | B 0.5, A 1.5 | 2 |
| Must | **Golden tests**: `lib/plan.test.ts` with the demo numbers + 5 edge cases (same-day paycheck and debit, rent on the 31st, purchase past day 42, $100 / 3, timezones); one GitHub Action `test && build` | B | 1 |
| Must | **Pricing**: free plans, Plus at the answer, $29.99/year, "Preview Plus" toggle; `/plus` folds into `/check` | A 1, B 0.5 | 1.5 |
| Must | **Engineering rules**: dates as `YYYY-MM-DD` strings, integer cents, `today` from the browser only; sample rent at today+16; localStorage read after mount, reset on bad data | B | 0 (rules) |
| Must | **AI budget**: one 10 s budget, parallel Gemma → Gemini Flash at 4 s, client shrinks images to 1280 px JPEG, prompt includes today's date | B | 0.5 |
| Should | **Night-before check-in**: `.ics` events link to `/?due=…`, one-field balance screen | B 0.5, A 1 | 1.5 |
| Should | **Explained lowest point**: tap the low point to see the running balance and which plan pulls it down most | B 1, A 1.5 | 2.5 |
| Should | **Smoke check after deploy** + `GET /api/health` showing which providers are configured (true/false, never keys) | B | 0.5 |
| Could | Onboarding as a 5-question quiz (Zimran's own funnel style) | A | 2.5 |
| Could | Private share link: state compressed into the URL `#hash` (never reaches the server) + QR on a slide | B 1.5, A 0.5 | 2 |
| Could | Checkout screenshot on `/check` ("4 payments of $62.50" → verdict without typing) | B 1, A 1 | 2 |
| Later | Dodged-overdraft counter | — | — |

**Not doing:** AI chat, "Explain in plain English", separate `/plus` page, OpenRouter as a must.

## Slides that change
- **Problem:** 47% paid late (LendingTree 2026); a late Pay-in-4 debit costs little at the lender but an average **$26.77** overdraft at the bank.
- **Market:** 17.6M multi-lender beachhead (CFPB), expansion named, no 33M.
- **Money:** LTV table at 10/20/30% monthly churn ($45 / $22 / $15) vs. yearly $29.99 up front (~$27 after fees); max CAC per case; organic channel = the shareable Payday Sync screenshot.
- **Demo:** end on "Buy Friday: all 4 payments land on paydays."

## Risks still open
1. **No proof anyone pays.** Best we can do in time: App Store complaint counts (B6) and the yearly-price logic.
2. **Stale balance.** The check-ins reduce it; say plainly that there is no bank link by design (privacy, no setup).
3. **"Helping people take more debt."** Frame the product as protection: the default answer is "not now", and Payday Sync makes payments land when the money is there.
4. **Lenders could build it.** Our answer: no lender shows *other* lenders' plans.

## Update after the organizers' FAQ (14.11, ~18:30)
The organizers published answers to 150 questions. Four of them change the agreement above; BRIEF and TASKS already include the changes.
- **"Preview Plus" toggle → a working paywall.** A paywall with a clear price is the minimum, and a page with prices only is not enough (Q37, Q67). A Stripe test-mode checkout is a plus under "Does it work?" (Q55), so it becomes a Should. Without it, Plus unlocks through a clearly labelled demo checkout.
- **Night-before check-in: Should → Must.** At least one return mechanic has to work in the product (Q100). The FAQ also values renewal over daily use (Q30), which supports the yearly price.
- **Explained lowest point: Should → Could,** to make room for Stripe.
- **No demo video** (Q145). Pitch rehearsals move to after 15:00, because the top 10 are picked from the submission alone (Q77).
- **New Should:** a short survey of US BNPL users, posted early, because real user signals count (Q39, Q102). Retention and CAC benchmarks come from RevenueCat and Adapty (Q33).
