// Server only. One OpenAI-compatible client for every provider in .env:
// LLM_1 starts at once, LLM_2 joins after 4 s, LLM_3 (optional) after 6 s.
// The first answer that passes `accept` wins; everything stops at 10 s.
// Keys are read here and never sent to the browser (no NEXT_PUBLIC_).

export type Provider = { name: string; baseUrl: string; apiKey: string; model: string };

export type ChatMessage = {
  role: "system" | "user";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
};

export const BUDGET_MS = 10_000;
const START_AT_MS = [0, 4_000, 6_000];

export function providers(): Provider[] {
  const out: Provider[] = [];
  for (const i of [1, 2, 3]) {
    const baseUrl = process.env[`LLM_${i}_BASE_URL`];
    const apiKey = process.env[`LLM_${i}_API_KEY`];
    const model = process.env[`LLM_${i}_MODEL`];
    if (baseUrl && apiKey && model) out.push({ name: `llm${i}`, baseUrl, apiKey, model });
  }
  return out;
}

/** For /api/health: which providers are configured. Never the keys. */
export function providerStatus(): Record<"llm1" | "llm2" | "llm3", boolean> {
  const names = new Set(providers().map((p) => p.name));
  return { llm1: names.has("llm1"), llm2: names.has("llm2"), llm3: names.has("llm3") };
}

async function chat(p: Provider, messages: ChatMessage[], signal: AbortSignal): Promise<string> {
  const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.apiKey}` },
    body: JSON.stringify({ model: p.model, messages, temperature: 0 }),
    signal,
  });
  if (!res.ok) throw new Error(`${p.name} answered ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${p.name} returned no text`);
  return text;
}

export class LlmError extends Error {
  constructor(public code: "no_keys" | "unreadable" | "timeout") {
    super(code);
  }
}

/**
 * Asks the providers with staggered starts and returns the first accepted answer.
 * `accept` returns the parsed value, or null if the answer is not usable.
 */
export async function askFirst<T>(messages: ChatMessage[], accept: (text: string) => T | null): Promise<T> {
  const list = providers();
  if (list.length === 0) throw new LlmError("no_keys");

  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];

  try {
    return await new Promise<T>((resolve, reject) => {
      let pending = list.length;
      let answeredBadly = false;
      const fail = () => {
        pending -= 1;
        if (pending === 0) reject(new LlmError(answeredBadly ? "unreadable" : "timeout"));
      };

      timers.push(setTimeout(() => reject(new LlmError("timeout")), BUDGET_MS));
      list.forEach((p, i) => {
        timers.push(
          setTimeout(() => {
            if (controller.signal.aborted) return;
            chat(p, messages, controller.signal)
              .then((text) => {
                const value = accept(text);
                if (value === null) {
                  answeredBadly = true;
                  fail();
                } else resolve(value);
              })
              .catch(fail);
          }, START_AT_MS[i] ?? 0),
        );
      });
    });
  } finally {
    controller.abort();
    timers.forEach(clearTimeout);
  }
}

/** Pulls the first JSON object out of a model answer (models like to wrap it in ```json). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
