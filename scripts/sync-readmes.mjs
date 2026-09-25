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
// a `github:` URL is synced. The README format is docs/README-STANDARD.md; a
// field that does not meet it keeps the hand-written text in projects.js. So
// adding a project is one normal entry in projects.js, and improving a README
// is what makes its card follow along.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One README, from the default branch. A dropped connection is retried with
// backoff; if the network stays down the result says so, and the caller keeps
// the last synced content, so a build never fails for want of the network
// (sync-receipts.mjs does the same for the commit log).
export async function fetchReadme(
  repo,
  { get = fetch, tries = 3, delayMs = 500 } = {},
) {
  if (OFFLINE) {
    const p = join(homedir(), "Projects", repo, "README.md");
    return existsSync(p) ? { md: readFileSync(p, "utf8") } : { md: null };
  }
  for (const branch of ["master", "main"]) {
    const url = `https://raw.githubusercontent.com/ampactor-labs/${repo}/${branch}/README.md`;
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await get(url);
        if (res.ok) return { md: await res.text() };
        if (res.status === 404) break; // not on this branch: try the other
        throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        if (attempt >= tries) return { md: null, networkError: err };
        await sleep(delayMs * 2 ** (attempt - 1));
      }
    }
  }
  return { md: null };
}

const stripMd = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// A block the site can show as a sentence: not a list, table, heading, code
// fence, quote or image, which would reach the page as stray markup.
const isProse = (block) => {
  const b = block.trim();
  return b !== "" && !/^([-*+]\s|\d+[.)]\s|\||#|```|>|!\[)/.test(b);
};

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
// "Limitations" is the standard's name (docs/README-STANDARD.md); the older
// names still count while repositories move over, and the report asks for
// the rename.
export const WEAK_SECTION_ALIASES = [
  "Limitations",
  "Weak spots",
  "What is honestly unfinished",
  "Where it loses",
  "What this is not",
  "Known limitations",
];

const limitationsOf = (md) =>
  WEAK_SECTION_ALIASES.map((n) => sectionBody(md, n)).find(Boolean) || "";

export function operatorNoteOf(md) {
  const first = limitationsOf(md)
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n{2,}/)
    .find(isProse);
  return first ? stripMd(first) : "";
}

// ---- The README standard (docs/README-STANDARD.md) --------------------------
//
// The checker below is that page as data. `npm run readmes:report` prints its
// findings; the sync uses them to decide which fields the site may show.

export const SECTIONS = [
  "Quick start",
  "Usage",
  "How it works",
  "Benchmarks",
  "Data",
  "Project layout",
  "Deploy",
  "Testing",
  "Limitations",
  "Roadmap",
  "License",
];
// Each entry is satisfied by any one of its sections: a library's Usage is
// its quick start.
export const REQUIRED_SECTIONS = [
  ["Quick start", "Usage"],
  ["Testing"],
  ["Limitations"],
  ["License"],
];
// Old names, accepted with a warning while repositories move over.
export const SECTION_ALIASES = {
  "weak spots": "Limitations",
  "what is honestly unfinished": "Limitations",
  "where it loses": "Limitations",
  "what this is not": "Limitations",
  "known limitations": "Limitations",
  verification: "Testing",
  tests: "Testing",
  run: "Quick start",
  "try it": "Quick start",
  "play it": "Quick start",
  setup: "Quick start",
  install: "Quick start",
  dev: "Quick start",
  development: "Quick start",
  build: "Quick start",
  measured: "Benchmarks",
  architecture: "How it works",
  layout: "Project layout",
  files: "Project layout",
  "where it's going": "Roadmap",
};
export const STATUS_LABELS = [
  "shipping",
  "working",
  "prototype",
  "paused",
  "retired",
];

const FILLER =
  /\b(honest(?:ly)?|seamless(?:ly)?|blazing(?:ly)?|magic(?:al)?|revolutionary|game[- ]changing|cutting[- ]edge|unleash(?:es|ed)?|supercharg\w*|delve[sd]?)\b/gi;
const CONTRAST = /\bnot (?:a |an |the )?[\w'-]+(?: [\w'-]+){0,3}, not\b/gi;

