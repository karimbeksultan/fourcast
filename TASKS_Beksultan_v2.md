# Задачи Бексултана — финал v2 (ночь на 15.11)

Файл самодостаточный: его можно целиком вставить в новую сессию Claude Code. Источник находок — `docs/review-2.md` (два независимых ревьюера: «жюри» по живой ссылке и код-ревьюер). Оценка сейчас **≈ 77/100**, код **7,5/10**. После этих правок цель — **80+**.

## Где мы
- Репозиторий `karimbeksultan/fourcast`, ветка `main`. Прод — **https://fourcast-zimran.vercel.app**: каждый push в `main` выкатывается сам. Ключи (LLM_1…3, STRIPE_SECRET_KEY) уже в Vercel, новых не нужно.
- Продукт — **Fourcast Limit Guard** (`LIMIT_GUARD.md`). Главная вкладка **Guard** (`/plans`), дополнительные — **Forecast** (`/timeline`) и **Before you buy** (`/check`). Модель утра: кредитор списывает утром, зарплата приходит днём.
- **Фронт (Аят) уже сделал** все свои пункты ревью №2 (коммит 4b314af): формулировки рисков, кнопка «Remind me at 8 pm», общий блок Plus, плашка после «Add plan» и др.
- **Правила те же** (`CLAUDE.md`):
  - даты — строки `YYYY-MM-DD`, суммы — целые центы, `today` приходит из браузера;
  - любое изменение расчёта — вместе с тестом в `lib/plan.test.ts` и строкой в `demo_inputs.md`;
  - перед push: `npm run lint && npm test && npm run build`;
  - коммиты от своего имени, без `Co-Authored-By`.

## Порядок и время
| # | Задача | Время | Кто подключает фронт |
|---|---|---|---|
| 1 | **M1** check-in без двойного вычета | 00:15–00:40 | Аят (вызов хелпера) |
| 2 | **M2** зарплата два раза в месяц | 00:40–01:00 | — |
| 3 | **M3 + M4** «Before you buy» с моделью утра и «уже не хватает» | 01:00–02:00 | Аят (тексты на `/check`) |
| 4 | **M7** большие числа не стирают данные | 02:00–02:15 | Аят (текст ошибки) |
| 5 | **S6** дата у баланса | 02:15–02:30 | Аят (плашка «update») |
| 6 | **S4** Stripe: название и описание | 02:30–02:40 | — |
| 7 | Could (ниже), если успеваешь | 02:40–03:30 | — |
| 8 | Деплой, `npm run smoke -- https://fourcast-zimran.vercel.app`, полный прогон демо на живой ссылке (390 и 1440 px) | 03:30–04:30 | — |
| — | **КТ2 в 05:00**, сон 05–08, B9 (жюри №2) в 08:00, фриз 10:00, B10 (README, чистка) 10–11, B11 (сдача) до 11:45 | | |

Пушь каждую задачу отдельно, как только тесты зелёные: Аят подключает фронт сразу после.

## Must

### M1. Check-in вычитает сегодняшние списания дважды
**Ошибка:** `components/check-in.tsx` сохраняет введённый вечером баланс как `money.balance`, а `Money.balance` — это баланс **на начало сегодняшнего дня**. В расчёте сегодняшние списания, аренда и траты вычитаются ещё раз. Вечером 2 декабря при реальных $27.50 приложение пишет «$132.50 short» вместо $12.50.
**Контракт (новое в `lib/plan.ts`):**
```ts
/** Check-in вечером: человек вводит, что на счёте сейчас (конец сегодняшнего дня).
 *  Возвращает state, где money.balance — баланс на начало сегодняшнего дня, и balanceOn = today. */
export function applyCheckIn(state: AppState, eveningBalance: Cents, today: ISODate): AppState;
// money.balance' = eveningBalance + (money.balance − buildTimeline(state, today).days[0].balance)
```
**Золотой тест:** состояние = `getSampleState("2026-11-15")` + `getSampleKlarnaPlan("2026-11-15")`, `today = "2026-12-03"` (вечер перед Zip 4 декабря), `applyCheckIn(state, 2750, today)`.
- `debitRisks(next, today)` содержит Zip `2026-12-04`, `fails`, `shortBy: 1250`, `paydayLater: true`.
- `buildTimeline(next, today).days[0].balance === 2750`.

**Фронт после push:** Аят меняет `components/check-in.tsx` на `onSave(applyCheckIn(state, cents, today))`.

### M2. Зарплата два раза в месяц ставится на `день+15`
**Ошибка:** `lib/plan.ts:58-60` (`paydaysBetween`, ветка `semimonthly`) — вторая дата `day + 15`, а не последний день месяца. При якоре 15-е → 30 января вместо 31-го, Guard говорит «safe», когда платёж 31-го не пройдёт.
**Правило:**
- якорь 15-е или ≥ 28-го → пара (15, последний день месяца);
- якорь 1-е → (1, 15);
- иначе якорь ≤ 15 → (d, d+15), якорь > 15 → (d−15, d) — с обрезкой до конца месяца, как сейчас.

**Тесты:** якорь `2027-01-15` → `2027-01-15, 2027-01-31, 2027-02-15, 2027-02-28`. Якорь `2027-02-28` → `2027-02-28, 2027-03-15, 2027-03-31`. Сценарий ревьюера: $0 на счёте, Afterpay $50 на 2027-01-31 → `debitRisks` не пустой.

