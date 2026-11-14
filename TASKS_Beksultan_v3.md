# Задачи Бексултана — v3 (утро 15.11, до сдачи в 12:00)

Файл самодостаточный: его можно целиком вставить в новую сессию Claude Code. Всё, что связано с Vercel, делаешь ты: доступ только у тебя.

## Что изменилось, пока ты спал
Прод — **https://fourcast-zimran.vercel.app**, последний коммит в `main` — `211fb65`. Аят (с Claude) влил твои 19 коммитов (M1–M7, S4, S6, SEO) и добавил:
- **Tonight** (`/tonight`): первая вкладка, ответ «что сделать сегодня вечером», полоса утренних балансов на 3 недели, трекер возвратов, долг по кредиторам. Код: `app/tonight/page.tsx`, `components/concept/*`, `lib/concept.ts`.
- **Лендинг** с анимированной «историей утра» без Fourcast и с ним, бегущими строками (с кнопками паузы), новым логотипом (`components/logo.tsx`, `app/icon.svg`).
- **Одна модель «утро» везде.** `dayLow()` в `lib/plan.ts`: день считается по самому низкому балансу (утром после автоплатежа или вечером). Forecast, Guard и Tonight дают один ответ. Твой `checkPurchase` (morningRisk, alreadyShort с `reason`) взят целиком, без изменений.
- **Образец Tonight** (`getConceptSample`): возвращённый заказ Nordstrom теперь 1 платёж после зарплаты 4 дек. Твои тесты «Tonight sample» пересчитаны: Zip $12.50 short 4 дек., долг $720.
- **Возвраты:** этап хранится в плане, `Plan.refundStage` (в схеме). Отдельного ключа в localStorage больше нет.
- **История платежей:** `planHistory()` в `lib/plan.ts`, новые поля `Plan.totalPayments` и `Plan.missed` (в схеме), `PaymentsList` и прогресс на карточках Plans. `read-plan` теперь просит у модели `totalPayments`.
- **Plans** упрощён: одна строка статуса со ссылкой на Tonight, без дубля карточек рисков. Вкладка Guard переименована в **Plans**.
- Тесты: **36**, все зелёные. `npm run lint` и `npm run build` чистые.

## 1. Срочно: Vercel Security Checkpoint (сделать первым)
**Что случилось:** около 03:00 Claude 10 минут опрашивал прод из командной строки (ждал деплоя). После этого Vercel отвечает этому компьютеру **403 «Vercel Security Checkpoint»** на `curl` и на `npm run smoke`. Браузер проверку проходит.
**Сделать:**
1. Vercel → проект fourcast → **Firewall**. Посмотреть, включён ли **Attack Challenge Mode** или правило, которое проверяет всех посетителей. Если да — выключить, чтобы жюри не видело экран проверки.
2. В Firewall → Logs посмотреть, нет ли блокировок для обычных посетителей (не только этого IP).
3. С телефона через мобильный интернет открыть `https://fourcast-zimran.vercel.app` в режиме инкогнито: сразу должен открыться Fourcast, без страницы проверки.
**Готово, когда:** с твоей машины `npm run smoke -- https://fourcast-zimran.vercel.app` → «All checks passed».

## 2. Проверить деплой `211fb65`
1. Vercel → Deployments: последний деплой `211fb65` в статусе Ready, без ошибок сборки.
2. `npm run smoke -- https://fourcast-zimran.vercel.app` (после п. 1).
3. Логи функций (`/api/read-plan`, `/api/dispute`, `/api/checkout`) за последние часы: нет 500.
4. `/api/health` показывает LLM_1 и LLM_2 включёнными. LLM_3 сейчас off — так и задумано или ключ слетел?

## 3. Прогон демо на живой ссылке (390 и 1440 px)
1. `/` → «Try it with sample data» → `/tonight`: заголовок **«Zip won't clear on Fri, Dec 4.»**, $12.50 short, «Move $25.00».
2. История утра на лендинге проигрывается: Without → «Payment failed», With → «Cleared», кнопка паузы останавливает её.
3. `/plans`: «1 payment at risk. Zip on Fri, Dec 4.», «$720.00 left to pay on 5 plans», у Klarna «1 of 4 paid», блок «Payments».
4. `/timeline`: «You'll run short. Lowest point: $12.50 short on Fri, Dec 4, in the morning before your paycheck lands.»
5. `/check`, $1: «You're already $12.50 short on Fri, Dec 4 without this buy.» $240: «Buying today would take you below $0 on Thu, Dec 3…».
6. Возврат Nordstrom → «Write the dispute letter» → письмо приходит (AI ~15 с, иначе шаблон).
7. Stripe: «Start free trial» → тестовый checkout открывается (карту не вводить без нужды).
8. Скриншот распознавания: вставить текст Klarna «payment 2 of 4» → план добавляется, в карточке «1 of 4 paid».

## 4. Ревью кода Аята в твоей зоне (15 минут)
Пробежать глазами, не ломает ли что-то твои контракты:
- `lib/plan.ts`: `dayLow`, `buildTimeline.lowest.when`, `planHistory`.
- `lib/types.ts`, `lib/schema.ts`: `refundStage`, `totalPayments`, `missed`, `Timeline.lowest.when`.
- `lib/read-plan.ts`: новое поле `totalPayments` в промпте и в `PlanDraftSchema` (nullish).
- `lib/concept.ts`: `getConceptSample`, `nextRisk` (fails раньше tight), `owedByLender`, `returnViews`.

## 5. Если останется время (P2 из строгого ревью)
- Совет «сколько перевести» сейчас считается на каждый платёж отдельно ($25 и $105), а нужен накопительный: сколько перевести один раз, чтобы прошли все ближайшие.
- Пропущенный платёж (`Plan.missed`) не возвращается в прогноз: кредитор его повторит, а Forecast о нём не знает. Добавить повторное списание через N дней или хотя бы учесть его в долге.
- Письмо-спор ~15 с: показать прогресс или сначала отдавать шаблон, а AI-версию подменять, когда придёт.
- У всех страниц приложения один `<title>`: сделать свой для каждой страницы через `metadata`.

## Перед сдачей
- `npm run lint && npm test && npm run build` зелёные, прод отвечает, Firewall не показывает экран проверки.
- Строка в `TASKS.md` и «Решения» в `BRIEF.md`, как обычно.
