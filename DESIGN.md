# DESIGN — Fourcast

> **v3 (14.11, ~22:00): our own colors, Zimran's site structure.** From zimran.io we take only how the site is built: a sticky header with page links and one action, a huge hero, marquee bands as transitions between blocks ("Before you buy again, here's what's already coming"), a big statement with one phrase in a box, a grid of cards (3 + 2), "what it means for you", a dark "how it works" block, pricing, a closing call to action. Colors are ours: dollar green `#0B6E4F` (brand, buttons), payday sky blue `#2E6FE0`, green-black ink `#0F1F1A`, paper `#F5F7F4`. Pages: `/` welcome, `/pricing`, `/faq` for the buyer; `/plans`, `/timeline`, `/check` for the app (app tabs under the header, a bottom bar on phones). Magic UI: Marquee, Number Ticker, Blur Fade.

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
| paper | `#F5F7F4` | page background |
| surface | `#FFFFFF` | panels |
| ink | `#0F1F1A` | text, dark blocks, marquee |
| brand | `#0B6E4F` | hero, buttons, links |
| ink-muted | `#4F5F58` | secondary text |
| line | `#D9E0DB` | borders |
| payday | `#2E6FE0`, soft `#E3EDFC` | paydays, Payday Sync, highlight box |
| ok | `#0B6E4F`, soft `#DFF2E8` | balance above $100, "fits" |
| tight | `#9A5800`, soft `#FCEFD3` | balance $0–$100 |
| short | `#C2410C`, soft `#FDE4D8` | below $0 |

No hex in components: use `bg-ok-soft`, `text-short`, `bg-payday` and the shadcn tokens. No shadows, borders do the separating. Radii: 8 px for panels, buttons and inputs, 4 px for grid cells.

**Type:** Geologica only. Status sentence 34–48 px / 700 / −0.02 em, follow-up line 20 px / 450, section titles 20 px / 650, body 16 px / 1.55, small 14 px. All money in tabular figures. Sentence case everywhere, no all-caps labels, no arrows in button text, no "·" lists.

**Motion:** one moment only — when a verdict appears, the forecast cells fill in week by week (120 ms per row). Off with `prefers-reduced-motion`.

