# Задачи Бексултана — данные и бэкенд

Файл самодостаточный: его можно целиком вставить в новую сессию Claude Code. Сначала прочитай `BRIEF.md` и свою строку в `TASKS.md`.

## ⚡ v2 СЕЙЧАС (14.11, 22:15): Fourcast Limit Guard — читай [`LIMIT_GUARD.md`](LIMIT_GUARD.md)
- **Основа — Limit Guard.** Вкладка **Guard** (`/plans`) открывается первой: какие платежи не пройдут утром до зарплаты и что сделать вечером. **Forecast** (`/timeline`) и **Before you buy** (`/check`) — дополнительные вкладки, это наш калькулятор (лента на 6 недель, «влезет ли покупка», Payday Sync).
- **Ничего нового не заводим.** Тот же репозиторий `karimbeksultan/fourcast`, тот же проект Vercel **https://fourcast-zimran.vercel.app** (push в `main` = прод, ветки = превью), те же ключи в Vercel: `LLM_1…3`, `STRIPE_SECRET_KEY`. Новых переменных окружения v2 не требует: `/api/dispute` ходит через тот же `lib/llm.ts`.
- **Твои задачи v2:** G-B1 контракт и заглушки (типы `DebitRisk`, `Plan.status`/`returnedOn`, `TimelineDay.morning`, заглушка `/api/dispute`) → G-B2 модель утра и `debitRisks` + Zip $40 в образце + тесты → G-B3 Payday Sync на следующий день после зарплаты → G-B4 `/api/dispute` (шаблон без ключей, AI с ключом) → G-B5 тексты `.ics` и check-in → G-B6 деплой, smoke, Stripe Branding → G-B7 лимиты (Should). Часы и критерии готовности — `LIMIT_GUARD.md` §6.
- **Что уже сделал фронт:** Guard на `/plans` и вкладки Guard · Forecast · Before you buy (коммит c663375). Пока нет твоего `debitRisks`, фронт берёт его из временного `components/guard-shim.ts` (та же сигнатура). Возврат и письмо (G-A3) делаю сейчас; до твоего `/api/dispute` фронт пишет письмо по шаблону сам и переключится на API, когда оно появится.
- **Не ломать `main`:** перед push `npm run lint && npm test && npm run build`.

## Уже сделано за тебя (коммит 34d5bb0, 19:10)
Каркас (B1 без сервера), контракт (B2), логика с Payday Sync и `demo_inputs.md` (B3), тесты и CI (B3t), `lib/llm.ts` и `/api/read-plan` (B4 без проверки ключом), `lib/storage.ts` и `lib/ics.ts` (B5 без деплоя), `/api/health`, `deploy.sh`, `CLAUDE.md`, README. Сначала `git pull`, свой каркас не пушь.

**AI проверен (~20:30) на ключе Аята:** `gemini-flash-lite-latest` читает текст и картинку Klarna за 1–2 с, всё верно. Gemma 4 31B не укладывается в 10 с (всегда «думает» 24–30 с). Модели в `.env.example` уже заменены — в Vercel вставь эти же значения.

