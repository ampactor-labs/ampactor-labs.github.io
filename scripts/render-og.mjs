#!/usr/bin/env node
// Render the social card for the floor from the real page.
//
//   npx vite build && npx vite preview --port 4173 &   # serve the build
//   node scripts/render-og.mjs                         # writes public/og-floor.png
//
// The card is the hero as it is: the name, the line of range, and the
// cabinet on PRESS START. Re-run it when the hero changes; the PNG is
// committed because the deploy has no browser.

/* global localStorage, document */
// (the two callbacks below run inside the page, not in Node)

import { chromium } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.OG_URL ?? "http://localhost:4173/";
const out = join(ROOT, "public/og-floor.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  ignoreHTTPSErrors: true,
});
await page.addInitScript(() => localStorage.setItem("ampactor_visited", "1"));
await page.goto(url);
await page.waitForSelector(".crt-screen");
// The attract loop's second frame is PRESS START; hold it there.
await page.waitForSelector('[data-testid="attract-screen"][data-frame="1"]', {
  timeout: 20_000,
});
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: out,
  clip: { x: 0, y: 80, width: 1200, height: 630 },
});
await browser.close();
console.log(`render-og: wrote ${out}`);
