import { defineConfig } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end test of the demo walkthrough (the 7 success criteria).
 * Uses the installed Google Chrome (no browser download) against a
 * production build served on its own port.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    locale: "es-CL",
    timezoneId: "America/Santiago",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/dashboard`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
