// Server only. A small in-memory rate limit for the two AI routes, so nobody can burn the free
// AI quota on demo day. Sliding window: at most `limit` requests in any `windowMs` per key (IP).
// It lives in one server instance's memory: on Vercel each warm instance counts on its own, so it caps
// bursts from one client rather than enforcing a global quota. No storage, no extra service.

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

/** For an AI route: null when the request may go on, otherwise the 429 to return. Each route has its own budget. */
export function limitAiRoute(route: "read-plan" | "dispute", request: Request): Response | null {
  let limiter = limiters.get(route);
  if (!limiter) limiters.set(route, (limiter = createRateLimiter()));
  const result = limiter.check(clientIp(request));
  return result.ok ? null : rateLimitedResponse(result.retryAfter);
}
