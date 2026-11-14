# Demo inputs and expected numbers

Every number here comes out of `lib/plan.ts` and is checked by `lib/plan.test.ts` (`npm test`).
Dates are relative to the day the page is opened; the table shows them for **Sun, Nov 15, 2026**.

## Calculation rules
- Window: 42 days starting today. Balances are end of day.
- On one day the paycheck lands first, then rent, then plan payments, then the new purchase.
- Everyday spending is spread evenly: exactly the weekly amount every 7 days, starting today.
- Status: **short** if the lowest point is below $0, **tight** if below $100, otherwise **ok**.
- Pay in 4: the first payment on the day of purchase, then every 14 days; leftover cents go to the first payment.
- A purchase "fits" on a day if, bought that day, the balance never goes below $0 from then until after its last payment (even past day 42).
- **Payday Sync** (weekly or every-two-weeks pay only): the first payday on which the purchase fits. Every payment then lands on a payday.

## Sample data ("Use sample data")
| Field | Value | Date on Nov 15 |
|---|---|---|
| Balance | $922.50 | |
| Paycheck | $1,450.00 every 2 weeks, next in 5 days | Fri, Nov 20 |
| Rent | $1,200.00 on the day of month 16 days from today | Dec 1 |
| Everyday spending | $280.00 a week ($40 a day) | |
| Afterpay · Nike | 1 payment of $50.00 left, in 2 days | Tue, Nov 17 |
| Affirm · Best Buy | 2 payments of $175.00 left, in 7 days | Sun, Nov 22 |

## Step 2: add Klarna (AI reads `getSampleKlarnaText(today)`)
Expected plan: **Klarna · Target**, 3 payments of $80.00 left, next in 4 days (Thu, Nov 19).
If AI is off, the same plan is entered by hand in four fields.

## Expected results
| Input | Expected |
|---|---|
| Timeline, two sample plans | ok · lowest $187.50 on Thu, Dec 3 |
| Timeline after adding Klarna | **tight · lowest $27.50 on Thu, Dec 3** · $640 owed · 6 payments in 6 weeks · biggest pull: Affirm |
| Paydays in the window | Nov 20, Dec 4, Dec 18 |
| Check $240 in 4, today | **Not right now** · $92.50 short on Thu, Dec 3 |
| Best day | **Fri, Dec 4** |
| Payday Sync | **Buy Fri, Dec 4: all 4 payments land on paydays** (Dec 4, Dec 18, Jan 1, Jan 15) |
| Klarna badge | 0 of 3 on payday (it hits the day before payday) |
| Calendar file | 6 payment events with a reminder at 8 pm the evening before + 3 payday events; links `/?due=YYYY-MM-DD` |

## Edge cases (in the tests)
Paycheck and payment on the same day · rent on the 31st in February · a purchase followed past day 42 · $100 split in 3 · weekly spending adds up exactly · time zones and DST · Payday Sync is off for monthly pay · semimonthly paydays on the 15th and the last day.
