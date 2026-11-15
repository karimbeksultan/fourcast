// Server only. A small in-memory rate limit for the two AI routes, so nobody can burn the free
// AI quota on demo day. Sliding window: at most `limit` requests in any `windowMs` per key (IP).
// With Upstash Redis configured (UPSTASH_REDIS_REST_URL / _TOKEN, or Vercel KV's KV_REST_API_URL / _TOKEN) the count
// is shared by every server instance. Without it, or if Redis is unreachable, each instance counts in its own memory.

/** 30 a minute per IP: the jury and the team share one Wi-Fi on demo day, so never lower. */
export const RATE_LIMIT = 30;
export const RATE_WINDOW_MS = 60_000;
/** Above this many IPs the expired ones are dropped, then the least recently seen, so the Map never grows forever. */
const MAX_KEYS = 5_000;

export type RateResult = { ok: true } | { ok: false; retryAfter: number };

export function createRateLimiter(limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS, maxKeys = MAX_KEYS) {
  // key → times of the requests inside the window, oldest first. Map order = least recently seen first.
  const hits = new Map<string, number[]>();

  const prune = (now: number) => {
    for (const [key, times] of hits) if (times[times.length - 1] <= now - windowMs) hits.delete(key);
    while (hits.size > maxKeys) hits.delete(hits.keys().next().value!);
  };

  return {
    /** Counts one request for `key` and says whether it may go on; `retryAfter` is in whole seconds. */
    check(key: string, now = Date.now()): RateResult {
      const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      hits.delete(key);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > maxKeys) prune(now);
      return { ok: true };
    },
    /** How many keys are kept (for the tests). */
    size: () => hits.size,
  };
}

/** The client's IP: the first address in x-forwarded-for (set by Vercel), then x-real-ip, else "unknown". */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** 429 in the routes' usual JSON shape, with Retry-After. */
export function rateLimitedResponse(retryAfter: number): Response {
  return Response.json(
    { error: "Too many requests. Try again in a minute.", code: "rate_limited" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

const limiters = new Map<string, ReturnType<typeof createRateLimiter>>();

/** Upstash Redis over REST (Vercel Marketplace adds these env vars). Missing → the in-memory limiter. */
function sharedStore(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

/**
 * Shared count across every server instance: a fixed one-minute window per route and IP (INCR + EXPIRE).
 * Returns null when the store can't be reached, so the caller falls back to memory and never blocks a user.
 */
export async function checkShared(key: string, now = Date.now(), limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS): Promise<RateResult | null> {
  const store = sharedStore();
  if (!store) return null;
  const window = Math.floor(now / windowMs);
  const redisKey = `fourcast:rl:${key}:${window}`;
  try {
    const res = await fetch(`${store.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${store.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, String(windowMs)],
      ]),
      signal: AbortSignal.timeout(800),
    });
    if (!res.ok) return null;
    const [incr] = (await res.json()) as { result?: number }[];
    const count = Number(incr?.result);
    if (!Number.isFinite(count)) return null;
    if (count <= limit) return { ok: true };
    return { ok: false, retryAfter: Math.max(1, Math.ceil(((window + 1) * windowMs - now) / 1000)) };
  } catch {
    return null;
  }
}

/**
 * For the AI and checkout routes: null when the request may go on, otherwise the 429 to return.
 * Each route has its own budget. Shared across instances when Upstash Redis is configured, else in memory.
 */
export async function limitAiRoute(
  route: "read-plan" | "dispute" | "checkout" | "checkout-confirm",
  request: Request,
): Promise<Response | null> {
  const ip = clientIp(request);
  const shared = await checkShared(`${route}:${ip}`);
  let result = shared;
  if (!result) {
    let limiter = limiters.get(route);
    if (!limiter) limiters.set(route, (limiter = createRateLimiter()));
    result = limiter.check(ip);
  }
  return result.ok ? null : rateLimitedResponse(result.retryAfter);
}
