// The numbers the site quotes about itself, measured rather than typed:
//
//   * Lighthouse, mobile, on each page of the production build, each run in
//     a fresh profile (a first visit, cold open and all), median of five;
//   * how many unit tests and browser runs there are;
//   * what each page ships: gzipped JavaScript, and the HTML with its
//     inlined CSS; and the ledger's and the fonts' weight.
//
// Serves dist/ with Vite's preview server, prints a table, and writes
// src/data/audit.json, which /craft/ reads (with the date it was taken).
//
//   npm run build && npm run audit
//   node scripts/audit.mjs / /receipts/      (just these pages)
//   node scripts/audit.mjs --no-write        (print only)
//   node scripts/audit.mjs --runs=3          (median of 3; default 5)
//
// Lighthouse itself is fetched with npx on first use; Chrome is Playwright's.
import { execFile, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const LIGHTHOUSE = "lighthouse@12";
const PORT = 4180;
const args = process.argv.slice(2);
const write = !args.includes("--no-write");
const pages = args.filter((a) => a.startsWith("/"));
const RUNS = Math.max(
  1,
  Number(args.find((a) => a.startsWith("--runs="))?.slice(7) ?? 5),
);
const targets = pages.length ? pages : ["/", "/receipts/", "/craft/"];
const origin = `http://localhost:${PORT}`;
const work = mkdtempSync(join(tmpdir(), "audit-"));

const run = promisify(execFile);
// Vite's preview server sets NODE_ENV=production on this process; the test
// runners are started with the environment as it was before that.
const baseEnv = { ...process.env };
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;

// What a page ships before it can run: its HTML (CSS inlined) and every
// script it loads or preloads.
function shipped(path) {
  const file = join("dist", path, "index.html");
  if (!existsSync(file)) return null;
  const html = readFileSync(file);
  const scripts = new Set(
    [...html.toString().matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map(
      (m) => m[1],
    ),
  );
  let js = 0;
  for (const src of scripts) js += gz(readFileSync(join("dist", src)));
  return { htmlGzipKb: kb(gz(html)), jsGzipKb: kb(js) };
}

// The two payloads the case study names: the ledger as it goes over the
// wire, and the self-hosted fonts.
function assets() {
  const ledger = join("dist", "receipts", "data.json");
  const fonts = join("dist", "fonts");
  return {
    ledgerGzipKb: existsSync(ledger) ? kb(gz(readFileSync(ledger))) : null,
    fontsKb: existsSync(fonts)
      ? kb(
          readdirSync(fonts)
            .filter((f) => f.endsWith(".woff2"))
            .reduce((sum, f) => sum + statSync(join(fonts, f)).size, 0),
        )
      : null,
  };
}

function countTests() {
  const out = join(work, "vitest.json");
  execFileSync("npx", ["vitest", "list", `--json=${out}`], {
    stdio: "ignore",
    env: baseEnv,
  });
  const unit = JSON.parse(readFileSync(out, "utf8")).length;
  const list = execFileSync("npx", ["playwright", "test", "--list"], {
    encoding: "utf8",
    env: baseEnv,
  });
  const match = list.match(/Total: (\d+) tests? in (\d+) files?/);
  return {
    unit,
    browserRuns: match ? Number(match[1]) : null,
    browserFiles: match ? Number(match[2]) : null,
  };
}

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return;
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

// In-process, so closing it is certain: a `vite preview` child started
// through npx outlives a kill of the npx wrapper and keeps the port.
const server = await preview({
  preview: { port: PORT, strictPort: true, open: false },
  logLevel: "silent",
});

// One Lighthouse run, mobile, in a fresh profile: a first visit.
async function lighthouse(url) {
  const out = join(work, "report.json");
  // Asynchronously: the preview server runs in this process and must keep
  // answering while Lighthouse loads the page.
  await run(
    "npx",
    [
      "--yes",
      LIGHTHOUSE,
      url,
      "--chrome-flags=--headless=new --no-sandbox",
      "--output=json",
      `--output-path=${out}`,
      "--quiet",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--form-factor=mobile",
    ],
    {
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const report = JSON.parse(readFileSync(out, "utf8"));
  version = report.lighthouseVersion;
  const score = (id) => Math.round((report.categories[id]?.score ?? 0) * 100);
  const metric = (id) => report.audits[id]?.numericValue ?? null;
  return {
    performance: score("performance"),
    accessibility: score("accessibility"),
    bestPractices: score("best-practices"),
    seo: score("seo"),
    fcpMs: Math.round(metric("first-contentful-paint")),
    lcpMs: Math.round(metric("largest-contentful-paint")),
    tbtMs: Math.round(metric("total-blocking-time")),
    cls: Number((metric("cumulative-layout-shift") ?? 0).toFixed(3)),
    speedIndexMs: Math.round(metric("speed-index")),
  };
}

const results = {};
const spread = {};
let version = "";
try {
  await waitForServer(`${origin}/`);
  for (const path of targets) {
    const status = await statusOf(origin + path);
    if (status !== 200) {
      console.log(`${path.padEnd(12)} skipped (HTTP ${status})`);
      continue;
    }
    // Lighthouse varies from run to run (host load moves blocking time, and
    // the floor's largest paint is timed by the cold open's own clock), so
    // each page is run several times and the median run is kept whole.
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await lighthouse(origin + path));
    runs.sort((a, b) => a.performance - b.performance || b.lcpMs - a.lcpMs);
    results[path] = {
      ...runs[Math.floor((runs.length - 1) / 2)],
      ...shipped(path),
    };
    spread[path] = runs.map((r) => r.performance);
    const r = results[path];
    console.log(
      `${path.padEnd(12)} perf ${r.performance} (runs: ${spread[path].join(", ")})  a11y ${r.accessibility}  best ${r.bestPractices}  seo ${r.seo}  ` +
        `LCP ${r.lcpMs} ms  TBT ${r.tbtMs} ms  CLS ${r.cls}  JS ${r.jsGzipKb} KB gz`,
    );
  }
} finally {
  await server.close();
}

const tests = countTests();
console.log(
  `tests       ${tests.unit} unit, ${tests.browserRuns} browser runs in ${tests.browserFiles} files`,
);
rmSync(work, { recursive: true, force: true });

if (write && Object.keys(results).length) {
  const file = "src/data/audit.json";
  // A run over some of the pages replaces those and keeps the others.
  const previous = existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8")).pages
    : {};
  const audit = {
    measuredAt: new Date().toISOString().slice(0, 10),
    tool: `Lighthouse ${version}`,
    formFactor: "mobile, simulated throttling",
    runs: RUNS,
    pages: pages.length ? { ...previous, ...results } : results,
    tests,
    assets: assets(),
  };
  writeFileSync(file, JSON.stringify(audit, null, 2) + "\n");
  console.log(`wrote ${file}`);
}
