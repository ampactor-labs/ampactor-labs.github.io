// Renders the built résumé (dist/resume.html) to dist/resume.pdf with
// headless Chromium, so a recruiter can attach a file instead of printing
// one. Runs after `vite build` in the deploy workflow; locally,
// `npm run build && npm run resume:pdf`. Fails if the PDF runs past two
// pages, so the print layout cannot quietly grow.
import { chromium } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");
const html = join(root, "dist", "resume.html");
const out = join(root, "dist", "resume.pdf");
const MAX_PAGES = 2;

if (!existsSync(html)) {
  console.error("dist/resume.html is missing: run `npm run build` first.");
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(html).href, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: out, format: "Letter", printBackground: true });
} finally {
  await browser.close();
}

const pages = (readFileSync(out, "latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`dist/resume.pdf: ${pages} page${pages === 1 ? "" : "s"}`);
if (pages > MAX_PAGES) {
  console.error(`The résumé prints to ${pages} pages; the limit is ${MAX_PAGES}.`);
  process.exit(1);
}
