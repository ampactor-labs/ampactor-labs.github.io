import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
    // Browser specs belong to Playwright (playwright.config.ts).
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