### M3. «Before you buy» не видит модель утра
**Ошибка:** `checkPurchase` (`lib/plan.ts` ~200–235) смотрит только конец дня. Пример: баланс $200, Afterpay $45 в день зарплаты, покупка $60 → «It fits», а Guard уже пишет «$25 short», и покупка делает «$40 short».
**Правило для `fitsByDay[s].fits`** — покупка в день `s` подходит, если для всех дней `d ≥ s`:
- конец дня с покупкой ≥ $0 (как сейчас), **и**
- в каждый день `d`, где есть платёж по плану: утро с покупкой ≥ `min(0, утро без покупки)`. То есть покупка не создаёт новый `fails` и не делает существующий глубже.

**Контракт (новое поле в `Verdict`, `lib/types.ts`):**
```ts
/** Купив сегодня: первый платёж по плану, который из-за покупки не пройдёт утром (или пройдёт хуже). */
morningRisk: { date: ISODate; lender: Lender; merchant: string; shortBy: Cents } | null;
```
**Тест:** сценарий из примера → `verdict: "not_now"`, `morningRisk: { lender: "Afterpay", shortBy: 4000, … }`. Числа демо (`demo_inputs.md`) не должны сдвинуться: если сдвинулись, обнови таблицу.

**Фронт после push:** на `/check` — «Not right now: Afterpay on Fri, Nov 20 would be $40 short that morning.»

### M4. Нехватка, которая есть и без покупки
**Ошибка:** если денег не хватает и без покупки, даже покупка за $1 получает «It doesn't fit… Try a smaller price».
**Контракт (новое поле в `Verdict`):**
```ts
/** Без этой покупки: первый день, когда конец дня < $0 или платёж по плану не проходит утром. */
alreadyShort: { date: ISODate; amount: Cents; reason: "end_of_day" | "morning" } | null;
```
**Тест:** баланс $10, расходы $50 в неделю, без зарплаты в окне → `alreadyShort` не `null` при покупке $1.
**Фронт после push:** «You're already short on {date} without this buy. Fix that first on Guard.» и ссылка на Guard.

### M7. Огромное число стирает все данные
**Ошибка:** `saveState` (`lib/storage.ts`) пишет без проверки. 14 и больше цифр в сумме → при чтении схема не проходит → все планы пропадают.
**Контракт:**
- `export const MAX_CENTS = 1_000_000_000` ($10M) в `lib/schema.ts`;
- в схеме `cents` и `balance` с `.max(MAX_CENTS)` (`balance` ещё `.min(-MAX_CENTS)`);
- `saveState(state): boolean` — `safeParse`, при ошибке не пишет и возвращает `false`.

**Тест:** `AppStateSchema.safeParse` с балансом `1e14` → false; `saveState` такого состояния → `false`.
**Фронт после push:** `toCents` в `components/copy.ts` отклоняет больше `MAX_CENTS`, формы показывают «That's more than $10M — check the number.»

## Should

### S6. Дата у баланса
**Ошибка:** если зайти через неделю, старый баланс применяется к сегодня, прошедшие списания выпадают, прогноз молча слишком оптимистичен.
**Контракт:**
- `Money.balanceOn?: ISODate` (необязательное, в `lib/types.ts` и `lib/schema.ts`);
- `getSampleState(today)` ставит `balanceOn: today`;
- `applyCheckIn` ставит `balanceOn: today`.

**Фронт после push:** форма денег ставит `balanceOn = today` при сохранении. На Guard плашка «Balance from Sat, Nov 14. Update it so Guard stays right.», если `balanceOn < today`.

### S4. Stripe: название и описание
- Stripe → Settings → Business → **Public details**: название **Fourcast**. **Branding**: цвет `#0B6E4F`, иконка — квадрат с «4». Сейчас на странице оплаты написано «no sandbox».
- `app/api/checkout/route.ts:33`: описание продукта начать с напоминания — «A heads-up at 8 pm before a pay-later payment won't make it. Payday Sync. Exact shortfall before you buy.»

## Could (если остаётся время до 03:30)
- **Payday Sync пропускает сегодня,** если зарплата была вчера, а `nextPayday` уже следующая (`lib/plan.ts:224`): начинать перебор с `anchor − step`. Тест.
- **`/api/read-plan` с телом `null` → 500** (`app/api/read-plan/route.ts:15-20`): проверять, что тело — объект. Тест или ручная проверка `curl`.
- **`/api/dispute` отвечает 400** при `paymentsLeft: 0` или магазине длиннее 80 символов, и фронт молча подменяет письмо шаблоном. Обрезать `merchant` до 80, разрешить `paymentsLeft ≥ 0`.
- **Месячный тариф не доходит до Stripe:** `POST /api/checkout { trialEnds, plan: "year" | "month" }` → цена $29.99/год или $4.99/мес. Фронт передаст `plan`.
- **Мёртвый код:** `paydaySync()` для плана (`lib/plan.ts:284`) больше не используется в UI; строка «Klarna badge 0 of 3» в `demo_inputs.md:41` устарела.

## После КТ2 (как было)
- **B9 08:00** — строгий прогон жюри №2, топ-5 правок, сначала то, что вырезать.
- **B10 10:00–11:00** — README:
  - v2-обещание, вкладки, Plus включает напоминания `.ics`;
  - ключевые зависимости (Gemini Flash-Lite через AI Studio, Stripe в тестовом режиме);
  - чистка, репозиторий публичный.
- **B11 до 11:45** — сдача по ссылке из письма: PDF дека, ссылка, репозиторий, трек **Money**. Сразу после — Vercel → Settings → Git → Ignored Build Step → «Don't build anything», и в `main` больше не пушим (FAQ Q73).

## Как отчитываться
После каждой задачи — строка в «Передача» в `TASKS.md`: что сделано, коммит, что Аяту подключить. В сообщении коммита — номер пункта (M1, M2…).
