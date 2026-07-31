#!/usr/bin/env node
// Scaffold a new project card from a repo's README.
//
//   npm run add:project -- <repo> [--offline] [--write]
//
// Prints an entry ready to paste into src/data/projects.js, with the content
// fields filled in from the README so you only choose the presentation:
// color, icon, category, tagline, highlights. With --write it appends the
// entry for you.
//
// Content in the printed entry is a starting point, not the live value. Once
// the README follows the house spec, sync-readmes.mjs overrides desc,
// operatorNote, and status at build time, and editing the README is what
// changes the card.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extract } from "./sync-readmes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECTS = join(ROOT, "src/data/projects.js");

const argv = process.argv.slice(2);
const repo = argv.find((a) => !a.startsWith("--"));
const OFFLINE = argv.includes("--offline");
const WRITE = argv.includes("--write");

if (!repo) {
  console.error("usage: npm run add:project -- <repo> [--offline] [--write]");
  process.exit(2);
}

const PALETTE = [
  "#FF6B35",
  "#00E5FF",
  "#14F195",
  "#E0FF00",
  "#FF4FD8",
  "#7C5CFF",
  "#FFB000",
  "#4ADE80",
];

async function readme() {
  if (OFFLINE) {
    const p = join(homedir(), "Projects", repo, "README.md");
    if (!existsSync(p)) throw new Error(`no README at ${p}`);
    return readFileSync(p, "utf8");
  }
  for (const branch of ["master", "main"]) {
    const res = await fetch(
      `https://raw.githubusercontent.com/ampactor-labs/${repo}/${branch}/README.md`,
    );
    if (res.ok) return res.text();
  }
  throw new Error(`no README found for ampactor-labs/${repo}`);
}

const md = await readme();
const source = readFileSync(PROJECTS, "utf8");
const id = repo.replace(/^ampactor-/, "");

if (new RegExp(`id:\\s*"${id}"`).test(source)) {
  console.error(`add-project: "${id}" is already in projects.js`);
  process.exit(1);
}

const { desc, operatorNote, missing } = extract(md);
const title = (md.match(/^#\s+(.+)$/m)?.[1] || id).trim().toUpperCase();
const live = md.match(/https:\/\/ampactor\.dev\/[\w-]+/)?.[0] || null;
const lang = /```rust/.test(md)
  ? "Rust"
  : /```ts|```tsx/.test(md)
    ? "TypeScript"
    : "JavaScript";
const color =
  PALETTE[
    Math.abs([...id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) %
      PALETTE.length
  ];

const q = (s) => JSON.stringify(s ?? "");
const entry = `
{
    id: ${q(id)},
    title: ${q(title)},
    subtitle: "TODO ONE LINE, ALL CAPS",
    lang: ${q(lang)},
    color: ${q(color)},
    icon: "▪",
    github: ${q(`https://github.com/ampactor-labs/${repo}`)},${live ? `\n    live: ${q(live)},` : ""}
    desc: ${q(desc || "TODO: the README has no lead paragraph yet")},
    tags: ["todo"],
    tagline: "TODO SHORT PHRASE",
    highlights: [
      "TODO CLAIM WITH A NUMBER",
    ],
    stack: ["TODO"],
    status: "active",
    category: "systems",
    operatorNote: ${q(operatorNote || "TODO: add a `## Weak spots` section to the README")},
  },`;

console.log(entry);

if (missing.length) {
  console.error(
    `\nadd-project: ${repo}'s README will stay hand-written until it has:`,
  );
  for (const m of missing) console.error(`  - ${m}`);
  console.error("Until then the fields above are frozen copies, not live.");
} else {
  console.error(
    `\nadd-project: ${repo} conforms; desc, status, and operatorNote will sync at build.`,
  );
}

if (WRITE) {
  const marker =
    "\n];\n\nexport const PROJECTS = RAW_PROJECTS.map(fromReadme);";
  if (!source.includes(marker)) {
    console.error(
      "add-project: could not find the end of RAW_PROJECTS; paste by hand",
    );
    process.exit(1);
  }
  writeFileSync(PROJECTS, source.replace(marker, `${entry}${marker}`));
  console.error(`add-project: appended "${id}" to src/data/projects.js`);
}
