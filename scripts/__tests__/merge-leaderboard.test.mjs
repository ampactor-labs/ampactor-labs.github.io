import { describe, it, expect } from "vitest";
import {
  parseTitle,
  readBoard,
  mergeScore,
  BOARD_MAX,
} from "../merge-leaderboard.mjs";

// Full board: 10000 down to 1000.
const fullBoard = () =>
  Array.from({ length: BOARD_MAX }, (_, n) => ({
    i: "AAA",
    s: (BOARD_MAX - n) * 1000,
    user: `u${n}`,
    date: "2026-07-01",
  }));

describe("parseTitle", () => {
  it("parses a well-formed title", () => {
    expect(parseTitle("[tunnel-run] MOR 48210")).toEqual({
      initials: "MOR",
      score: 48210,
    });
  });

  it("tolerates surrounding whitespace and extra separators", () => {
    expect(parseTitle("  [tunnel-run]   A._   7  ")).toEqual({
      initials: "A._",
      score: 7,
    });
  });

  it("accepts the full wire charset (A-Z 0-9 . _)", () => {
    expect(parseTitle("[tunnel-run] 9_Z 100")).toEqual({
      initials: "9_Z",
      score: 100,
    });
  });

  it.each([
    ["missing prefix", "MOR 48210"],
    ["lowercase initials", "[tunnel-run] mor 48210"],
    ["two-char initials", "[tunnel-run] MO 48210"],
    ["four-char initials", "[tunnel-run] MORE 48210"],
    ["eight-digit score", "[tunnel-run] MOR 12345678"],
    ["non-numeric score", "[tunnel-run] MOR over9000"],
    ["trailing garbage", "[tunnel-run] MOR 48210; rm -rf /"],
    ["empty", ""],
    ["null-ish", null],
  ])("rejects %s", (_label, title) => {
    expect(parseTitle(title)).toBeNull();
  });
});

describe("readBoard", () => {
  it("returns [] for corrupt JSON", () => {
    expect(readBoard("not json")).toEqual([]);
  });

  it("returns [] when scores is missing", () => {
    expect(readBoard('{"updated":null}')).toEqual([]);
  });

  it("drops malformed rows, sorts descending, caps at BOARD_MAX", () => {
    const scores = [
      { i: "LOW", s: 1 },
      { bogus: true },
      ...Array.from({ length: 12 }, (_, n) => ({ i: "AAA", s: n + 10 })),
    ];
    const board = readBoard(JSON.stringify({ scores }));
    expect(board).toHaveLength(BOARD_MAX);
    expect(board[0].s).toBe(21);
    expect(board.every((e, n) => n === 0 || board[n - 1].s >= e.s)).toBe(true);
  });
});

describe("mergeScore", () => {
  const entry = (over = {}) => ({
    initials: "MOR",
    score: 5500,
    user: "morgan",
    date: "2026-07-10",
    ...over,
  });

  it("inserts into an empty board at rank 1", () => {
    const r = mergeScore([], entry());
    expect(r.accepted).toBe(true);
    expect(r.rank).toBe(1);
    expect(r.scores).toEqual([
      { i: "MOR", s: 5500, user: "morgan", date: "2026-07-10" },
    ]);
  });

  it("rejects a non-positive score", () => {
    expect(mergeScore([], entry({ score: 0 })).accepted).toBe(false);
  });

  it("accepts below-last scores while the board has room", () => {
    const nine = fullBoard().slice(0, 9);
    const r = mergeScore(nine, entry({ score: 5 }));
    expect(r.accepted).toBe(true);
    expect(r.rank).toBe(10);
  });

  it("rejects a score that ties #10 on a full board", () => {
    const r = mergeScore(fullBoard(), entry({ score: 1000 }));
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/did not beat/);
  });

  it("accepts a score that beats #10 and drops the old #10", () => {
    const r = mergeScore(fullBoard(), entry({ score: 5500 }));
    expect(r.accepted).toBe(true);
    expect(r.rank).toBe(6);
    expect(r.scores).toHaveLength(BOARD_MAX);
    expect(r.scores.some((e) => e.s === 1000)).toBe(false);
  });

  it("ranks a mid-board tie below the existing equal score", () => {
    const r = mergeScore(fullBoard(), entry({ score: 6000 }));
    expect(r.accepted).toBe(true);
    // existing 6000 sits at rank 5; the newcomer lands right after it
    expect(r.rank).toBe(6);
    expect(r.scores[4]).toMatchObject({ i: "AAA", s: 6000 });
    expect(r.scores[5]).toMatchObject({ i: "MOR", s: 6000 });
  });

  it("rejects an exact duplicate of an existing entry", () => {
    const board = [{ i: "MOR", s: 5500, user: "morgan", date: "2026-07-01" }];
    const r = mergeScore(board, entry());
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/already on the board/);
  });
});
