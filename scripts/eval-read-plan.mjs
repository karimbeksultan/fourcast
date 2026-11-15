// How well AI reads pay-later confirmations: npm run eval:read -- https://your-app.vercel.app
// Sends a few known texts to /api/read-plan and checks the fields that the math depends on.
// It makes real AI calls (one per case, one at a time), so run it by hand, not in CI or on every deploy.
// The same texts and expected results are in demo_inputs.md ("Paste these into Add a plan").
const base = (process.argv[2] || process.env.SMOKE_URL || "").replace(/\/+$/, "");
if (!base) {
  console.error("Usage: npm run eval:read -- https://your-app.vercel.app");
  process.exit(2);
}
const TODAY = process.argv[3] || "2026-11-15";

const cases = [
  {
    name: "Klarna Pay in 4 (the demo text)",
    text: [
      "Klarna",
      "You paid $80.00 at Target",
      "Order total $320.00 · Pay in 4 · placed November 5, 2026",
      "1 of 4 payments made",
      "Next payment: $80.00 on Nov 19, 2026",
      "Then every 2 weeks until paid off",
      "Remaining balance: $240.00",
    ].join("\n"),
    expect: { lender: "Klarna", installment: 8_000, paymentsLeft: 3, nextDue: "2026-11-19", intervalDays: 14 },
  },
  {
    name: "Affirm, 36 monthly payments",
    text: "Affirm. 36 monthly payments of $43.00. Payment 2 of 36 made. Next payment: $43.00 due December 1, 2026",
    expect: { lender: "Affirm", installment: 4_300, paymentsLeft: 34, nextDue: "2026-12-01", intervalDays: 30, totalPayments: 36 },
  },
  {
    name: "Afterpay, short reminder e-mail",
    text: "Afterpay: your payment of $62.50 for Nike is due Fri, Nov 20, 2026. 2 of 4 payments left, every 2 weeks.",
    expect: { lender: "Afterpay", installment: 6_250, paymentsLeft: 2, nextDue: "2026-11-20", intervalDays: 14 },
  },
  {
    name: "Not a pay-later plan",
    text: "Trader Joe's receipt. Bananas $1.29, oat milk $3.49, total $4.78, paid by Visa.",
    expectError: "unreadable",
  },
];

let passed = 0;
const times = [];
for (const c of cases) {
  const started = Date.now();
  let res;
  let body;
  try {
    res = await fetch(`${base}/api/read-plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: c.text, today: TODAY }),
      signal: AbortSignal.timeout(60_000),
    });
    body = await res.json().catch(() => null);
  } catch (err) {
    console.log(`FAIL  ${c.name}  ${err.message}`);
    continue;
  }
  const ms = Date.now() - started;
  times.push(ms);

  let wrong = [];
  if (c.expectError) {
    if (body?.code !== c.expectError) wrong.push(`expected error ${c.expectError}, got ${res.status} ${JSON.stringify(body)}`);
  } else if (!body?.plan) {
    wrong.push(`no plan: ${res.status} ${JSON.stringify(body)}`);
  } else {
    wrong = Object.entries(c.expect)
      .filter(([key, value]) => body.plan[key] !== value)
      .map(([key, value]) => `${key}: expected ${value}, got ${body.plan[key]}`);
  }
  if (wrong.length === 0) passed++;
  console.log(`${wrong.length ? "FAIL" : "ok  "}  ${c.name}  (${ms} ms)${wrong.length ? `  ${wrong.join("; ")}` : ""}`);
}

const sorted = [...times].sort((a, b) => a - b);
const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
console.log(`\n${passed} of ${cases.length} correct, median ${median} ms, slowest ${sorted.at(-1) ?? 0} ms`);
// exitCode, not process.exit(): exiting with fetch sockets still open crashes Node on Windows.
if (passed < cases.length) process.exitCode = 1;
