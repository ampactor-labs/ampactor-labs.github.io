import { defineConfig, devices } from "@playwright/test";

// Browser checks against the production build, served by `vite preview`.
// `npm run e2e` locally; CI runs the same after `playwright install`.
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    // The dev sandbox proxies HTTPS through its own CA; fonts would otherwise
    // fail to load there. No effect on a normal machine or CI.
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: "npx vite build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        colorScheme: "dark",
      },
    },
    {
      name: "phone",
      use: { ...devices["Pixel 7"], colorScheme: "dark" },
    },
  ],
});
