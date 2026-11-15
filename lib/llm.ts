// Server only. One OpenAI-compatible client for every provider slot in .env.
// Each slot lists its models in order: LLM_n_MODEL=fast-model,backup-model,last-resort.
// A model that answers 429 (free quota used up), 404 (retired) or 5xx (overloaded) is skipped at once
// and rests for a while, so the next request goes straight to the next model in the list.
// LLM_1 starts at once, LLM_2 joins after 4 s, LLM_3 (optional) after 6 s; the first answer that passes
// `accept` wins. Budget: 10 s, stretched to 40 s once a slot falls back to its last model
// (Gemma 4 31B: slow, but by far the largest free quota).
// Keys are read here and never sent to the browser (no NEXT_PUBLIC_).

export type Provider = { name: string; baseUrl: string; apiKey: string; models: string[] };

export type ChatMessage = {
  role: "system" | "user";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
};

export const BUDGET_MS = 10_000;
export const LAST_RESORT_BUDGET_MS = 40_000;
const START_AT_MS = [0, 4_000, 6_000];

export function providers(): Provider[] {
  const out: Provider[] = [];
  for (const i of [1, 2, 3]) {
    const baseUrl = process.env[`LLM_${i}_BASE_URL`];
    const apiKey = process.env[`LLM_${i}_API_KEY`];
    const models = (process.env[`LLM_${i}_MODEL`] ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (baseUrl && apiKey && models.length > 0) out.push({ name: `llm${i}`, baseUrl, apiKey, models });
  }
  return out;
}

/** For /api/health: which providers are configured. Never the keys. */
export function providerStatus(): Record<"llm1" | "llm2" | "llm3", boolean> {
  const names = new Set(providers().map((p) => p.name));
  return { llm1: names.has("llm1"), llm2: names.has("llm2"), llm3: names.has("llm3") };
}

// Models that ran out of free quota or are down, and until when we skip them (per server instance).
const resting = new Map<string, number>();
const restKey = (p: Provider, model: string) => `${p.baseUrl}|${model}`;

function restFor(status: number, body: string): number {
  if (status === 429) {
    if (/PerDay/i.test(body)) return 60 * 60_000; // daily free quota is gone: look again in an hour
    const seconds = Number(body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/)?.[1]);
    return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 120) * 1000 : 60_000;
  }
  if (status === 404) return 6 * 60 * 60_000; // retired, or not available to this key
  if (status >= 500) return 30_000; // overloaded
  return 0;
}

/** Models to try now, in order: the ones not resting; if every one rests, the last one anyway. */
function modelsToTry(p: Provider): string[] {
  const now = Date.now();
  const awake = p.models.filter((m) => (resting.get(restKey(p, m)) ?? 0) <= now);
  return awake.length > 0 ? awake : p.models.slice(-1);
}

async function chat(p: Provider, model: string, messages: ChatMessage[], signal: AbortSignal): Promise<string> {
  const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0 }),
    signal,
  });
  if (!res.ok) {
    const rest = restFor(res.status, await res.text().catch(() => ""));
    if (rest > 0) resting.set(restKey(p, model), Date.now() + rest);
    throw new Error(`${p.name} ${model} answered ${res.status}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${p.name} ${model} returned no text`);
  return text;
}

export class LlmError extends Error {
  constructor(public code: "no_keys" | "unreadable" | "timeout") {
    super(code);
  }
}

/** Time limits for one askFirst call. A caller with a ready fallback (the dispute template) passes a short one. */
export type AskOptions = { budgetMs?: number; lastResortMs?: number };

/**
 * Asks the provider slots with staggered starts and returns the first accepted answer.
 * Inside a slot, a model that fails (quota, retired, overloaded, network) hands over to the next one;
 * a slot whose models all failed starts the next slot at once instead of letting it wait for its turn.
 * `accept` returns the parsed value, or null if the answer is not usable.
 */
export async function askFirst<T>(
  messages: ChatMessage[],
  accept: (text: string) => T | null,
  options: AskOptions = {},
): Promise<T> {
  const budgetMs = options.budgetMs ?? BUDGET_MS;
  const lastResortMs = Math.max(budgetMs, options.lastResortMs ?? LAST_RESORT_BUDGET_MS);
  const list = providers();
  if (list.length === 0) throw new LlmError("no_keys");

  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];
  const startedAt = Date.now();
  let deadline: ReturnType<typeof setTimeout> | undefined;

  try {
    return await new Promise<T>((resolve, reject) => {
      let pending = list.length;
      let answeredBadly = false;
      let stretched = false;
      const started = new Set<number>();

      const setDeadline = (budgetMs: number) => {
        clearTimeout(deadline);
        deadline = setTimeout(() => reject(new LlmError("timeout")), Math.max(0, startedAt + budgetMs - Date.now()));
      };
      const startSlot = (i: number) => {
        if (started.has(i) || controller.signal.aborted) return;
        started.add(i);
        void runSlot(list[i]);
      };
      const slotFailed = (handOver: boolean) => {
        pending -= 1;
        if (pending === 0) return reject(new LlmError(answeredBadly ? "unreadable" : "timeout"));
        // Every model of this slot failed (quota, network): the next slot needn't wait for its start time.
        const next = list.findIndex((_, i) => !started.has(i));
        if (handOver && next !== -1) startSlot(next);
      };

      const runSlot = async (p: Provider) => {
        for (const model of modelsToTry(p)) {
          if (controller.signal.aborted) return;
          const lastResort = p.models.length > 1 && model === p.models[p.models.length - 1];
          if (lastResort && !stretched) {
            stretched = true;
            setDeadline(lastResortMs);
          }
          let text: string;
          try {
            text = await chat(p, model, messages, controller.signal);
          } catch (err) {
            if (!controller.signal.aborted) console.warn(`[llm] ${err instanceof Error ? err.message : err}`);
            continue; // quota, retired model, overload or network: try the next model
          }
          const value = accept(text);
          if (value === null) {
            answeredBadly = true; // the model read it and found no plan; another model would say the same
            return slotFailed(false);
          }
          return resolve(value);
        }
        slotFailed(true);
      };

      setDeadline(budgetMs);
      list.forEach((_, i) => timers.push(setTimeout(() => startSlot(i), START_AT_MS[i] ?? 0)));
    });
  } finally {
    controller.abort();
    timers.forEach(clearTimeout);
    clearTimeout(deadline);
  }
}

/**
 * Pulls the JSON object out of a model answer. Models like to wrap it in ```json,
 * and Gemma writes its reasoning in <thought>…</thought> before the answer.
 */
export function extractJson(text: string): unknown {
  const answer = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
  const end = answer.lastIndexOf("}");
  for (const start of [answer.indexOf("{"), answer.lastIndexOf("{", end)]) {
    if (start === -1 || end <= start) continue;
    try {
      return JSON.parse(answer.slice(start, end + 1));
    } catch {
      // braces inside the reasoning: fall through to the last object
    }
  }
  return null;
}
