#!/usr/bin/env node
// Derive project card content from the projects' own READMEs.
//
// The README is the source of truth for what a project *is*; projects.js owns
// only how it looks. Content fields (desc, operatorNote, status) come from the
// repo. Presentation fields (color, icon, category, highlights, tagline) stay
// local, because design does not go stale and content does — every drift this
// site has shipped was a content-field drift.
//
// There is no repo list to maintain. Any project in src/data/projects.js with
// a `github:` URL is synced, and a project whose README does not follow the
// house spec (~/.claude/skills/prose/readme-architecture.md) simply keeps its
// hand-written entry. So adding a project is one normal entry in projects.js,
// and improving a README is what makes its card follow along.
//
//   node scripts/sync-readmes.mjs [--offline] [--check] [--report]
//
// --offline  read ~/Projects/<repo>/README.md instead of the network
// --check    exit 1 if the generated file would change (for CI)
// --report   print per-project conformance instead of writing

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECTS = join(ROOT, "src/data/projects.js");
const OUT = join(ROOT, "src/data/readme-content.generated.json");

const args = new Set(process.argv.slice(2));
const OFFLINE = args.has("--offline");
const CHECK = args.has("--check");
const REPORT = args.has("--report");

// projects.js is parsed as text rather than imported: it imports the file this
// script writes, and a cycle at build time is not worth the elegance.
export function projectRepos(source) {
  const out = [];
  const re = /id:\s*"([^"]+)"[\s\S]*?github:\s*(?:"([^"]*)"|null)/g;
  let m;
  while ((m = re.exec(source))) {
    if (!m[2]) continue;
    const repo = m[2].replace(/\/+$/, "").split("/").pop();
    if (repo) out.push({ id: m[1], repo });
  }
  return out;
}

async function fetchReadme(repo) {
  if (OFFLINE) {
    const p = join(homedir(), "Projects", repo, "README.md");
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  }
  for (const branch of ["master", "main"]) {
    const res = await fetch(
      `https://raw.githubusercontent.com/ampactor-labs/${repo}/${branch}/README.md`,
    );
    if (res.ok) return res.text();
  }
  return null;
}

const stripMd = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function sectionBody(md, name) {
  const m = md.match(new RegExp(`^##\\s+${name}\\s*$`, "im"));
  if (!m) return "";
  const start = m.index + m[0].length;
  const next = md.slice(start).search(/^##\s+/m);
  return md.slice(start, next === -1 ? undefined : start + next).trim();
}

// The lead paragraph: the first prose block before any `##`, skipping badges,
// images, blockquotes, fences, and the status line.
export function leadParagraph(md) {
  const head = md.split(/^##\s+/m)[0];
  const blocks = head
    .replace(/^#\s+.*$/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const b of blocks) {
    if (/^\[!\[/.test(b) || /^!\[/.test(b) || /^>/.test(b)) continue;
    if (/^\*\*Status:/i.test(b)) continue;
    return stripMd(b);
  }
  return "";
}

export function statusOf(md) {
  const m = md.match(/\*\*Status:\s*([^*]+)\*\*\s*([^\n]*)/i);
  if (!m) return null;
  return {
    label: stripMd(m[1]).replace(/[.,]\s*$/, ""),
    caveat: stripMd(m[2] || "").replace(/^\s*[-–—]\s*/, ""),
  };
}

// Highlights are deliberately NOT extracted. Three attempts at deriving them
// automatically produced junk: last-column table cells gave "1.86X TS VS
// VORACIOUS" instead of the headline ratio, and sentence-splitting gave
// fragments like "i32 Signed integers XOR the sign bit". A card highlight is
// a phrase written for a card; README prose is written for a reader. Those
// are different jobs, so highlights stay hand-written next to color and icon.
//
// The three fields below extract deterministically and are exactly the ones
// that went stale: what it is, whether it works, and what it is bad at.
// "Weak spots" is canonical, but the invariant is that a section stating the
// losses exists, not its exact title. mentl's "What is honestly unfinished"
// is better writing than a forced rename would be.
export const WEAK_SECTION_ALIASES = [
  "Weak spots",
  "What is honestly unfinished",
  "Where it loses",
  "What this is not",
  "Known limitations",
];

export function operatorNoteOf(md) {
  const body =
    WEAK_SECTION_ALIASES.map((n) => sectionBody(md, n)).find(Boolean) || "";
  if (!body) return "";
  const first = body
    .split(/\n{2,}/)
    .find((p) => p.trim() && !p.trim().startsWith("|"));
  return first ? stripMd(first) : "";
}

export function extract(md) {
  const status = statusOf(md);
  const desc = leadParagraph(md);
  const operatorNote = operatorNoteOf(md);
  const missing = [];
  if (!desc) missing.push("a lead paragraph under the H1");
  if (!status) missing.push("a **Status:** line");
  if (!operatorNote)
    missing.push("a `## Weak spots` section (or a documented alias)");
  return { desc, status, operatorNote, missing };
}

// add-project.mjs imports the parsers above; importing must not run the sync.
if (process.argv[1]?.endsWith("sync-readmes.mjs")) {
  const source = readFileSync(PROJECTS, "utf8");
  const projects = projectRepos(source);
  const content = {};
  const report = [];

  for (const { id, repo } of projects) {
    const md = await fetchReadme(repo);
    if (!md) {
      report.push({ id, repo, state: "unreachable", missing: [] });
      continue;
    }
    const { desc, status, operatorNote, missing } = extract(md);
    if (missing.length) {
      report.push({ id, repo, state: "hand-written", missing });
      continue;
    }
    content[id] = {
      desc,
      status: status.label,
      statusNote: status.caveat,
      operatorNote,
    };
    report.push({ id, repo, state: "synced", missing: [] });
  }

  const synced = report.filter((r) => r.state === "synced");

  if (REPORT) {
    const pad = Math.max(...report.map((r) => r.id.length));
    for (const r of report.sort(
      (a, b) => a.state.localeCompare(b.state) || a.id.localeCompare(b.id),
    )) {
      const why = r.missing.length
        ? `needs ${r.missing.join(", ")}`
        : r.state === "synced"
          ? ""
          : r.state;
      console.log(`${r.id.padEnd(pad)}  ${r.state.padEnd(12)}  ${why}`);
    }
    console.log(
      `\n${synced.length}/${report.length} projects sync from their README.`,
    );
    process.exit(0);
  }

  const json = JSON.stringify(content, null, 2) + "\n";

  if (CHECK) {
    const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (current !== json) {
      console.error(
        "sync-readmes: generated content is stale; run `npm run sync:readmes`",
      );
      process.exit(1);
    }
    console.log("sync-readmes: up to date");
  } else {
    writeFileSync(OUT, json);
    console.log(
      `sync-readmes: ${synced.length}/${report.length} projects synced from README ` +
        `(${report.length - synced.length} hand-written; --report says why)`,
    );
  }
}
