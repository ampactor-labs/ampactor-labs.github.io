// Brings each repository's GitHub description, homepage and topics in line
// with its README, so the organization page says what the site says.
//
//   node scripts/repo-metadata.mjs          prints the `gh repo edit` commands
//   node scripts/repo-metadata.mjs --apply  runs them (needs `gh auth login`)
//
// Descriptions are each README's card line from the last build
// (src/data/readme-content.generated.json), so run `npm run build` first to
// pick up README changes. Private repositories (comma, apapacho) are listed
// by hand below because the build cannot read their READMEs.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ORG = "ampactor-labs";
const root = join(import.meta.dirname, "..");
const cards = JSON.parse(
  readFileSync(join(root, "src/data/readme-content.generated.json"), "utf8"),
);

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
  apapacho: "https://ampactor.dev/apapacho/",
  "ampactor-labs.github.io": "https://ampactor.dev",
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
};

const HAND_WRITTEN = {
  comma:
    "A web page that lets you hear the Pythagorean comma, then turns the piano's tuning errors into a reservoir computer and a storage register.",
  "ampactor-labs.github.io":
    "Morgan Espitia's portfolio at ampactor.dev: an arcade cabinet of projects, a commit log read from git, and a résumé, in React and TypeScript.",
};

const REPO_OF = { celezdial: "celezdial-selekta" };

const plan = [];
for (const [id, card] of Object.entries(cards)) {
  const repo = REPO_OF[id] ?? id;
  plan.push({ repo, description: card.summary });
}
for (const [repo, description] of Object.entries(HAND_WRITTEN)) {
  plan.push({ repo, description });
}

const apply = process.argv.includes("--apply");
for (const { repo, description } of plan) {
  const args = ["repo", "edit", `${ORG}/${repo}`, "--description", description];
  if (HOMEPAGE[repo]) args.push("--homepage", HOMEPAGE[repo]);
  for (const t of TOPICS[repo] ?? []) args.push("--add-topic", t);
  if (apply) {
    execFileSync("gh", args, { stdio: "inherit" });
    console.log(`updated ${repo}`);
  } else {
    console.log(["gh", ...args.map((a) => (/[\s'"$]/.test(a) ? JSON.stringify(a) : a))].join(" "));
  }
}
if (!apply) console.log(`\n${plan.length} repositories. Run with --apply to make these changes.`);
