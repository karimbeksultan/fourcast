import { defineConfig, devices } from "@playwright/test";

// End-to-end check of the demo path in a real browser: npm run test:e2e (or with E2E_URL=http://localhost:3000).
// It reads the live site by default and makes no AI or payment calls, so it is safe to run any time.
// E2E_CHANNEL=chrome uses the installed Google Chrome instead of the downloaded Chromium.
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_URL ?? "https://fourcast-zimran.vercel.app",
    // The sample is built from "today"; pin the browser clock to the demo day so the golden numbers hold.
    timezoneId: "America/Los_Angeles",
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], channel: process.env.E2E_CHANNEL ?? "chromium" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: process.env.E2E_CHANNEL ?? "chromium", viewport: { width: 1440, height: 900 } } },
  ],
});
