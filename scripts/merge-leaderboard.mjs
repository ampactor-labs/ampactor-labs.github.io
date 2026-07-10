/* Merge one TUNNEL_RUN score submission into public/tunnel-leaderboard.json.
 *
 * Run by .github/workflows/leaderboard.yml with the submission carried in
 * env vars (never interpolated into a shell command):
 *   ISSUE_TITLE  e.g. "[tunnel-run] MOR 48210"
 *   ISSUE_USER   GitHub login of the submitter
 *   RUN_DATE     YYYY-MM-DD (optional; defaults to today, injectable for tests)
 *
 * Prints a single JSON line { accepted, reason, initials, score, rank } and
 * writes the board file only when the score is accepted. The merge logic is
 * exported so vitest can exercise it without touching the filesystem.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const BOARD_PATH = "public/tunnel-leaderboard.json";
export const BOARD_MAX = 10;

// Initials come from the game's arcade charset (A–Z, 0–9, dot, space); the
// client sends space as "_" so GitHub's title trimming can't eat it.
export const TITLE_RE = /^\[tunnel-run\]\s+([A-Z0-9._]{3})\s+([0-9]{1,7})\s*$/;

export function parseTitle(title) {
  const m = TITLE_RE.exec(String(title || "").trim());
  if (!m) return null;
  return { initials: m[1], score: parseInt(m[2], 10) };
}

export function readBoard(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.scores)) return [];
    return data.scores
      .filter((e) => e && typeof e.s === "number" && typeof e.i === "string")
      .sort((a, b) => b.s - a.s)
      .slice(0, BOARD_MAX);
  } catch {
    return [];
  }
}

// Pure merge: returns { accepted, reason, rank, scores }. Ties lose — a new
// score must strictly beat #10 on a full board, and on equal scores the
// earlier entry keeps the higher rank (stable sort with existing rows first).
export function mergeScore(scores, { initials, score, user, date }) {
  if (!Number.isInteger(score) || score < 1) {
    return { accepted: false, reason: "score must be a positive integer" };
  }
  if (
    scores.some((e) => e.i === initials && e.s === score && e.user === user)
  ) {
    return { accepted: false, reason: "this exact entry is already on the board" };
  }
  if (scores.length >= BOARD_MAX && score <= scores[scores.length - 1].s) {
    return {
      accepted: false,
      reason: `did not beat the current #${BOARD_MAX} (${scores[scores.length - 1].s})`,
    };
  }
  const row = { i: initials, s: score, user, date };
  const next = [...scores, row]
    .sort((a, b) => b.s - a.s)
    .slice(0, BOARD_MAX);
  return { accepted: true, rank: next.indexOf(row) + 1, scores: next };
}

function main() {
  const parsed = parseTitle(process.env.ISSUE_TITLE);
  if (!parsed) {
    process.stdout.write(
      JSON.stringify({
        accepted: false,
        reason:
          "title must look like `[tunnel-run] AAA 12345` (3 initials from A-Z 0-9 . _, then the score)",
      }) + "\n",
    );
    return;
  }
  const user = String(process.env.ISSUE_USER || "unknown");
  const date =
    process.env.RUN_DATE || new Date().toISOString().slice(0, 10);

  let raw = "";
  try {
    raw = readFileSync(BOARD_PATH, "utf8");
  } catch {
    raw = "";
  }
  const scores = readBoard(raw);
  const result = mergeScore(scores, { ...parsed, user, date });

  if (result.accepted) {
    writeFileSync(
      BOARD_PATH,
      JSON.stringify({ updated: date, scores: result.scores }, null, 2) + "\n",
    );
  }
  process.stdout.write(
    JSON.stringify({
      accepted: result.accepted,
      reason: result.reason || "",
      initials: parsed.initials,
      score: parsed.score,
      rank: result.rank || 0,
    }) + "\n",
  );
}

// Only run the CLI when invoked directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
