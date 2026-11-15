// The demo path, as the jury clicks it. Golden numbers: demo_inputs.md ("Tonight sample"), checked on Nov 15, 2026.
// The browser clock is set to that day, so the same numbers come out whenever the test runs.
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-15T19:00:00-08:00"));
});

test("landing → sample data → Tonight names the payment that won't clear and what to do", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try it with sample data" }).first().click();
  await expect(page).toHaveURL(/\/tonight/);
  await expect(page.getByRole("heading", { name: "Zip won't clear on Fri, Dec 4." })).toBeVisible();
  await expect(page.getByText("you'd be $12.50 short").first()).toBeVisible();
  await expect(page.getByText("Move $25.00").first()).toBeVisible();
  await expect(page.getByText("Sample data").first()).toBeVisible();
});

test("Forecast agrees with Tonight: lowest point $12.50 short on the morning of Fri, Dec 4", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try it with sample data" }).first().click();
  await page.goto("/timeline");
  await expect(page.getByText("$12.50 short on Fri, Dec 4").first()).toBeVisible();
});

test("Before you buy: $240 in 4 is not now, and names the Klarna payment it would knock over", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try it with sample data" }).first().click();
  await page.goto("/check");
  const price = page.getByRole("textbox").first();
  await price.fill("240");
  await page.getByRole("button", { name: "Check it" }).click();
  await expect(page.getByText("Not right now").first()).toBeVisible();
  await expect(page.getByText("Klarna · Target on Thu, Dec 3 would be $52.50 short that morning.")).toBeVisible();
  // The paywall offers both prices (payment itself is not started: no Stripe call in this test).
  await expect(page.getByText("$4.99 a month").first()).toBeVisible();
});

test("Plans: the same sample, with payment history on the cards", async ({ page }) => {
  await page.goto("/plans");
  await page.getByRole("button", { name: "Try it with sample data" }).first().click();
  await expect(page.getByText(/of 4 paid/).first()).toBeVisible();
});
