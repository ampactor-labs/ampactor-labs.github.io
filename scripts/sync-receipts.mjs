#!/usr/bin/env node
// The ledger: every commit in the public ampactor-labs repositories, as data.
//
// Receipts (/receipts/) renders it; the floor's teaser and how-I-work read a
// small summary of it. The source is git itself, not the GitHub API: each
// repository is cloned bare into a cache and read with `git log --shortstat`,
// which gives exact additions, deletions and file counts for every commit with
// no token and no rate limit. Anonymous HTTPS reads of public repositories are
// all it needs, so the nightly deploy refreshes it for free.
//
//   * repositories come from src/data/projects.js (every `github:` link, the
//     same list sync-readmes.mjs uses) plus this site's own repository;
//   * clones live in .cache/receipts/<repo>.git and are fetched on later runs;
//   * the ledger is rebuilt in full each time (git log over a few thousand
//     commits is instant), and the committed snapshot is kept untouched when
//     the network is unavailable, so a build never fails for want of it.
//
// Output:
//   public/receipts/data.json           repos + every commit, without bodies
//   public/receipts/bodies/<xx>.json    "repo/sha" → message body for every
//                                       sha starting with xx (256 small
//                                       shards, one fetched when a reader
//                                       opens a commit)
//   src/data/receipts.summary.json      totals, months, per-repo counts, the
//                                       site's latest commits with their
//                                       "Checked:" lines, co-authorship
//
//   node scripts/sync-receipts.mjs [--strict] [--report]
//
// --strict   exit 1 on any failure instead of keeping the snapshot
// --report   print per-repository counts and exit without writing

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { projectRepos } from "./sync-readmes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "ampactor-labs";
const PROJECTS = join(ROOT, "src/data/projects.js");
const CACHE = join(ROOT, ".cache/receipts");
const OUT_DIR = join(ROOT, "public/receipts");
const DATA_OUT = join(OUT_DIR, "data.json");
const BODIES_DIR = join(OUT_DIR, "bodies");
const SUMMARY_OUT = join(ROOT, "src/data/receipts.summary.json");
const SITE_REPO = { id: "site", repo: "ampactor-labs.github.io" };
const BODY_LIMIT = 2000;

const args = new Set(process.argv.slice(2));
const STRICT = args.has("--strict");
const REPORT = args.has("--report");

const RS = "\x1e"; // record separator between commits
const FS = "\x1f"; // field separator within a commit

const gitEnv = {
  ...process.env,
  GIT_TERMINAL_PROMPT: "0",
  GIT_LFS_SKIP_SMUDGE: "1",
};