## Layout
> **App frame (15.11):** `components/app-shell.tsx`. The app screens (Tonight, Plans, Forecast, Before you buy, dispute) sit in a workspace: from 1024 px a 224 px sidebar with the four screens, "Add a plan", the plan status (Free / Plus) and help links; 640–1023 px a header with tabs; phones a bottom bar. An ink bar on top says "Sample data" with "Clear sample data" whenever the sample is loaded, so no screen needs its own badge. Two-column page grids start at 1280 px. Page titles in the app are 30–36 px; only the Tonight answer and the Forecast status stay large. The site pages (`/`, `/pricing`, `/faq`) keep the sticky header.

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
- Plus (locked): "See the day it fits" — "the exact day you'd run short", "the first day it fits", "Payday Sync: the day to buy so every payment lands the morning after payday". Price: **$29.99 a year**, "or $4.99 a month", "Free for your next 2 paydays, until Fri, Dec 4. Cancel any time on Before you buy." Button **Start free trial**.
- Demo checkout: "Demo checkout: no real payment." Button **Start my free trial**. After: "Plus is on until Fri, Dec 4." Link **Cancel Plus**. After a Stripe test checkout: "Turns Plus off and cancels the test subscription in Stripe." (while it runs: "Cancelling…"; if Stripe can't be reached: "Couldn't reach Stripe to cancel. Plus is still on; try again in a moment."). After the demo checkout: "Turns Plus off in this browser. Test mode: no real subscription is billed."
- Plus answers: "You'd be $92.50 short on Thu, Dec 3." "It fits if you buy on or after Fri, Dec 4." **"Buy Sat, Dec 5: every payment lands the morning after payday."**
- Calendar: **Add due dates to my calendar** (Plus). Locked: "Reminders the night before each payment come with Plus."
- Check-in (`/?due=`): "Tomorrow Klarna takes $80.00. What's in checking right now?" Button **Update**. Results: "You're covered: $X left after it." / "You'll be $X short tomorrow. Move money in tonight or skip a buy."
- Footer: "Not financial advice. Your data stays in your browser."

- Save error (Add a plan): "We couldn't save this plan. Check the amount and the number of payments, or type it in." Button **Type it in**. Manual form: "We couldn't save this plan. Check the amount and the number of payments." / "That's more than $10M. Check the amount." / "Payments left should be 1 to 36."
- Tonight, after **I moved $25.00**: title "Marked as moved." (tight payment: "Marked as seen."), line "Fourcast can't see your bank. Plans and Forecast keep counting your last typed balance until you update it.", buttons **Update my balance**, **Undo**. Never "covered": Fourcast only knows what the person told it.
- Tonight, move amount: "$12.50 short + $10 so one card swipe doesn't sink it, rounded up to $25.00." Log: "What Fourcast caught", "1 payment flagged, 1 handled, 1 return followed", "From your plans for the next 6 weeks. Fourcast doesn't see your bank, so \"moved\" is what you told it."
- Plus, one wording everywhere (paywall, Pricing, FAQ): "A calendar reminder at 8 pm…", "How much short a new buy would run you, and the first day it fits", choice **$29.99 a year** (Save 50%) / **$4.99 a month** under "After the trial", "Cancel any time on Before you buy.", "Stripe test mode: card 4242 4242 4242 4242, no real money moves." Pricing, "How the trial works": Today / 8 pm before your first risky payment / Your second payday.
- Check what we read (Add a plan): "$43.00 × 34 left, next Tue, Dec 1, every month, 2 of 36 paid" (frequency always; "X of Y paid" when the text gave the total).
- Old balance (Tonight, Forecast; only when the balance was typed on an earlier day): "Your balance is from Thu, Nov 12. Update it so the answer here is right." Button **Update my balance**.
- Page titles: "Tonight · Fourcast", "Plans · Fourcast", "Forecast · Fourcast", "Before you buy · Fourcast", "Write my dispute · Fourcast", "Pricing · Fourcast", "FAQ · Fourcast"; the landing keeps the full line.
- Reminder opened where there are no plans (`/plans?due=…`, empty browser): "This reminder was made on another device. Fourcast keeps your plans in the browser where you added them." Then the usual two buttons.
- Landing, story before JavaScript: "Without Fourcast, sample data" with three steps, "The evening before: Enough for today, not for the morning.", "6 am: Autopay takes the payment. It fails.", "3 pm: The paycheck lands. Too late." No amounts: they are counted from today in the browser.
- Landing motion: one moving band ("Debit at 6 am. Paycheck at 3 pm. Limit cut by 5 pm."); the lenders line stands still.
- Keyboard: "Skip to content" is the first Tab stop on every page.
- Contrast: `--payday` #2c6bd7 and `--short` #b83e0b (were #2e6fe0 and #c2410c), so small text on them and on their soft tints is at least 4.5:1.
- Check a buy, morning risk (under the verdict): "Klarna · Target on Thu, Dec 3 would be $52.50 short that morning."
- Check a buy: "Or try" $100 / $240 / $500; "What the answer tells you"; "Enter a price up to $10,000."
- Rate limit: "Too many tries in a minute. Wait a moment, or enter the plan by hand." Dispute: "…or use the standard letter." + **Use the standard letter**.
- Landing hero: the headline, both buttons and the 26% / 11% figures are plain text in the server HTML, with no entrance animation. Motion stays where it explains the product (the morning story, the answer panels, the bands), each with a pause button and a reduced-motion path.
- Touch targets: on a phone every button and standalone link is at least 44 px tall (links inside a sentence are exempt). Secondary actions on Tonight are outline buttons.

## States
Loading: gray skeleton rows in the same shape as the content. Empty: the welcome. Error: the message says what happened and offers the manual path. Buttons that can't work yet are hidden, not disabled with no reason.
