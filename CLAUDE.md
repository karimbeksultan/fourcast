# Fourcast — правила для AI-сессий

Сначала прочитай `BRIEF.md` и свою строку в `TASKS.md` (Бексултан — ещё `TASKS_Beksultan.md`). Одна задача — одна сессия.

## Правила
- **Хозяева файлов** (подробно в `TASKS.md`): Аят — `app/**/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/**`, `DESIGN.md`; Бексултан — `lib/**`, `app/api/**`, `scripts/**`, конфиги, `README.md`. Чужие файлы не трогаем.
- **Фронт берёт данные только через контракт** (`lib/types.ts`, функции `lib/plan.ts`, `lib/sample.ts`, `lib/storage.ts`, `lib/ics.ts`, `lib/image.ts`, `/api/read-plan`). Деньги на фронте не считаем, в AI напрямую не ходим. Сигнатуры меняем только вдвоём.
- **Даты** — строки `YYYY-MM-DD` (`lib/dates.ts`), **суммы** — целые центы, форматирует только UI (`formatUSD`). `today` берём в браузере (`todayISO()`) и передаём в функции.
- localStorage читаем после монтирования (`useEffect`). Битые данные `loadState()` сбрасывает сам.
- Цвета и шрифты только из темы (`app/globals.css`), без hex в компонентах. Тексты экранов из `DESIGN.md`, без lorem ipsum. Иконки Lucide, без эмодзи и AI-картинок.
- У каждого экрана есть состояния загрузки, пусто и ошибка. Нерабочие кнопки прячем. Образец данных подписан «Sample data».
- AI только через `lib/llm.ts`. Ключи только в `.env` на сервере, никаких `NEXT_PUBLIC_`.
- Тесты — только `lib/plan.test.ts` (`npm test`) и один GitHub Action. Поменял расчёт — обнови тест и `demo_inputs.md`.
- **Next.js 16.4 с `cacheComponents`** отличается от того, что ты помнишь. Перед кодом про роутинг, кэш или route handlers читай `node_modules/next/dist/docs/`. В GET route handler, который читает env или время, вызывай `await connection()`.
- Маленькие коммиты, только от своего имени, без `Co-Authored-By`. Без сабагентов. В конце сессии — своя строка в `TASKS.md` и «Решения» в `BRIEF.md`.

## Карта кода
- `lib/types.ts` — контракт фронт ↔ бэк
- `lib/plan.ts` — лента, статус, проверка покупки, `fitsByDay`, лучший день, Payday Sync
- `lib/plan.test.ts` — золотые числа демо и крайние случаи
- `lib/dates.ts` — даты без часовых поясов, `formatUSD`, `formatShort`
- `lib/sample.ts` — образец данных и текст Klarna для демо (от сегодняшней даты)
- `lib/storage.ts` — localStorage со схемой (`lib/schema.ts`, zod)
- `lib/ics.ts` — календарь: напоминание накануне и ссылка `/?due=`
- `lib/image.ts` — ужать скриншот до 1280 px в браузере
- `lib/llm.ts`, `lib/read-plan.ts` — AI: бюджет 10 с, Gemma → Gemini Flash → OpenRouter
- `app/api/read-plan`, `app/api/health` — единственный сервер
- `app/page.tsx` — пока демо-страница каркаса, A3 заменяет её экраном `/`
- Деплой — Vercel (push в `main` = прод); `scripts/smoke.mjs` (`npm run smoke -- <url>`) — проверка после деплоя