function git(cwd, ...argv) {
  return execFileSync("git", argv, {
    cwd,
    env: gitEnv,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Clone once, fetch afterwards. Sequential on purpose: the read proxy caps
// concurrent transfers, and a 429 means "one at a time", not "give up".
async function mirror(repo) {
  const dir = join(CACHE, `${repo}.git`);
  const url = `https://github.com/${OWNER}/${repo}.git`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (existsSync(dir)) {
        git(dir, "fetch", "--quiet", "--prune", "origin", "+refs/heads/*:refs/heads/*");
      } else {
        mkdirSync(CACHE, { recursive: true });
        git(CACHE, "clone", "--quiet", "--bare", url, dir);
      }
      return dir;
    } catch (err) {
      const text = String(err.stderr || err.message);
      if (/429|too many concurrent/i.test(text) && attempt === 0) {
        await sleep(5000);
        continue;
      }
      if (/not found|repository .* does not exist|403|401/i.test(text)) return null;
      throw new Error(`${repo}: ${text.trim().split("\n").pop()}`, { cause: err });
    }
  }
  return null;
}

function defaultBranch(dir) {
  try {
    const ref = git(dir, "symbolic-ref", "--quiet", "HEAD").trim();
    return ref.replace(/^refs\/heads\//, "");
  } catch {
    return "HEAD";
  }
}

// Co-Authored-By trailers, names only.
export function coAuthorsOf(message) {
  const names = [];
  for (const line of message.split("\n")) {
    const m = /^co-authored-by:\s*([^<]+?)\s*(?:<.*)?$/i.exec(line.trim());
    if (m && m[1]) names.push(m[1].trim());
  }
  return names;
}

// The paragraph of a message that says what was verified, if it has one. This
// repository's convention is "Checked: …", possibly wrapped over several
// lines; it ends at the first blank line.
export function checkedLineOf(body) {
  const m = /(?:^|\n)checked:\s*([\s\S]+?)(?=\n\s*\n|$)/i.exec(body);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

const SHORTSTAT =
  /^\s*(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?\s*$/;

// Parse `git log --format=<RS>%H<FS>%aI<FS>%an<FS>%P<FS>%s<FS>%b --shortstat`.
// Each record: hash, date, author, parents, subject, then the body with the
// shortstat line trailing it (absent on merges and empty commits).
export function parseLog(text, repoId) {
  const out = [];
  for (const record of text.split(RS)) {
    if (!record.trim()) continue;
    const [hash, date, author, parents, subject, rest = ""] = record.split(FS);
    const lines = rest.split("\n");
    let files = null;
    let additions = null;
    let deletions = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line.trim()) continue;
      const m = SHORTSTAT.exec(line);
      if (m) {
        files = Number(m[1]);
        additions = Number(m[2] || 0);
        deletions = Number(m[3] || 0);
        lines.splice(i, 1);
      }
      break;
    }
    const body = lines.join("\n").trim();
    out.push({
      sha: hash.slice(0, 7),
      repo: repoId,
      date,
      subject: subject.trim().slice(0, 200),
      author: author.trim(),
      coAuthors: coAuthorsOf(body),
      merge: parents.trim().split(" ").filter(Boolean).length > 1,
      additions,
      deletions,
      files,
      body: body.slice(0, BODY_LIMIT),
    });
  }
  return out;
}

function logCommits(dir, branch, repoId) {
  const text = git(
    dir,
    "log",
    branch,
    `--format=${RS}%H${FS}%aI${FS}%an${FS}%P${FS}%s${FS}%b`,
    "--shortstat",
  );
  return parseLog(text, repoId);
}

const EXT_LANG = {
  ".rs": "Rust",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".mts": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".gd": "GDScript",
  ".wat": "WebAssembly",
  ".wasm": "WebAssembly",
  ".mentl": "Mentl",
  ".c": "C",
  ".h": "C",
  ".cpp": "C++",
  ".css": "CSS",
  ".html": "HTML",
  ".sh": "Shell",
  ".toml": "TOML",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".json": "JSON",
  ".md": "Markdown",
  ".php": "PHP",
  ".sql": "SQL",
  ".glsl": "GLSL",
  ".wgsl": "WGSL",
};

// Bytes of source per language at the tip, from the tree itself.
export function languagesOf(lsTree) {
  const bytes = {};
  for (const line of lsTree.split("\n")) {
    // <mode> <type> <object> <size>\t<path>
    const m = /^\d+ blob \S+ +(\d+|-)\t(.+)$/.exec(line);
    if (!m) continue;
    const size = m[1] === "-" ? 0 : Number(m[1]);
    const path = m[2];
    if (/(^|\/)(node_modules|dist|target|vendor|\.git)\//.test(path)) continue;
    if (/(^|\/)(package-lock\.json|Cargo\.lock|pnpm-lock\.yaml|yarn\.lock)$/.test(path)) continue;
    const lang = EXT_LANG[extname(path).toLowerCase()];
    if (!lang) continue;
    bytes[lang] = (bytes[lang] || 0) + size;
  }
  return Object.fromEntries(
    Object.entries(bytes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6),
  );
}

const isClaude = (c) =>
  /^claude\b/i.test(c.author) || c.coAuthors.some((n) => /^claude\b/i.test(n));

export function summarize(data) {
  const commits = data.commits;
  const byMonth = new Map();
  const byRepo = new Map();
  let additions = 0;
  let deletions = 0;
  let withClaude = 0;
  let checked = 0;
  for (const c of commits) {
    if (!c.date) continue;
    const m = c.date.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) || 0) + 1);
    byRepo.set(c.repo, (byRepo.get(c.repo) || 0) + 1);
    additions += c.additions || 0;
    deletions += c.deletions || 0;
    if (isClaude(c)) withClaude++;
    if (c.checked) checked++;
  }
  const dates = commits.map((c) => c.date).filter(Boolean).sort();
  const first = dates[0] ?? null;
  const last = dates[dates.length - 1] ?? null;
  // Every month from the first to the last, zeros included: a chart with a
  // quiet month should show the quiet month.
  const months = [];
  if (first && last) {
    let [y, mo] = first.slice(0, 7).split("-").map(Number);
    const [ly, lmo] = last.slice(0, 7).split("-").map(Number);
    while (y < ly || (y === ly && mo <= lmo)) {
      const key = `${y}-${String(mo).padStart(2, "0")}`;
      months.push({ month: key, commits: byMonth.get(key) || 0 });
      mo++;
      if (mo > 12) {
        mo = 1;
        y++;
      }
    }
  }
  const site = commits
    .filter((c) => c.repo === SITE_REPO.id && !c.merge)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)
    .map((c) => ({ sha: c.sha, date: c.date, subject: c.subject, checked: c.checked }));
  return {
    generatedAt: data.generatedAt,
    totals: {
      commits: commits.length,
      repos: data.repos.length,
      additions,
      deletions,
      first,
      last,
      // Commits authored by, or carrying a co-author trailer for, Claude. The
      // honest number behind "AI in the loop, hands on the wheel".
      withClaude,
      // Commits whose message ends with a "Checked:" paragraph.
      checked,
    },
    months,
    byRepo: [...byRepo.entries()]
      .map(([repo, count]) => ({ repo, commits: count }))
      .sort((a, b) => b.commits - a.commits),
    site,
  };
}