**Тебе сейчас:**
1. Деплой — **Vercel вместо своего сервера** (решение 14.11, `deploy.sh` удалён): импорт репозитория в Vercel, push в `main` = прод, ветки = превью. Ключи — в Vercel → Settings → Environment Variables. После каждого деплоя `npm run smoke -- <url>`, откат — Instant Rollback.
2. Ключ Google AI Studio → `.env` локально и в Vercel. Проверить: текст `getSampleKlarnaText(today)` и скриншот Klarna превращаются в план за 10 с; поправить промпт в `lib/read-plan.ts`, если нужно.
3. Письмо со ссылкой для сдачи; аккаунт Stripe в тестовом режиме (#15).
4. B6 — отдельной сессией, как и было.
5. Освободившееся время: Stripe (#15) раньше, потом помощь Аяту (B7, ревью).

## Что изменилось 14.11 (ревью идеи + FAQ организаторов)
Подробно: `docs/idea-review.md` и раздел «Ответы организаторов» в `BRIEF.md`. Для тебя:
- **B1:** `lib/llm.ts` — один бюджет 10 с (Gemma сразу, Gemini Flash параллельно через 4 с), OpenRouter по желанию. В `CLAUDE.md` правило «без тестов и CI» заменить: один файл `lib/plan.test.ts` (vitest) и один GitHub Action. В `.env.example` добавить `STRIPE_SECRET_KEY=`.
- **B2:** в контракт добавились `fitsByDay`, `paydaySync`, `Timeline.paydays`, `AppState.plus`, `shrinkImage`, `buildIcs(state, today, baseUrl)`, `/api/health` (список — в `TASKS.md` → «Контракт»). Заглушки сразу с ними, чтобы Аят верстала.
- **B3:** + **Payday Sync** и `fitsByDay` (см. раздел ниже), правила кода про даты и центы. Образец: аренда на today+16, зарплата раз в две недели, одна зарплата на лучшем дне.
- **Новое:** B3t — золотые тесты + GitHub Action (22:00–23:00); B-S — Stripe Checkout в тестовом режиме (Should, 03:30–05:00); B6 — отдельной сессией параллельно с B3, плюс бенчмарки RevenueCat и Adapty.
- **Убрано:** отдельная страница `/plus`, кнопка «Explain in plain English», резервное видео (FAQ Q145).
- **Добавлено ~18:50:** получить ключ Google AI Studio и сверить лимиты (B1); проверить письмо со ссылкой для сдачи (FAQ Q82); *Should:* запасная ссылка на Vercel (B5); после сдачи прод не трогаем до конца финала (B11).

## Контекст в 5 строк
- Business Cup 2.0 (AIESEC NU × Zimran): B2C веб-продукт для **взрослых в США, 25–45 лет**, за который они будут платить. Рынок **только США** (подтвердили организаторы).
- Продукт **Fourcast**: сводит все рассрочки Pay in 4 (Klarna, Afterpay, Affirm) в ленту на 6 недель от зарплаты и **до покупки** говорит, влезет ли новая.
- Оценка: 40% «работает по-настоящему, не захардкожено, жюри читает репозиторий», 20% «за что платят и почему вернутся», 15% пользователь, 15% бизнес, 10% новизна.
- Сдача до вс 15.11, 12:00: PDF-дек, живая ссылка **без логина**, **публичный** репозиторий.
- Разделение: **ты — данные и бэкенд**, Аят — UI и фронтенд. Её файлы (`app/**/page.tsx`, `components/**`, `app/globals.css`, `DESIGN.md`) не трогаешь.

## B1. Окружение «под ключ» (17:00–18:30)
Цель: Аят клонирует репозиторий, запускает `npm i && npm run dev` и сразу верстает. Чек-лист — Аят сверит по нему, что получилось:

- [ ] **Стек:** Next.js 16 + TypeScript + Tailwind + shadcn/ui (Radix, иконки Lucide), `zod`, `motion`. App Router, без `src/`. Если папка не пустая, создай проект во временной папке и перенеси, не затирая `BRIEF.md`, `TASKS.md`, `TASKS_Beksultan.md`, `README.md` и `.git`.
- [ ] **`npm run build` проходит**, `npm run dev` открывает стартовую страницу.
- [ ] **`.gitignore`:** `.env*`, `!.env.example`, `case/`, `shots/`, `demo-cache.json`, `AGENTS.md`.
- [ ] **`.gitattributes`:** `* text=auto eol=lf`, `*.cmd text eol=crlf`. Иначе на Windows у Аята скрипты станут CRLF.
- [ ] **`.env.example`** (ключи пустые) — см. раздел «AI» ниже.
- [ ] **`lib/llm.ts`:** один OpenAI-совместимый клиент. **Один бюджет 10 с:** `LLM_1` стартует сразу, `LLM_2` — параллельно через 4 с, побеждает первый ответ, прошедший zod-схему; `LLM_3` — только если задан ключ. Ключи читаются только на сервере, **никаких `NEXT_PUBLIC_`**.
- [x] ~~`scripts/deploy.sh` (pm2 + Caddy)~~ — заменён на Vercel (14.11): сборка и откат на стороне Vercel, проверка после деплоя — `scripts/smoke.mjs`.
- [ ] **Vercel:** проект импортирован из GitHub, живая ссылка по HTTPS открывается без логина, `npm run smoke -- <url>` зелёный.
- [ ] **Ключ Google AI Studio** (aistudio.google.com → Get API key) в `.env` на сервере; лимиты Gemma 4 31B и Gemini Flash сверены в кабинете.
- [ ] **Письмо со ссылкой для сдачи** пришло капитану (FAQ Q82).
- [ ] **`CLAUDE.md`** (коротко): одна задача — одна сессия; читать `BRIEF.md` и свою строку `TASKS.md`; кто каким файлам хозяин (см. `TASKS.md`); фронт берёт данные только через контракт ниже; цвета и шрифты только из темы, без hex в компонентах; тексты экранов из `DESIGN.md`, без lorem ipsum; у каждого экрана есть состояния загрузки, пусто и ошибка; иконки Lucide, без эмодзи и AI-картинок; AI только через `lib/llm.ts`; правила кода: даты — строки `YYYY-MM-DD`, суммы — целые центы, `today` только из браузера, нерабочие кнопки прячем; маленькие коммиты; без сабагентов; тесты — только `lib/plan.test.ts` и один GitHub Action; в конце сессии обновить свою строку `TASKS.md` и «Решения» в `BRIEF.md`. Плюс **карта кода** до 15 строк.
- [ ] **Скиллы дизайна:** положить `.claude/skills/` из `repo-skills.zip` (пришлёт Аят, внутри `HOW-TO.md`). Они нужны для твоего ревью дизайна (B7) и для фронта Аята.
- [ ] **Git:** `git config user.name` и `user.email` — твои. Коммиты **только от твоего имени, без строк `Co-Authored-By: Claude`**: на прошлом хакатоне за коммит от Claude снимали баллы.
- [ ] Закоммитить `chore: scaffold app`, запушить в `main`, дописать строку в «Передача» в `TASKS.md`: что сделано, как запустить, ссылка на сервер.

## B2. Контракт для фронта (18:30–19:00)
Выложи в `main` **типы и заглушки** с правдоподобными данными, чтобы Аят верстала, не дожидаясь логики. Потом заменишь заглушки настоящим кодом, **не меняя сигнатуры**:
- `lib/types.ts` — `Plan`, `Money` (баланс, зарплата, частота, дата следующей, аренда и её день), `AppState`, `TimelineDay`, `Timeline`, `Purchase`, `Verdict`.
- `lib/plan.ts` — `buildTimeline(state, today): Timeline` (6 недель, статус `ok | tight | short`, нижняя точка), `checkPurchase(state, purchase, today): Verdict` (`fits | not_now`, на сколько не хватает и когда, лучший день).
- `lib/sample.ts` — `getSampleState(today): AppState`. Вся история (зарплата, аренда, списания) строится **от сегодняшней даты**, чтобы демо работало в любой день.
- `lib/storage.ts` — `loadState()`, `saveState(state)`, `clearState()` в localStorage, схема zod с версией.
- `POST /api/read-plan` — `{ text?, imageBase64? }` → `{ plan }` или `{ error, code: "no_keys" | "unreadable" | "timeout" | "too_large" }`. Лимит размера картинки, на сервере ничего не храним.
- `lib/ics.ts` — `buildIcs(state, today, baseUrl): string`, напоминание (VALARM) накануне каждого списания и ссылка `${baseUrl}/?due=YYYY-MM-DD` на check-in.
- **Добавлено 14.11:** `Verdict.fitsByDay`, `Verdict.paydaySync`, `paydaySync(state, plan, today)`, `Timeline.paydays`, `AppState.plus`, `lib/image.ts` → `shrinkImage(file)`, `GET /api/health`. Точные типы — в `TASKS.md` → «Контракт».

## Payday Sync: как считать (для B3)
- Pay in 4: первый платёж в день покупки, дальше каждые 14 дней (дни 0, 14, 28, 42).
- **Для покупки:** при зарплате раз в неделю или раз в две недели перебираем дни зарплаты в 42-дневном окне; первый, в который покупка влезает (ни в один день баланс не уходит ниже нуля), — это `paydaySync.buyOn`, а `debits` — 4 даты списаний. При зарплате раз в месяц или два раза в месяц — `null` (фронт пишет, что ровно совпасть не получится, и показывает обычный лучший день).
- **Для взятого плана:** `paydaySync(state, plan, today)` считает, сколько оставшихся списаний падает на день зарплаты: `{ onPayday, total }`.
- В один день зарплата считается раньше списаний. Это один из золотых тестов.
- Демо: из образца с открытием 15.11 ожидаем «Buy Fri, Dec 4: all 4 payments land on paydays». Точные числа фиксируешь в `demo_inputs.md`.

## AI в продукте: решение
**Не делаем «AI-driven» продукт и не делаем чат-бот.** AI нужен в одном месте: прочитать скриншот или текст подтверждения рассрочки и вернуть план (zod).

Почему не чат-бот:
- **40% оценки** — «core value is real, not faked». Наша ценность — точный расчёт ленты и ответ «влезет / не влезет». Его делает обычный код, и он не может «соврать». Чат поверх этого жюри прочитает как «обёртку над ChatGPT».
- Каждое сообщение в чате — вызов модели. На бесплатных лимитах чат может упасть прямо на питче.
- В BRIEF чат прямо в «Вне скоупа».

Кнопку «Explain in plain English» тоже не делаем (решение ревью идеи 14.11): по FAQ (Q96) так можно, но ядро у нас и так считает код, а время нужно на пейвол и Payday Sync.

## AI: какая модель (бесплатно, не локально)
Безлимитных бесплатных моделей нет ни у кого. Но нам нужно максимум несколько сотен запросов за весь хакатон, и этого с запасом хватает.

| Порядок | Модель | Провайдер | Почему | Бесплатный лимит (сверить в кабинете) |
|---|---|---|---|---|
| **LLM_1** | **Gemma 4 31B** (`gemma-4-31b-it`) | Google AI Studio (Gemini API) | Читает картинки, бесплатно, не локальная, OpenAI-совместимый адрес | ~15 запросов/мин, ~1 500/день |
| LLM_2 | Gemini Flash (`gemini-flash-latest`) | Тот же ключ AI Studio | Тоже читает картинки, свой отдельный лимит | смотреть в AI Studio |
| LLM_3 (по желанию) | Gemma 4 31B `:free` | OpenRouter | Другой провайдер: если Google лежит. Не обязателен | 50/день, 1 000/день после пополнения на $10 |

Лимиты взяты из сторонних обзоров ([free-llm.com](https://free-llm.com/models/google-ai-studio/gemma-4-31b-it), [OpenRouter](https://openrouter.ai/google/gemma-4-31b-it:free), [обзор OpenRouter](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/)). Точные цифры видны только в кабинете AI Studio, сверь их. Названия моделей тоже проверь в списке моделей в день запуска. Groq оставь запасным только для текста: его бесплатные модели с картинками не проверяли.

```bash
# .env.example — ключи пустые, настоящие только в .env на сервере
# 1. Google AI Studio: aistudio.google.com → Get API key
LLM_1_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_1_API_KEY=
LLM_1_MODEL=gemma-4-31b-it
# 2. Тот же ключ, другая модель (отдельный лимит)
LLM_2_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_2_API_KEY=
LLM_2_MODEL=gemini-flash-latest
# 3. По желанию. OpenRouter: openrouter.ai → Keys
LLM_3_BASE_URL=https://openrouter.ai/api/v1
LLM_3_API_KEY=
LLM_3_MODEL=google/gemma-4-31b-it:free
# Кеш ответов AI: только на сервере и только если все провайдеры не ответили
DEMO_CACHE=fallback
# Stripe в тестовом режиме (Should): dashboard.stripe.com → Developers → API keys, только sk_test_
STRIPE_SECRET_KEY=
```

**Что из AI не попадает в репозиторий:** ключи (только `.env` на сервере), сами модели (внешние API), кеш ответов (`demo-cache.json` в `.gitignore`). Без ключей продукт работает: `/api/read-plan` отвечает `no_keys`, фронт показывает «AI reading is off — enter the plan manually», ручной ввод работает. В README — какие ключи нужны и где их взять.

## Твои следующие задачи
B3 логика + Payday Sync (`lib/plan.ts`, план — на Fable), параллельно B6 отзывы + бенчмарки RevenueCat/Adapty отдельной сессией, B3t золотые тесты + GitHub Action, B4 AI по-настоящему (бюджет 10 с), B5 хранилище + `.ics` со ссылками check-in + `/api/health` + деплой со smoke-проверкой, B7 ревью дизайна №1 + прогон жюри №1, B-S Stripe в тестовом режиме (Should), КТ2 в 05:00, B8–B9 прогоны и жюри №2, B10 README + чистка (без видео), B11 сдача. Время и модели — в `TASKS.md`.
