import { describe, it, expect, beforeEach } from "vitest";
import {
  LB_KEY,
  LEGACY_HI_KEY,
  LB_MAX,
  loadLeaderboard,
  saveLeaderboard,
  qualifies,
  insertScore,
  dispChar,
  LETTERS,
} from "../tunnelLeaderboard";

beforeEach(() => {
  localStorage.clear();
});

describe("loadLeaderboard", () => {
  it("returns an empty board when nothing is stored", () => {
    expect(loadLeaderboard()).toEqual([]);
  });

  it("migrates the legacy single high score once", () => {
    localStorage.setItem(LEGACY_HI_KEY, "4200");
    expect(loadLeaderboard()).toEqual([{ i: "AMP", s: 4200 }]);
  });

  it("does not migrate the legacy score once a board exists", () => {
    localStorage.setItem(LEGACY_HI_KEY, "4200");
    localStorage.setItem(LB_KEY, JSON.stringify([{ i: "ZED", s: 100 }]));
    const list = loadLeaderboard();
    expect(list).toEqual([{ i: "ZED", s: 100 }]);
  });

  it("sorts descending and caps at LB_MAX", () => {
    const stored = Array.from({ length: 15 }, (_, n) => ({
      i: "AAA",
      s: n * 10,
    }));
    localStorage.setItem(LB_KEY, JSON.stringify(stored));
    const list = loadLeaderboard();
    expect(list).toHaveLength(LB_MAX);
    expect(list[0].s).toBe(140);
    expect(list[LB_MAX - 1].s).toBe(50);
  });

  it("survives malformed JSON", () => {
    localStorage.setItem(LB_KEY, "{not valid json");
    expect(loadLeaderboard()).toEqual([]);
  });

  it("drops malformed entries and normalizes initials", () => {
    localStorage.setItem(
      LB_KEY,
      JSON.stringify([
        { i: "abcd", s: 50 },
        { nope: true },
        { i: "x", s: "10" },
      ]),
    );
    expect(loadLeaderboard()).toEqual([{ i: "ABC", s: 50 }]);
  });
});

describe("qualifies", () => {
  it("rejects zero and negative scores", () => {
    expect(qualifies([], 0)).toBe(false);
    expect(qualifies([], -5)).toBe(false);
  });

  it("accepts any positive score while the board has room", () => {
    expect(qualifies([{ i: "AAA", s: 99999 }], 1)).toBe(true);
  });

  it("only accepts a score that beats the lowest on a full board", () => {
    // Descending-sorted, as the board always is in practice: 1000..100.
    const full = Array.from({ length: LB_MAX }, (_, n) => ({
      i: "AAA",
      s: (LB_MAX - n) * 100,
    }));
    expect(full[full.length - 1].s).toBe(100); // lowest entry is last
    expect(qualifies(full, 100)).toBe(false); // tie does not qualify
    expect(qualifies(full, 101)).toBe(true);
  });
});

describe("insertScore", () => {
  it("inserts, sorts, and caps; returns the inserted row by reference", () => {
    const start = [
      { i: "AAA", s: 300 },
      { i: "BBB", s: 100 },
    ];
    const { list, row } = insertScore(start, "zzz", 200);
    expect(row).toEqual({ i: "ZZZ", s: 200 });
    expect(list.map((e) => e.s)).toEqual([300, 200, 100]);
    expect(list).toContain(row); // identity preserved for highlight
    expect(start).toHaveLength(2); // original not mutated
  });

  it("caps the inserted board at LB_MAX", () => {
    const full = Array.from({ length: LB_MAX }, () => ({ i: "AAA", s: 500 }));
    const { list } = insertScore(full, "NEW", 9999);
    expect(list).toHaveLength(LB_MAX);
    expect(list[0]).toEqual({ i: "NEW", s: 9999 });
  });
});

describe("saveLeaderboard", () => {
  it("round-trips through storage and mirrors the top score to the legacy key", () => {
    const list = [
      { i: "ONE", s: 900 },
      { i: "TWO", s: 200 },
    ];
    saveLeaderboard(list);
    expect(JSON.parse(localStorage.getItem(LB_KEY))).toEqual(list);
    expect(localStorage.getItem(LEGACY_HI_KEY)).toBe("900");
    expect(loadLeaderboard()).toEqual(list);
  });
});

describe("dispChar", () => {
  it("renders a space as an underscore", () => {
    const spaceIdx = LETTERS.indexOf(" ");
    expect(dispChar(spaceIdx)).toBe("_");
    expect(dispChar(0)).toBe("A");
  });
});
