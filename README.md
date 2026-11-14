# Fourcast

**See every Pay in 4 before it lands.** Fourcast puts all your Klarna, Afterpay and Affirm payments on one 6-week timeline from your paycheck, tells you before you buy whether a new plan fits, and finds the day to buy so every payment lands on a payday (Payday Sync).

No sign-up: your data stays in your browser.

## Run it
```bash
npm install
npm run dev      # http://localhost:3000
npm test         # golden numbers for the demo, see demo_inputs.md
npm run build
```

Reading screenshots needs a free Google AI Studio key. Copy `.env.example` to `.env` and fill `LLM_1_API_KEY` and `LLM_2_API_KEY`. Without keys everything works except reading screenshots, which falls back to manual entry.

## How it works
- **The math is plain code.** `lib/plan.ts` builds the timeline, checks a purchase and finds Payday Sync. No AI, deterministic, tested in `lib/plan.test.ts`.
- **AI does one thing:** read a pasted confirmation or screenshot into a plan (`/api/read-plan`). Gemma 4 31B and Gemini Flash via Google AI Studio's OpenAI-compatible API share one 10-second budget; OpenRouter is optional.
- **Storage:** `localStorage` with a versioned zod schema. No database, no accounts.

## Key dependencies
Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, zod, Vitest. AI: Google AI Studio (Gemma 4 31B, Gemini Flash), optional OpenRouter.
