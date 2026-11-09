import path from "node:path";

import { chromium, type BrowserContext, type Page } from "playwright-core";

/**
 * Launches the locally installed Google Chrome (no browser download) with a
 * dedicated, persistent profile. Sessions you open there (e.g. a manual login)
 * survive between runs, so bots can reuse them.
 */
export const PROFILE_DIR = path.resolve(process.cwd(), ".engine-profile");

export interface BrowserSession {
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

export async function openBrowser(): Promise<BrowserSession> {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: process.env.ENGINE_BROWSER_CHANNEL ?? "chrome",
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: ["--no-first-run", "--no-default-browser-check"],
  });
  const page = context.pages()[0] ?? (await context.newPage());
  return {
    context,
    page,
    close: async () => {
      await context.close().catch(() => undefined);
    },
  };
}
