// Brings the organization page in line with the site: each public
// repository's description, homepage and topics, the line under the
// organization's name, and its profile README, which lists the cartridges the
// way the select screen does.
//
//   node scripts/repo-metadata.mjs          prints what it would change
//   node scripts/repo-metadata.mjs --apply  changes it (needs `gh auth login`;
//                                           the organization's own line also
//                                           needs `gh auth refresh -s admin:org`)
//
// A cartridge's description is its README's card line from the last build
// (src/data/readme-content.generated.json), so run `npm run build` first to
// pick up README changes. This repository's comes from its own README. The
// rest are written below.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTACT, WORDS } from "../src/data/profile.js";
import { PROJECTS } from "../src/data/projects.js";
import { SITE } from "../src/data/site.js";
import { summaryOf, writingErrors } from "./sync-readmes.mjs";

const ORG = "ampactor-labs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Where "Website" on each repository page should go.
const HOMEPAGE = {
  mentl: "https://ampactor.dev/arcade/#mentl",
  sonido: "https://ampactor.dev/sonido",
  turbosort: "https://crates.io/crates/turbosort",
  "two-top": "https://github.com/ampactor-labs/two-top/releases/tag/apk-latest",
  clob: "https://ampactor.dev/arcade/#clob",
  tokensafe: "https://scry-production.up.railway.app",
  landed: "https://ampactor.dev/arcade/#landed",
  perennials: "https://ampactor.dev/perennials/",
  bits: "https://ampactor.dev/bits/",
  noodles: "https://ampactor.dev/noodles",
  copycats: "https://ampactor.dev/copycats/",
  stoop: "https://ampactor.dev/stoop/",
  understory: "https://ampactor.dev/understory/",
  "celezdial-selekta": "https://ampactor.dev/celezdial-selekta/",
  "freestyle-engine": "https://ampactor.dev/freestyle-engine/",
  slot: "https://ampactor.dev/slot/",
  comma: "https://ampactor.dev/comma/",
  "ampactor-labs.github.io": "https://ampactor.dev",
  artforrichpeople: "https://artforrichpeople.com",
};

// Added to whatever topics a repository already has; never removes one.
const TOPICS = {
  mentl: ["programming-language", "compiler", "self-hosting", "algebraic-effects", "webassembly", "type-inference"],
  "two-top": ["rust", "bevy", "rollback-netcode", "ggrs", "webrtc", "deterministic", "android"],
  clob: ["rust", "machine-learning", "ternary-neural-network"],
  tokensafe: ["typescript", "x402", "api"],
  landed: ["rust", "solana", "jito"],
  perennials: ["react", "typescript", "pwa", "permaculture", "postgres"],
  bits: ["react", "typescript", "webcodecs", "mediapipe"],
  noodles: ["music", "tone-js", "web-audio"],
  copycats: ["godot", "gdscript", "platformer"],
  stoop: ["zine", "publishing", "pdf"],
  understory: ["songwriting", "lyrics", "poetry"],
  "freestyle-engine": ["freestyle-rap", "typescript", "web-audio"],
  slot: ["trumpet", "music", "tuning"],
  comma: ["music-theory", "tuning", "web-audio"],
  "ampactor-labs.github.io": ["react", "typescript", "vite"],
  flowpilot: ["rust", "solana", "jito", "jupiter"],
  garden: ["godot", "gdscript", "multiplayer", "browser-game"],
  "build-sheet": ["cloudflare", "pwa", "react", "typescript"],
  browsore: ["playwright", "browser-automation", "typescript", "robots-txt"],
  invo: ["rust", "cli", "invoice", "pdf"],
  forge: ["rust", "ai-agent", "tui", "mcp"],
  ytm: ["rust", "tui", "youtube-music", "zellij"],
  diskmon: ["rust", "systemd", "monitoring", "notifications"],
};

// The public repositories the site does not read: comma, whose README does
// not meet the standard yet, and the ones that are not cartridges. Each line
// says what its README says. Forks keep their upstream's line, and private
// repositories are left alone: only their owner sees them.
const WRITTEN = {
  comma:
    "A web page that lets you hear the Pythagorean comma, then turns the piano's tuning errors into a reservoir computer and a storage register.",
  flowpilot:
    "An automated Solana trading engine, retired in 2026. I shut it down because the strategy stopped clearing fees. Its execution core was rebuilt as landed.",
  artforrichpeople: "A storefront that sells one piece at a time.",
  garden:
    "A multiplayer garden game in Godot for the browser, where two to eight players tend creatures that keep working while they're away. Unreleased.",
  "build-sheet":
    "A phone-first web app template on Cloudflare for logging a build while you work: photos, voice notes and part costs, then the real margin when it sells.",
  browsore:
    "A Playwright browser automation framework that takes instructions in plain language and keeps to robots.txt, per-domain rate limits and Retry-After headers.",
  invo: "A command-line tool in Rust that turns a YAML or TOML file into a PDF invoice, offline.",
  forge:
    "A Rust reimplementation of Claude Code's agentic tool loop for the terminal, with model selection, approval dialogs and guard rules decided by code and config.",
  ytm: "A keyboard-driven YouTube Music player for the terminal, made to live in a pinned floating Zellij pane.",
  diskmon:
    "A small Rust disk-space monitor that runs under systemd and sends desktop notifications at warning and critical thresholds, with a cooldown between alerts.",
  ".github":
    "The profile README on github.com/ampactor-labs, generated from the cartridges in ampactor-labs.github.io.",
};

const REPO_OF = { celezdial: "celezdial-selekta" };

