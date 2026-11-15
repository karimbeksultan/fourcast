# Demo inputs and expected numbers

Every number here comes out of `lib/plan.ts` and is checked by `lib/plan.test.ts` (`npm test`).
Dates are relative to the day the page is opened; the table shows them for **Sun, Nov 15, 2026**.

## Calculation rules
- Window: 42 days starting today. Balances are end of day.
- On one day the paycheck lands first, then rent, then plan payments, then the new purchase.
- Everyday spending is spread evenly: exactly the weekly amount every 7 days, starting today.
- Status: **short** if the lowest point is below $0, **tight** if below $100, otherwise **ok**. **Concept branch:** each day counts at its lowest, the morning (after autopay, before the paycheck) or the end of the day, so Forecast and Guard give the same answer.
- **Guard (morning model):** lenders debit in the morning, the paycheck lands in the afternoon. A plan payment's *morning* = yesterday's end-of-day balance minus that day's rent and plan payments, in order, before the paycheck and spending. **fails** if the morning goes below $0 (short by that much), **tight** if it clears with less than $50 left. End-of-day numbers do not change.
- Twice-a-month pay: a payday on the 15th or the 28th–31st means the 15th and the last day of each month; on the 1st, the 1st and the 15th; otherwise two days 15 apart (a day past the end of a short month moves to its last day).
- Pay in 4: the first payment on the day of purchase, then every 14 days; leftover cents go to the first payment.
- A purchase "fits" on a day if, bought that day, the balance never goes below $0 from then until after its last payment (even past day 42), **and** no plan payment fails that morning because of it (or fails deeper than it already would). Its own payments count in the morning of the day they land.
- **Already short:** without the purchase, the first day in the 42 when a plan payment fails that morning or the day ends below $0. Then no price fits until that is fixed on Guard.
- **Payday Sync** (weekly or every-two-weeks pay only): the first day **after** a payday on which the purchase fits. Every payment then lands the morning after a payday.

## Sample data ("Use sample data")
| Field | Value | Date on Nov 15 |
|---|---|---|
| Balance | $922.50 | |
| Paycheck | $1,450.00 every 2 weeks, next in 5 days | Fri, Nov 20 |
| Rent | $1,200.00 on the day of month 16 days from today | Dec 1 |
| Everyday spending | $280.00 a week ($40 a day) | |
| Afterpay · Nike | 1 payment of $50.00 left, in 2 days | Tue, Nov 17 |
| Affirm · Best Buy | 2 payments of $175.00 left, in 7 days | Sun, Nov 22 |
| Zip · Walmart | 1 payment of $40.00 left, in 19 days (a payday) | Fri, Dec 4 |

## Step 2: add Klarna (AI reads `getSampleKlarnaText(today)`)
Expected plan: **Klarna · Target**, 3 payments of $80.00 left, next in 4 days (Thu, Nov 19).
If AI is off, the same plan is entered by hand in four fields.

