/* ── persistent high-score board for TUNNEL_RUN ─────────────
 * Small, pure-ish module so the board logic (migration, qualifying,
 * sort/slice/cap) is unit-testable apart from the canvas game.
 * Each entry is { i: "AAA" (3 chars), s: <integer score> }.
 */

export const LB_KEY = "tunnelrun_leaderboard";
export const LEGACY_HI_KEY = "tunnelrun_hiscore";
export const LB_MAX = 10;

// Arcade charset for initials entry: A–Z, 0–9, space, dot. Index 0 ('A') is the default.
export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .";

function normalizeEntry(e) {
  return {
    i: String(e.i || "AAA")
      .toUpperCase()
      .slice(0, 3),
    s: Math.max(0, Math.floor(e.s)),
  };
}

export function loadLeaderboard() {
  let list = [];
  try {
    const raw = JSON.parse(localStorage.getItem(LB_KEY) || "[]");
    if (Array.isArray(raw)) {
      list = raw
        .filter((e) => e && typeof e.s === "number")
        .map(normalizeEntry);
    }
  } catch {
    list = [];
  }
  // One-time migration of the old single-value high score.
  if (list.length === 0) {
    const legacy = parseInt(
      (typeof localStorage !== "undefined" &&
        localStorage.getItem(LEGACY_HI_KEY)) ||
        "0",
      10,
    );
    if (legacy > 0) list.push({ i: "AMP", s: legacy });
  }
  list.sort((a, b) => b.s - a.s);
  return list.slice(0, LB_MAX);
}

export function saveLeaderboard(list) {
  const trimmed = list.slice(0, LB_MAX);
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
    if (trimmed[0]) localStorage.setItem(LEGACY_HI_KEY, String(trimmed[0].s));
  } catch {
    /* storage unavailable — keep playing without persistence */
  }
  return trimmed;
}

// A score qualifies if the board has room or the score beats the lowest entry.
export function qualifies(list, score) {
  if (score <= 0) return false;
  if (list.length < LB_MAX) return true;
  return score > list[list.length - 1].s;
}

// Insert a new score, re-sort, cap to LB_MAX. Returns { list, row } where `row`
// is the inserted entry (by reference) so callers can highlight it.
export function insertScore(list, initials, score) {
  const row = {
    i: String(initials || "AAA")
      .toUpperCase()
      .slice(0, 3),
    s: score,
  };
  const next = [...list, row].sort((a, b) => b.s - a.s).slice(0, LB_MAX);
  return { list: next, row };
}

// Display helper: render a charset index, showing space as an underscore.
export function dispChar(idx) {
  const c = LETTERS[idx];
  return c === " " ? "_" : c;
}

/* ── global top-10 board (no server) ────────────────────────
 * The global board is public/tunnel-leaderboard.json, committed to the repo
 * by .github/workflows/leaderboard.yml when a player submits a qualifying
 * score as a GitHub issue. This module only reads the JSON and builds the
 * prefilled issue URL; the write path lives entirely in the workflow.
 */

export const GLOBAL_LB_URL = "/tunnel-leaderboard.json";
export const REPO_URL =
  "https://github.com/ampactor-labs/ampactor-labs.github.io";
export const GLOBAL_SCORE_CAP = 9999999; // 7 digits — matches the workflow regex

// Fetch and normalize the global board. Returns a sorted entry list in the
// local {i, s} shape, or null when unreachable (offline, dev without file).
export async function fetchGlobalLeaderboard() {
  try {
    const res = await fetch(GLOBAL_LB_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.scores)) return null;
    return data.scores
      .filter((e) => e && typeof e.s === "number" && typeof e.i === "string")
      .map((e) => ({
        i: String(e.i).toUpperCase().slice(0, 3),
        s: Math.max(0, Math.floor(e.s)),
      }))
      .sort((a, b) => b.s - a.s)
      .slice(0, LB_MAX);
  } catch {
    return null;
  }
}

// Same qualifying rule as the local board, but null-safe: no fetched board
// means nothing to qualify for.
export function qualifiesGlobal(globalList, score) {
  if (!globalList) return false;
  return qualifies(globalList, score);
}

// Prefilled GitHub issue URL — the title is the payload the workflow parses.
// Spaces in initials travel as "_" so GitHub's title trimming can't eat them.
export function buildScoreIssueUrl(initials, score) {
  const wire = String(initials || "AAA")
    .toUpperCase()
    .slice(0, 3)
    .replaceAll(" ", "_");
  const capped = Math.min(Math.max(1, Math.floor(score)), GLOBAL_SCORE_CAP);
  const title = `[tunnel-run] ${wire} ${capped}`;
  const body = [
    "TUNNEL_RUN score submission for the global top 10.",
    "",
    "The title is the payload — do not edit it. Just press Submit new issue.",
    "A workflow validates the score, commits it to the board, and closes",
    "this issue. Your initials appear in the cabinet after the next deploy.",
  ].join("\n");
  return `${REPO_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