// Sentences, split at terminal punctuation followed by a capital. Good enough
// for a lead paragraph; abbreviations like "e.g." are rare there.
export function sentencesOf(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z(*`"'])/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function summaryOf(md) {
  return sentencesOf(leadParagraph(md))[0] ?? "";
}

// The writing rules a piece of text must pass before the site shows it.
export function writingErrors(text) {
  const errors = [];
  const dashes = (text.match(/\u2014/g) || []).length;
  if (dashes) errors.push(`${dashes} em dash${dashes === 1 ? "" : "es"}`);
  const filler = [
    ...new Set((text.match(FILLER) || []).map((w) => w.toLowerCase())),
  ];
  if (filler.length) errors.push(`filler words: ${filler.join(", ")}`);
  return errors;
}

function canonicalSection(heading) {
  const lower = heading.toLowerCase();
  const exact = SECTIONS.find((n) => n.toLowerCase() === lower);
  if (exact) return { name: exact, alias: false };
  if (SECTION_ALIASES[lower])
    return { name: SECTION_ALIASES[lower], alias: true };
  return null;
}

// Every way a README departs from the standard. A README meets it with no
// errors and no renames left (old section names, multi-word status labels):
// only then has it been rewritten for the standard, first sentence included,
// and only then does that sentence become the project's card. Other warnings
// are advice.
export function checkReadme(md) {
  const errors = [];
  const renames = [];
  const warnings = [];

  const lead = leadParagraph(md);
  const sentences = sentencesOf(lead);
  const words = lead.split(/\s+/).filter(Boolean).length;
  if (!/^#\s+\S/m.test(md)) errors.push("no `#` title");
  if (!lead) errors.push("no lead paragraph under the title");
  else {
    if (sentences.length > 4)
      errors.push(`lead is ${sentences.length} sentences (at most 4)`);
    if (words > 90) errors.push(`lead is ${words} words (at most 90)`);
    if (sentences[0] && sentences[0].length > 160)
      errors.push(
        `first sentence is ${sentences[0].length} characters (at most 160)`,
      );
    // The card shows the name above this sentence.
    const title = stripMd(md.match(/^#\s+(.+?)\s*$/m)?.[1] ?? "");
    if (
      title &&
      sentences[0]?.toLowerCase().startsWith(`${title.toLowerCase()} `)
    )
      warnings.push(
        'first sentence starts with the name: start with what it is ("A …"), since the site shows it under the name',
      );
  }

  const status = statusOf(md);
  if (!status) errors.push("no **Status:** line");
  else {
    const [first, ...rest] = status.label.toLowerCase().split(/[\s,]+/);
    if (!STATUS_LABELS.includes(first))
      errors.push(
        `status "${status.label}" is not one of ${STATUS_LABELS.join(", ")}`,
      );
    else if (rest.filter(Boolean).length)
      renames.push(
        `status label "${status.label}": one word, caveats in the sentence after`,
      );
  }

  const headings = [...md.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
  const found = new Set();
  let lastIndex = -1;
  let orderWarned = false;
  for (const h of headings) {
    const c = canonicalSection(h);
    if (!c) {
      warnings.push(
        `extra section "${h}": make it a ### under the section it belongs to, or move it to docs/`,
      );
      continue;
    }
    found.add(c.name);
    if (c.alias) renames.push(`section "${h}": rename to "${c.name}"`);
    else if (h !== c.name)
      renames.push(`section "${h}": write it as "${c.name}"`);
    const index = SECTIONS.indexOf(c.name);
    if (index < lastIndex && !orderWarned) {
      warnings.push(`"${c.name}" is out of order (see the layout)`);
      orderWarned = true;
    }
    lastIndex = Math.max(lastIndex, index);
  }
  for (const names of REQUIRED_SECTIONS)
    if (!names.some((n) => found.has(n)))
      errors.push(`no "${names.join('" or "')}" section`);
  if (found.has("Limitations") && !isProse(limitationsOf(md)))
    errors.push(
      "Limitations does not open with a paragraph (the site shows its first paragraph on its own)",
    );

  errors.push(...writingErrors(md.replace(/```[\s\S]*?```/g, "")));
  const contrasts = md.match(CONTRAST) || [];
  if (contrasts.length)
    warnings.push(`${contrasts.length} "not X, not Y" construction(s)`);

  const lines = md.split("\n").length;
  if (lines > 200)
    warnings.push(`${lines} lines: move deep dives into docs/ (about 200)`);

  return {
    errors,
    renames,
    warnings,
    meetsStandard: errors.length === 0 && renames.length === 0,
  };
}

export function extract(md) {
  const status = statusOf(md);
  const desc = leadParagraph(md);
  const operatorNote = operatorNoteOf(md);
  const missing = [];
  if (!desc) missing.push("a lead paragraph under the H1");
  if (!status) missing.push("a **Status:** line");
  if (!operatorNote)
    missing.push("a `## Limitations` section (or a documented alias)");
  return {
    desc,
    status,
    operatorNote,
    summary: summaryOf(md),
    check: checkReadme(md),
    missing,
  };
}

// add-project.mjs imports the parsers above; importing must not run the sync.
if (process.argv[1]?.endsWith("sync-readmes.mjs")) {
  const source = readFileSync(PROJECTS, "utf8");
  const projects = projectRepos(source);
  const content = {};
  // The last synced content, kept for any README the network will not give us.
  const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  const report = [];

  for (const { id, repo } of projects) {
    const { md, networkError } = await fetchReadme(repo);
    if (!md) {
      if (networkError && previous[id]) content[id] = previous[id];
      report.push({
        id,
        repo,
        state: networkError
          ? `network error (${networkError.cause?.code ?? networkError.message}); ` +
            (previous[id] ? "kept the last synced content" : "nothing to keep")
          : "unreachable",
        missing: [],
      });
      continue;
    }
    const { desc, status, operatorNote, summary, check, missing } = extract(md);
    if (missing.length) {
      report.push({ id, repo, state: "hand-written", missing, check });
      continue;
    }
    // Each field reaches the site only if its own text passes the writing
    // rules; otherwise projects.js keeps its hand-written version. The card
    // line waits for the whole README to meet the standard.
    const entry = { status: status.label, statusNote: status.caveat };
    if (!writingErrors(desc).length) entry.desc = desc;
    if (!writingErrors(operatorNote).length) entry.operatorNote = operatorNote;
    if (check.meetsStandard && summary) entry.summary = summary;
    content[id] = entry;
    report.push({ id, repo, state: "synced", missing: [], check, entry });
  }

  const synced = report.filter((r) => r.state === "synced");

  if (REPORT) {
    const pad = Math.max(...report.map((r) => r.id.length));
    const sorted = report.sort(
      (a, b) =>
        Number(b.check?.meetsStandard ?? false) -
          Number(a.check?.meetsStandard ?? false) ||
        (a.check ? a.check.errors.length + a.check.renames.length : 99) -
          (b.check ? b.check.errors.length + b.check.renames.length : 99) ||
        a.id.localeCompare(b.id),
    );
    for (const r of sorted) {
      if (!r.check) {
        console.log(`${r.id.padEnd(pad)}  ${r.state}`);
        continue;
      }
      const { errors, renames, warnings, meetsStandard } = r.check;
      const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
      const verdict = meetsStandard
        ? "meets the standard"
        : `${plural(errors.length, "error")}, ${plural(renames.length, "rename")}`;
      const shown = r.entry
        ? ["summary", "desc", "operatorNote"]
            .filter((k) => r.entry[k])
            .join(", ") || "status only"
        : "nothing";
      console.log(
        `${r.id.padEnd(pad)}  ${verdict}, ${plural(warnings.length, "warning")}; ` +
          `the site shows ${shown}`,
      );
      for (const e of errors)
        console.log(`${" ".repeat(pad)}    error    ${e}`);
      for (const e of renames)
        console.log(`${" ".repeat(pad)}    rename   ${e}`);
      for (const w of warnings)
        console.log(`${" ".repeat(pad)}    warning  ${w}`);
      if (r.missing.length)
        console.log(`${" ".repeat(pad)}    needs    ${r.missing.join(", ")}`);
    }
    const meeting = report.filter((r) => r.check?.meetsStandard).length;
    console.log(
      `\n${meeting}/${report.length} READMEs meet docs/README-STANDARD.md; ` +
        `${synced.length}/${report.length} sync at least their status.`,
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
    const kept = report.filter((r) => r.state.includes("kept the last")).length;
    const other = report.length - synced.length - kept;
    console.log(
      `sync-readmes: ${synced.length}/${report.length} projects synced from README` +
        (kept ? `, ${kept} kept from the last sync (network error)` : "") +
        (other ? `, ${other} hand-written` : "") +
        "; --report says why",
    );
  }
}
