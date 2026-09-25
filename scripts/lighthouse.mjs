// Lighthouse, mobile, against the production build: the numbers the site
// quotes about itself. Serves dist/ with `vite preview`, audits each page in
// a fresh profile (a first visit, cold open and all), prints a table, and
// writes src/data/audit.json for the pages that cite it.
//
//   npm run build && npm run audit
//   node scripts/lighthouse.mjs / /receipts/      (just these)
//   node scripts/lighthouse.mjs --no-write        (print only)
//
// Lighthouse itself is fetched with npx on first use; Chrome is Playwright's.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const LIGHTHOUSE = "lighthouse@12";
const PORT = 4180;
const args = process.argv.slice(2);
const write = !args.includes("--no-write");
const pages = args.filter((a) => a.startsWith("/"));
const targets = pages.length ? pages : ["/", "/receipts/", "/craft/"];
const origin = `http://localhost:${PORT}`;

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`vite preview did not come up at ${url}`);
}

// vite preview closes idle keep-alive sockets; a stale one fails the first
// request after a long audit, so a check gets one retry.
async function statusOf(url) {
  try {
    return (await fetch(url)).status;
  } catch {
    return (await fetch(url)).status;
  }
}

const preview = spawn(
  "npx",
  ["vite", "preview", "--port", String(PORT), "--strictPort"],
  { stdio: "ignore" },
);

const work = mkdtempSync(join(tmpdir(), "lighthouse-"));
const results = {};
let version = "";
try {
  await waitForServer(`${origin}/`);
  for (const path of targets) {
    const status = await statusOf(origin + path);
    if (status !== 200) {
      console.log(`${path.padEnd(12)} skipped (HTTP ${status})`);
      continue;
    }
    const out = join(work, "report.json");
    execFileSync(
      "npx",
      [
        "--yes",
        LIGHTHOUSE,
        origin + path,
        "--chrome-flags=--headless=new --no-sandbox",
        "--output=json",
        `--output-path=${out}`,
        "--quiet",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--form-factor=mobile",
      ],
      {
        env: { ...process.env, CHROME_PATH: chromium.executablePath() },
        stdio: ["ignore", "ignore", "inherit"],
      },
    );
    const report = JSON.parse(readFileSync(out, "utf8"));
    version = report.lighthouseVersion;
    const score = (id) => Math.round((report.categories[id]?.score ?? 0) * 100);
    const audit = (id) => report.audits[id]?.numericValue ?? null;
    results[path] = {
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
      fcpMs: Math.round(audit("first-contentful-paint")),
      lcpMs: Math.round(audit("largest-contentful-paint")),
      tbtMs: Math.round(audit("total-blocking-time")),
      cls: Number((audit("cumulative-layout-shift") ?? 0).toFixed(3)),
      speedIndexMs: Math.round(audit("speed-index")),
    };
    const r = results[path];
    console.log(
      `${path.padEnd(12)} perf ${r.performance}  a11y ${r.accessibility}  best ${r.bestPractices}  seo ${r.seo}  ` +
        `FCP ${r.fcpMs} ms  LCP ${r.lcpMs} ms  TBT ${r.tbtMs} ms  CLS ${r.cls}  SI ${r.speedIndexMs} ms`,
    );
  }
} finally {
  preview.kill();
  rmSync(work, { recursive: true, force: true });
}

if (write && Object.keys(results).length) {
  const file = "src/data/audit.json";
  const audit = {
    measuredAt: new Date().toISOString().slice(0, 10),
    tool: `Lighthouse ${version}`,
    formFactor: "mobile, simulated throttling",
    pages: results,
  };
  writeFileSync(file, JSON.stringify(audit, null, 2) + "\n");
  console.log(`wrote ${file}`);
}
