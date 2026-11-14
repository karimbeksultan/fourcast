# DESIGN — Fourcast

Who: Americans 25–45 paying off several Pay in 4 plans, checking on a phone, a little anxious about money.
Job: say in one sentence whether the money is there, then show why on a 6-week calendar.
Tone: calm, plain, exact. A forecast, not a bank and not a game.

## The one memorable thing: the 6-week forecast
42 days is exactly 6 weeks, so the forecast is a **calendar grid, 7 columns × 6 rows**, starting on Sunday like a US calendar.
- The cell color is the end-of-day balance: green tint above $100, amber below $100, red below $0.
- **Paydays** get a violet bar along the top of the cell. Days with a plan payment show the lender's first letter (K, A, Af, Z, P). Rent shows a small house.
- Today has an ink outline. The lowest point has a thick ring.
- Tapping a day opens its story under the grid: what came in, what went out, the balance at the end of the day.
- On `/check` the same grid shows **which days the purchase fits** (green) or not (gray). The Payday Sync day gets the violet ring.
Everything else stays quiet so the grid carries the page.

## Tokens (`app/globals.css`)
| Name | Hex | Use |
|---|---|---|
| paper | `#F4F6FB` | page background (cool, not cream) |
| surface | `#FFFFFF` | panels |
| ink | `#1C1F3B` | text, today outline |
| ink-muted | `#5E6382` | secondary text |
| line | `#DDE1EE` | borders |
| payday (primary) | `#5B42DC`, soft `#ECE8FC` | paydays, main buttons, Payday Sync |
| ok | `#17845E`, soft `#DDF3EA` | balance above $100, "fits" |
| tight | `#9A6200`, soft `#FDF0D2` | balance $0–$100 |
| short | `#C2373A`, soft `#FBE3E3` | below $0 |

No hex in components: use `bg-ok-soft`, `text-short`, `bg-payday` and the shadcn tokens. No shadows, borders do the separating. Radii: panels 16 px, buttons and inputs 10 px, grid cells 8 px.

**Type:** Geologica only. Status sentence 34–48 px / 700 / −0.02 em, follow-up line 20 px / 450, section titles 20 px / 650, body 16 px / 1.55, small 14 px. All money in tabular figures. Sentence case everywhere, no all-caps labels, no arrows in button text, no "·" lists.

**Motion:** one moment only — when a verdict appears, the forecast cells fill in week by week (120 ms per row). Off with `prefers-reduced-motion`.

## Layout
Mobile first (390 px): one column, 16 px gutters, bottom tab bar (Plans, Forecast, Check a buy).
Desktop (1440 px): top bar with the same three links; content max 1080 px, two columns where it helps (forecast left, details right). Text is left aligned.

```
/ (has data)                         /timeline                        /check
Fourcast        [Sample data] Reset  It's tight.                      Check a buy
It's tight. Lowest $27.50, Dec 3 >   Lowest point: $27.50 on Thu,     Price [$240]   4 payments
Your plans · $640.00 left to pay       Dec 3, the day before payday.  [Check it]
[K  Target  $80.00 × 3  Thu Nov 19]  S M T W T F S                    Not right now.
[  0 of 3 on payday               ]  [grid 6 × 7]                     Buying today would take
[+ Add a plan: Paste | Screenshot |  Thu, Dec 3: ...                  you below $0.
   Type it in]                       Upcoming: ...                    [Plus: grid, best day,
Your money [7 fields]                [Add due dates to my calendar]    Payday Sync | paywall]
```

## Copy (English, US formats)
- Welcome: **See every Pay in 4 before it lands.** — "Put your Klarna, Afterpay and Affirm payments on one 6-week forecast from your paycheck, and check any new one before you buy." Buttons: **Try it with sample data**, **Start with my numbers**. Below: "No sign-up. Your data stays in this browser."
- Status: ok → "You're covered." tight → "It's tight." short → "You'll run short." Follow-up: "Lowest point: $27.50 on Thu, Dec 3, the day before payday." (or "…on Thu, Dec 3." when it isn't).
- Plans: "Your plans", "$640.00 left to pay". Card: "$80.00 × 3 left", "Next Thu, Nov 19". Badge: "All on paydays" / "0 of 3 on payday".
- Add a plan: tabs **Paste text**, **Screenshot**, **Type it in**. Reading: "Reading your plan…" + visible **Type it in instead**. Confirm: **Add plan**. Errors: no_keys → "Reading screenshots is off right now. Type the plan in instead." unreadable → "That doesn't look like a pay-later plan. Check the text or type it in." timeout → "That took too long. Type the plan in instead."
- Money: "Your money" — Balance in checking, Take-home pay, How often, Next payday, Rent, Rent day, Everyday spending per week. Button: **Save my money**.
- Check: title "Check a buy", fields Price, Payments; button **Check it**. Verdicts: "It fits." / "Not right now." Free lines: "Buying today keeps you above $0 for the next 6 weeks." / "Buying today would take you below $0."
- Plus (locked): "See the day it fits" — "the exact day you'd run short", "the first day it fits", "Payday Sync: the day to buy so every payment lands on a payday". Price: **$29.99 a year**, "or $4.99 a month", "Free for your next 2 paydays, until Fri, Dec 4. Cancel any time on this page." Button **Start free trial**.
- Demo checkout: "Demo checkout — no real payment." Button **Start my free trial**. After: "Plus is on until Fri, Dec 4." Link **Cancel Plus**.
- Plus answers: "You'd be $92.50 short on Thu, Dec 3." "It fits if you buy on or after Fri, Dec 4." **"Buy Fri, Dec 4: all 4 payments land on paydays."**
- Calendar: **Add due dates to my calendar** (Plus). Locked: "Reminders the night before each payment come with Plus."
- Check-in (`/?due=`): "Tomorrow Klarna takes $80.00. What's in checking right now?" Button **Update**. Results: "You're covered: $X left after it." / "You'll be $X short tomorrow. Move money in tonight or skip a buy."
- Footer: "Not financial advice. Your data stays in your browser."

## States
Loading: gray skeleton rows in the same shape as the content. Empty: the welcome. Error: the message says what happened and offers the manual path. Buttons that can't work yet are hidden, not disabled with no reason.