// One line each, under 160 characters: a README's card line
// (docs/README-STANDARD.md), and all GitHub takes for an organization.
const MAX = 160;

// The line under the organization's name is the site's own: the name and the
// line of range from the no-JavaScript page. The website and the city sit
// beside it.
export const ORG_PROFILE = {
  description: `${SITE.name}, ${SITE.range[0].toLowerCase()}${SITE.range.slice(1)}`,
  blog: SITE.origin,
  location: `${SITE.locality}, ${SITE.region}`,
};

export function planRepos(
  cards = JSON.parse(
    readFileSync(join(ROOT, "src/data/readme-content.generated.json"), "utf8"),
  ),
) {
  const plan = [];
  for (const [id, card] of Object.entries(cards)) {
    if (card.summary) plan.push({ repo: REPO_OF[id] ?? id, description: card.summary });
  }
  plan.push({
    repo: "ampactor-labs.github.io",
    description: summaryOf(readFileSync(join(ROOT, "README.md"), "utf8")),
  });
  for (const [repo, description] of Object.entries(WRITTEN)) {
    plan.push({ repo, description });
  }
  return plan;
}

// Every way a line would break the site's writing rules or GitHub's limits.
export function problemsWith(plan, org = ORG_PROFILE) {
  const problems = [];
  for (const { repo, description } of plan) {
    if (!description) problems.push(`${repo}: no description`);
    for (const e of writingErrors(description)) problems.push(`${repo}: ${e}`);
    if (description.length >= MAX)
      problems.push(`${repo}: ${description.length} characters (under ${MAX})`);
  }
  for (const e of writingErrors(org.description)) problems.push(`${ORG}: ${e}`);
  if (org.description.length >= MAX)
    problems.push(`${ORG}: ${org.description.length} characters (under ${MAX})`);
  return problems;
}

// The profile README: PRESS START, then the select screen's list, each row a
// link straight to its cartridge. Every word on it is already on the site.
// The phone stays off it, as it stays out of the site's HTML.
export function profileReadme(projects = PROJECTS) {
  const cell = (s) => String(s).replace(/\|/g, "\\|");
  return [
    "<!-- Written by scripts/repo-metadata.mjs in ampactor-labs/ampactor-labs.github.io from the cabinet's own data. Edit it there. -->",
    "",
    `### [PRESS START](${SITE.origin})`,
    "",
    "| SELECT PROGRAM | |",
    "|:--|:--|",
    ...projects.map(
      (p) => `| [${cell(p.title)}](${SITE.origin}/arcade/#${p.id}) | ${cell(p.subtitle)} |`,
    ),
    "",
    `${CONTACT.email} · [RÉSUMÉ](${SITE.origin}/resume.html) · [LINKEDIN](${CONTACT.linkedin})`,
    "",
    WORDS.credits,
    "",
  ].join("\n");
}

const shown = (args) =>
  ["gh", ...args.map((a) => (/[\s'"$]/.test(a) ? JSON.stringify(a) : a))].join(" ");

function repoArgs({ repo, description }) {
  const args = ["repo", "edit", `${ORG}/${repo}`, "--description", description];
  if (HOMEPAGE[repo]) args.push("--homepage", HOMEPAGE[repo]);
  for (const t of TOPICS[repo] ?? []) args.push("--add-topic", t);
  return args;
}

const orgArgs = () => [
  "api", "-X", "PATCH", `orgs/${ORG}`,
  "-f", `description=${ORG_PROFILE.description}`,
  "-f", `blog=${ORG_PROFILE.blog}`,
  "-f", `location=${ORG_PROFILE.location}`,
];

const PROFILE = `repos/${ORG}/.github/contents/profile/README.md`;

// The contents API replaces a file by its blob sha, and the same text twice
// would be an empty commit, so read what is there first.
function publishProfile(body) {
  let current = null;
  try {
    current = JSON.parse(
      execFileSync("gh", ["api", PROFILE], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }),
    );
  } catch {
    // No profile README yet: the PUT below creates it.
  }
  if (current && Buffer.from(current.content, "base64").toString("utf8") === body) {
    console.log("profile README unchanged");
    return;
  }
  const args = [
    "api", "-X", "PUT", PROFILE,
    "-f", "message=profile: the cartridges, from ampactor.dev",
    "-f", `content=${Buffer.from(body).toString("base64")}`,
  ];
  if (current) args.push("-f", `sha=${current.sha}`);
  execFileSync("gh", args, { stdio: ["ignore", "ignore", "inherit"] });
  console.log("updated .github/profile/README.md");
}

if (process.argv[1]?.endsWith("repo-metadata.mjs")) {
  const plan = planRepos();
  const problems = problemsWith(plan);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  const readme = profileReadme();

  if (process.argv.includes("--apply")) {
    for (const entry of plan) {
      execFileSync("gh", repoArgs(entry), { stdio: "inherit" });
      console.log(`updated ${entry.repo}`);
    }
    try {
      execFileSync("gh", orgArgs(), { stdio: ["ignore", "ignore", "inherit"] });
      console.log(`updated ${ORG}`);
    } catch {
      console.log(
        `${ORG} not updated: run \`gh auth refresh -h github.com -s admin:org\` and apply again, or paste its line at https://github.com/organizations/${ORG}/settings/profile`,
      );
    }
    publishProfile(readme);
  } else {
    for (const entry of plan) console.log(shown(repoArgs(entry)));
    console.log(shown(orgArgs()));
    console.log(`\n.github/profile/README.md:\n\n${readme}`);
    console.log(`${plan.length} repositories and the organization. Run with --apply to make these changes.`);
  }
}
