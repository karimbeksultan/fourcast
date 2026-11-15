// Smoke check after every deploy: npm run smoke -- https://your-app.vercel.app
// Pages answer 200 with the security headers, /api/health says ok, /api/read-plan refuses an empty or null body,
// /api/dispute an empty one. No AI call is made and only 3 AI-route requests are sent, far below the 30-a-minute limit.
const base = (process.argv[2] || process.env.SMOKE_URL || "").replace(/\/+$/, "");
if (!base) {
  console.error("Usage: npm run smoke -- https://your-app.vercel.app");
  process.exit(2);
}

const TIMEOUT_MS = 15_000;
let failed = 0;

async function check(name, run) {
  try {
    const note = await run();
    console.log(`ok    ${name}${note ? `  (${note})` : ""}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}  ${err.message}`);
  }
}

async function get(path) {
  const res = await fetch(base + path, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  return res;
}

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const pages = ["/", "/tonight", "/plans", "/timeline", "/check", "/dispute", "/pricing", "/faq", `/?due=${tomorrow}`, `/plans?due=${tomorrow}`];
for (const path of pages) {
  await check(`GET ${path}`, () => get(path).then(() => ""));
}

// Set in next.config.ts for every path.
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "content-security-policy": "frame-ancestors 'none'",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};
await check("security headers on /", async () => {
  const res = await get("/");
  const wrong = Object.entries(SECURITY_HEADERS)
    .filter(([key, value]) => !(res.headers.get(key) ?? "").includes(value))
    .map(([key]) => `${key}: ${res.headers.get(key) ?? "missing"}`);
  if (wrong.length) throw new Error(wrong.join("; "));
  return `${Object.keys(SECURITY_HEADERS).length} headers`;
});

await check("GET /api/health", async () => {
  const body = await (await get("/api/health")).json();
  if (body.ok !== true) throw new Error(`ok is ${body.ok}`);
  return Object.entries(body.providers ?? {})
    .map(([name, on]) => `${name} ${on ? "on" : "off"}`)
    .join(", ");
});

for (const raw of ["{}", "null"]) {
  await check(`POST /api/read-plan with ${raw}`, async () => {
    const res = await fetch(`${base}/api/read-plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await res.json().catch(() => null);
    if (res.status !== 400 || body?.code !== "unreadable") {
      throw new Error(`expected 400 unreadable, got ${res.status} ${JSON.stringify(body)}`);
    }
    return "400 unreadable";
  });
}

await check("POST /api/dispute with an empty body", async () => {
  const res = await fetch(`${base}/api/dispute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.json().catch(() => null);
  if (res.status !== 400 || body?.code !== "bad_request") {
    throw new Error(`expected 400 bad_request, got ${res.status} ${JSON.stringify(body)}`);
  }
  return "400 bad_request";
});

// exitCode, not process.exit(): exiting with fetch sockets still open crashes Node on Windows.
if (failed) {
  console.log(`\n${failed} check(s) failed. Roll back: Vercel → Deployments → previous one → Instant Rollback.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll checks passed on ${base}`);
}
