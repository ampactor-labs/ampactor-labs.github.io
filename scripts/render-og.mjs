#!/usr/bin/env node
// Render the social card from the real page: the cabinet on its title card.
//
//   npx vite build && npx vite preview --port 4173 &   # serve the build
//   node scripts/render-og.mjs                         # writes public/og-home.png
//
// The card is the machine as a first visitor sees it once the boot has run,
// standing in the dark with the name up. Re-run it when the title card changes; the PNG is
// committed because the deploy has no browser.

/* global localStorage, document */
// (the two callbacks below run inside the page, not in Node)

import { chromium } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.OG_URL ?? "http://localhost:4173/";
const out = join(ROOT, "public/og-home.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  // The card's own size: the console (900 wide) centred in the dark.
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  // Holds the title card still and turns the CRT's flicker off.
  reducedMotion: "reduce",
  ignoreHTTPSErrors: true,
});
// A first visit, so the card asks the question a stranger sees; under reduced
// motion the boot still prints, so the title card is up within a few seconds.
await page.goto(url);
await page.waitForSelector('[data-testid="attract-screen"][data-frame="title"]', {
  timeout: 20_000,
});
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
console.log(`render-og: wrote ${out}`);
