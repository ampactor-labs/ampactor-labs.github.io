#!/usr/bin/env node
// Derive project card content from the repos' own READMEs.
//
// The README is the source of truth for what a project *is*; this file owns
// only how it looks. Content fields (title, desc, highlights, operatorNote,
// status) come from the repo. Presentation fields (color, icon, category,
// order) stay in src/data/projects.js, because design does not go stale and
// content does — every drift this site has shipped was a content-field drift.
//
// A repo participates only if its README follows the house architecture spec
// (~/.claude/skills/prose/readme-architecture.md): an H1, a lead paragraph, a
// **Status:** line, and named `## Measured` / `## Weak spots` sections. Repos
// that do not conform keep their hand-written entry untouched, so this can be
// rolled out one README at a time.
//
//   node scripts/sync-readmes.mjs [--offline] [--check]
//
// --offline  read from ~/Projects/<repo>/README.md instead of the network
// --check    exit 1 if the generated file would change (for CI)

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/data/readme-content.generated.json");
const ORG = "ampactor-labs";

// id -> repo. Only ids listed here are synced; everything else keeps its
// hand-written entry.
const REPOS = {
  turbosort: "turbosort",
  landed: "landed",
  sonido: "sonido",
};

const args = new Set(process.argv.slice(2));
const OFFLINE = args.has("--offline");
const CHECK = args.has("--check");

async function fetchReadme(repo) {
  if (OFFLINE) {
    const p = join(homedir(), "Projects", repo, "README.md");
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  }
  for (const branch of ["master", "main"]) {
    const url = `https://raw.githubusercontent.com/${ORG}/${repo}/${branch}/README.md`;
    const res = await fetch(url);
    if (res.ok) return res.text();
  }
  return null;
}

const stripMd = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function sectionBody(md, name) {
  const re = new RegExp(`^##\\s+${name}\\s*$`, "im");
  const m = md.match(re);
  if (!m) return "";
  const start = m.index + m[0].length;
  const next = md.slice(start).search(/^##\s+/m);
  return md.slice(start, next === -1 ? undefined : start + next).trim();
}

// The lead paragraph: prose before the first ## that is not a badge, image,
// status line, or fenced block.
function leadParagraph(md) {
  const head = md.split(/^##\s+/m)[0];
  const blocks = head
    .replace(/^#\s+.*$/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const b of blocks) {
    if (/^\[!\[/.test(b) || /^!\[/.test(b)) continue;
    if (/^\*\*Status:/i.test(b)) continue;
    if (/^>/.test(b)) continue;
    return stripMd(b);
  }
  return "";
}

function statusOf(md) {
  const m = md.match(/\*\*Status:\s*([^*]+)\*\*\s*([^\n]*)/i);
  if (!m) return null;
  return {
    label: stripMd(m[1]).replace(/[.,]\s*$/, ""),
    caveat: stripMd(m[2] || "").replace(/^\s*[-–—]\s*/, ""),
  };
}

// Highlights are deliberately NOT extracted. Three attempts at deriving them
// automatically all produced junk: last-column table cells gave "1.86X TS VS
// VORACIOUS" instead of the headline ratio, and sentence-splitting the prose
// gave fragments like "i32 Signed integers XOR the sign bit". A card
// highlight is a punchy phrase written for a card; README prose is written
// for a reader. Those are different jobs, so highlights stay hand-written in
// src/data/projects.js alongside color and icon — presentation, not content.
//
// The three fields below extract deterministically and are the ones that
// actually went stale on this site: what the project is, whether it works,
// and what it is bad at.

// The operator note is the first weakness, which is the house's signature
// move: the loss stated next to the win.
function operatorNoteOf(md) {
  const body = sectionBody(md, "Weak spots");
  if (!body) return "";
  const first = body.split(/\n{2,}/).find((p) => p.trim() && !p.trim().startsWith("|"));
  return first ? stripMd(first) : "";
}

const content = {};
let missing = 0;

for (const [id, repo] of Object.entries(REPOS)) {
  const md = await fetchReadme(repo);
  if (!md) {
    console.warn(`sync-readmes: ${repo}: README unavailable, keeping hand-written entry`);
    missing++;
    continue;
  }
  const status = statusOf(md);
  const desc = leadParagraph(md);
  const operatorNote = operatorNoteOf(md);

  if (!desc || !status) {
    console.warn(`sync-readmes: ${repo}: not conforming (needs a lead paragraph and a **Status:** line)`);
    missing++;
    continue;
  }
  if (!operatorNote) {
    console.warn(`sync-readmes: ${repo}: no '## Weak spots' section; the loss is the point`);
  }
  content[id] = { desc, status: status.label, statusNote: status.caveat, operatorNote };
  console.log(`sync-readmes: ${repo}: ok (${desc.length} char lead, ${operatorNote.length} char note)`);
}

const json = JSON.stringify(content, null, 2) + "\n";

if (CHECK) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== json) {
    console.error("sync-readmes: generated content is stale; run `npm run sync:readmes`");
    process.exit(1);
  }
  console.log("sync-readmes: up to date");
} else {
  writeFileSync(OUT, json);
  console.log(`sync-readmes: wrote ${Object.keys(content).length} entries to ${OUT}`);
}

if (missing && !OFFLINE) process.exitCode = 0; // never fail the build on a missing repo
