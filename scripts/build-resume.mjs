#!/usr/bin/env node
// Render public/resume.html from src/data/resume.json.
//
// The résumé is the one page that must work with no JavaScript, print to a
// clean sheet, and read well to an ATS, so it stays a static file. It used to
// be kept in sync with the site by hand; now the data is written once and
// this renders it. Runs as part of `npm run build` and on demand:
//
//   node scripts/build-resume.mjs [--check]
//
// --check exits 1 if the rendered file would change (for CI).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src/data/resume.json");
const OUT = join(ROOT, "public/resume.html");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const host = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const span = (role) =>
  `${role.start}–${role.end ?? "present"}${role.note ? ` (${esc(role.note)})` : ""}`;

export function render(r) {
  const roles = r.experience
    .map(
      (role) => `
      <article class="job">
        <div class="head">
          <span class="name">${esc(role.role)}, ${esc(role.org)}</span>
          <span class="when">${[role.location, span(role)].filter(Boolean).map(esc).join(" · ")}</span>
        </div>
        <ul>
          ${role.bullets.map((b) => `<li>${esc(b)}</li>`).join("\n          ")}
        </ul>
      </article>`,
    )
    .join("\n");

  const work = r.selectedWork
    .map(
      (w) => `
      <article class="job">
        <div class="head">
          <span class="name"><a href="${esc(w.url)}">${esc(w.name)}</a></span>
          <span class="stack">${esc(w.stack)}</span>
        </div>
        <div class="detail">${esc(w.what)}</div>
      </article>`,
    )
    .join("\n");

  return `<!doctype html>
<!-- Generated from src/data/resume.json by scripts/build-resume.mjs. Edit the JSON. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Résumé · ${esc(r.name)}, ${esc(r.title)}</title>
  <meta name="description" content="${esc(r.summary)}" />
  <link rel="canonical" href="${esc(r.site)}/resume.html" />
  <link rel="icon" href="/favicon.ico" />
  <style>
    :root {
      --ink: #1a1a1a;
      --muted: #555;
      --faint: #888;
      --teal: #00708a;
      --rule: #e2e2e2;
      --bg: #ffffff;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--bg);
      color: var(--ink);
      font-family: "Helvetica Neue", Helvetica, Arial, "Segoe UI", system-ui, sans-serif;
      line-height: 1.5;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }
    .sheet { max-width: 800px; margin: 0 auto; padding: 48px 40px 64px; }
    a { color: var(--teal); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .topbar { font-size: 12px; margin-bottom: 28px; display: flex; gap: 14px; flex-wrap: wrap; }
    .topbar a, .printlink { color: var(--faint); }
    .printlink { appearance: none; border: 0; background: none; font: inherit; cursor: pointer; padding: 0; }
    .printlink:hover { text-decoration: underline; }
    header h1 { font-size: 30px; letter-spacing: 0.01em; font-weight: 700; }
    header .role { color: var(--teal); font-weight: 600; font-size: 14px; letter-spacing: 0.02em; margin-top: 4px; }
    header .contact { color: var(--muted); font-size: 12.5px; margin-top: 8px; line-height: 1.7; }
    header .contact a { color: var(--muted); }
    .summary { margin-top: 18px; font-size: 14.5px; color: #2a2a2a; max-width: 72ch; }
    section { margin-top: 30px; }
    h2 {
      font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--teal);
      border-bottom: 2px solid var(--rule); padding-bottom: 6px; margin-bottom: 14px;
    }
    .skills { color: var(--muted); font-size: 13px; line-height: 1.8; }
    .job { margin-bottom: 16px; }
    .job .head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
    .job .name { font-weight: 700; font-size: 14.5px; }
    .job .when, .job .stack { color: var(--faint); font-size: 11.5px; white-space: nowrap; }
    .job ul { margin: 4px 0 0 18px; color: var(--muted); font-size: 13px; }
    .job li { margin: 2px 0; }
    .job .detail { color: var(--muted); font-size: 13px; margin-top: 2px; }
    .before { color: var(--muted); font-size: 13px; }
    footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid var(--rule); font-size: 11px; color: var(--faint); }
    @media print {
      @page { margin: 14mm; }
      body { font-size: 11pt; }
      .sheet { padding: 0; max-width: none; }
      .topbar, .print-hide { display: none; }
      a { color: var(--ink); }
      section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="topbar print-hide">
      <a href="/">&larr; ampactor.dev</a>
      <a href="/arcade/">the arcade</a>
      <button type="button" class="printlink" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <header>
      <h1>${esc(r.name)}</h1>
      <div class="role">${esc(r.title)}</div>
      <div class="contact">
        ${esc(r.location)} &nbsp;·&nbsp;
        <a href="mailto:${esc(r.email)}">${esc(r.email)}</a>
        &nbsp;·&nbsp; ${esc(r.phone)} &nbsp;·&nbsp;
        <a href="${esc(r.site)}">${esc(host(r.site))}</a><br />
        <a href="${esc(r.github)}">${esc(host(r.github))}</a>
        &nbsp;·&nbsp;
        <a href="${esc(r.linkedin)}">${esc(host(r.linkedin))}</a>
      </div>
      <p class="summary">${esc(r.summary)}</p>
    </header>

    <section>
      <h2>Skills</h2>
      <p class="skills">${r.skills.map(esc).join(" · ")}</p>
    </section>

    <section>
      <h2>Experience</h2>
      ${roles}
    </section>

    <section>
      <h2>Selected public work</h2>
      ${work}
    </section>

    <section>
      <h2>Background</h2>
      <p class="before">${esc(r.before)}</p>
    </section>

    <footer>
      References on request. Code and live projects are at <a href="/">ampactor.dev</a>.
    </footer>
  </div>
</body>
</html>
`;
}

if (process.argv[1]?.endsWith("build-resume.mjs")) {
  const html = render(JSON.parse(readFileSync(DATA, "utf8")));
  if (process.argv.includes("--check")) {
    const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (current !== html) {
      console.error("build-resume: public/resume.html is stale; run `npm run resume:build`");
      process.exit(1);
    }
    console.log("build-resume: up to date");
  } else {
    writeFileSync(OUT, html);
    console.log("build-resume: wrote public/resume.html");
  }
}