## Expected results
| Input | Expected |
|---|---|
| Sample data only (3 plans) | ok · lowest $147.50 on the morning of Fri, Dec 4 · **Guard: your limits are safe** (Zip leaves $147.50 that morning) |
| Timeline after adding Klarna | **short · $12.50 short on the morning of Fri, Dec 4** (end of day Dec 3 is $27.50) · $680 owed · 7 payments in 6 weeks · biggest pull: Affirm |
| **Guard after adding Klarna** | **1 payment at risk: Zip · Walmart $40.00, Fri Dec 4, morning — $12.50 short, paycheck lands later that day** (end of day Dec 3 is $27.50; the Klarna plan put the Zip payment at risk) |
| Paydays in the window | Nov 20, Dec 4, Dec 18 |
| Check $240 in 4, today | **Not right now** · $92.50 short on Thu, Dec 3 · morning risk: **Klarna · Target on Thu, Dec 3 would be $52.50 short that morning** |
| Already short without the buy | **Fri, Dec 4, morning, $12.50** (the Zip payment, same as Guard) |
| Best day | **Sat, Dec 5** (not Fri, Dec 4: buying then makes Zip's failing payment that morning deeper) |
| Payday Sync | **Buy Sat, Dec 5: every payment lands the morning after payday** (Dec 5, Dec 19, Jan 2, Jan 16) |
| Calendar file | 7 payment events with a reminder at 8 pm the evening before + 3 payday events; links `/?due=YYYY-MM-DD` |

## Tonight sample (the landing's "Try it with sample data" opens `/tonight`)
`getConceptSample(today)` in `lib/concept.ts`: the sample above **plus** the Klarna plan **plus** a returned Nordstrom order on Afterpay (1 payment of $40.00 still scheduled, Sun Dec 6, after the Dec 4 payday; store refunded, lender not yet), limits Klarna $750, Zip $600. It gives the same headline as the step-2 story above:

| Input | Expected |
|---|---|
| Tonight | **Zip won't clear on Fri, Dec 4**: $40.00 that morning, **$12.50 short**, hours before the paycheck lands · at stake the $600 Zip limit · **Move $25.00** on the evening of Thu, Dec 3 · nothing else at risk |
| Morning strip, Fri Dec 4 | morning after autopay −$12.50 · paycheck +$1,450.00 · end of day $1,397.50 |
| Forecast | short · lowest $12.50 short on the morning of Fri, Dec 4 · $720.00 left to pay, 8 payments in 6 weeks |
| Money in returns | $40.00 still scheduled on returned orders (Nordstrom with Afterpay) |
| Check $240 in 4, today | **Not right now** · $92.50 short on Thu, Dec 3 · morning risk: Klarna · Target on Thu, Dec 3, $52.50 short · already short without the buy: Fri, Dec 4, morning, $12.50 |
| Best day / Payday Sync | **Sat, Dec 5** |

## Check it yourself: your own numbers
Start over, then in **Plans** enter: balance **$215**, paycheck **$1,180 every 2 weeks, next in 5 days**, rent **$700 on the 1st**, everyday spending **$175 a week**; plans **Klarna $45 x 3, next in 3 days** and **Afterpay $62.50 x 2, next on payday**.

Expected on Tonight: **Afterpay won't clear** on payday morning, **$17.50 short**, **Move $30.00** the evening before (golden test "README: check it yourself").
- $215 - 5 days x $25 everyday spending - Klarna $45 = **$45** at the end of the day before payday.
- Payday morning, before the paycheck: $45 - Afterpay $62.50 = **-$17.50**.
- What to move: $17.50 + $10, rounded up to $5 = **$30.00**.

## Paste these into "Add a plan" (AI reading)
Results depend on the model, so these are checked by hand on the live site, not in the tests.

| Paste this text | Expected |
|---|---|
| `Affirm. 36 monthly payments of $43.00. Payment 2 of 36 made. Next payment: $43.00 due December 1, 2026` | Affirm, $43.00 x 34 left, every 30 days, **"2 of 36 paid"**; **Add plan** saves it (before 15 Nov it was read but not saved) |
| `Affirm. 12 monthly payments of $87.50. Payment 3 of 12 is due Nov 28` | Affirm, $87.50, **10 left**, every 30 days, next Nov 28 |
| The sample Klarna confirmation (`getSampleKlarnaText`, "Then every 2 weeks until paid off") | Klarna, Target, $80.00 x 3 left, every 14 days, next in 4 days |
| Any text that is not a plan, e.g. a grocery receipt | **"That doesn't look like a pay-later plan. Check the text or type it in."** |

## Edge cases (in the tests)
Paycheck and payment on the same day (end of day fine, morning fails) · two payments on one morning taken in order · tight below $50 · rent before a plan payment the same morning · a returned plan's payments marked disputed · rent on the 31st in February · a purchase followed past day 42 · $100 split in 3 · weekly spending adds up exactly · time zones and DST · Payday Sync is off for monthly pay · a purchase that deepens a failing morning debit does not fit (Afterpay $25 → $40 short) · already short without the purchase, even $1 does not fit · semimonthly paydays on the 15th and the last day (Jan 15, Jan 31, Feb 15, Feb 28; a debit on Jan 31 with $0 fails that morning) · evening check-in on Dec 3 with $27.50 keeps Zip $12.50 short (today's debits are not taken twice) · a 36-month Affirm plan read by AI also passes the storage schema · the README's own-numbers case: Afterpay $17.50 short on payday morning, move $30.

## Payment history (planHistory)
No bank link: the past is inferred from each plan. Pay in 4 (every 2 weeks) counts 4 payments unless `totalPayments` is set (read from "payment 2 of 4" in a screenshot). Payments before the plan was added are shown only if their date is before today. A passed due date counts as taken by autopay unless marked "Didn't go through". Sample Klarna (3 left, next Nov 19): 1 of 4 paid, $80 of $320.
