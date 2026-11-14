// Smoke check after every deploy: npm run smoke -- https://your-app.vercel.app
// Pages answer 200, /api/health says ok, /api/read-plan and /api/dispute refuse an empty body.
// No AI call is made, so it costs no model quota.
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
const pages = ["/", "/plans", "/timeline", "/check", "/dispute", "/pricing", "/faq", `/?due=${tomorrow}`, `/plans?due=${tomorrow}`];
for (const path of pages) {
  await check(`GET ${path}`, () => get(path).then(() => ""));
}

await check("GET /api/health", async () => {
  const body = await (await get("/api/health")).json();
  if (body.ok !== true) throw new Error(`ok is ${body.ok}`);
  return Object.entries(body.providers ?? {})
    .map(([name, on]) => `${name} ${on ? "on" : "off"}`)
    .join(", ");
});

await check("POST /api/read-plan with an empty body", async () => {
  const res = await fetch(`${base}/api/read-plan`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.json().catch(() => null);
  if (res.status !== 400 || body?.code !== "unreadable") {
    throw new Error(`expected 400 unreadable, got ${res.status} ${JSON.stringify(body)}`);
  }
  return "400 unreadable";
});

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