async function main() {
  const targets = [
    ...projectRepos(readFileSync(PROJECTS, "utf8")),
    SITE_REPO,
  ].filter((t, i, all) => all.findIndex((u) => u.repo === t.repo) === i);

  const repos = [];
  const commits = [];
  const bodies = new Map(); // sha prefix → { "repo/sha": body }
  const report = [];

  for (const { id, repo } of targets) {
    const dir = await mirror(repo);
    if (!dir) {
      report.push({ id, repo, state: "unreachable", commits: 0 });
      continue;
    }
    const branch = defaultBranch(dir);
    const log = logCommits(dir, branch, id);
    const languages = languagesOf(git(dir, "ls-tree", "-r", "-l", branch));
    const dates = log.map((c) => c.date).sort();
    repos.push({
      id,
      repo,
      url: `https://github.com/${OWNER}/${repo}`,
      defaultBranch: branch,
      languages,
      commits: log.length,
      firstCommit: dates[0] ?? null,
      lastCommit: dates[dates.length - 1] ?? null,
    });
    for (const c of log) {
      if (c.body) {
        const shard = c.sha.slice(0, 2);
        if (!bodies.has(shard)) bodies.set(shard, {});
        bodies.get(shard)[`${id}/${c.sha}`] = c.body;
      }
      // The row carries the fact that a body exists and what it verified; the
      // text itself is fetched by shard when a reader opens a commit.
      commits.push({
        sha: c.sha,
        repo: c.repo,
        date: c.date,
        subject: c.subject,
        author: c.author,
        coAuthors: c.coAuthors,
        merge: c.merge,
        additions: c.additions,
        deletions: c.deletions,
        files: c.files,
        hasBody: Boolean(c.body),
        checked: checkedLineOf(c.body),
      });
    }
    report.push({ id, repo, state: "synced", commits: log.length });
  }

  commits.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const data = { generatedAt: new Date().toISOString(), repos, commits };

  if (REPORT) {
    const pad = Math.max(...report.map((r) => r.id.length));
    for (const r of report) {
      console.log(`${r.id.padEnd(pad)}  ${r.state.padEnd(11)}  ${r.commits}`);
    }
    console.log(`\n${commits.length} commits across ${repos.length} repositories.`);
    return;
  }

  mkdirSync(BODIES_DIR, { recursive: true });
  for (const stale of readdirSync(BODIES_DIR)) rmSync(join(BODIES_DIR, stale));
  for (const [shard, entries] of bodies) {
    writeFileSync(join(BODIES_DIR, `${shard}.json`), JSON.stringify(entries));
  }
  writeFileSync(DATA_OUT, JSON.stringify(data));
  writeFileSync(SUMMARY_OUT, JSON.stringify(summarize(data), null, 2) + "\n");
  const bodyBytes = [...bodies.values()].reduce(
    (n, b) => n + JSON.stringify(b).length,
    0,
  );
  console.log(
    `sync-receipts: ${commits.length} commits across ${repos.length} repositories ` +
      `(${(readFileSync(DATA_OUT).length / 1024).toFixed(0)} KB + ${(bodyBytes / 1024).toFixed(0)} KB of bodies)`,
  );
}

if (process.argv[1]?.endsWith("sync-receipts.mjs")) {
  main().catch((err) => {
    console.error(`sync-receipts: ${err.message}`);
    if (STRICT || !existsSync(DATA_OUT)) process.exit(1);
    console.error("sync-receipts: keeping the committed snapshot");
  });
}
