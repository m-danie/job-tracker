import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Fail the CI build if a test.only is accidentally committed
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Playwright's bundled Chromium doesn't support macOS 13, so local runs
        // drive the installed Google Chrome; CI (Linux) uses the bundled one
        channel: isCI ? undefined : "chrome",
      },
    },
  ],
  webServer: {
    // CI tests the production build; locally, reuse a running `pnpm dev`
    command: isCI ? "pnpm build && pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
