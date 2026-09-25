import { describe, it, expect } from "vitest";
import {
  DEFAULT_VIEW,
  isDefaultView,
  parseViewState,
  serializeViewState,
} from "../urlState";

describe("urlState", () => {
  it("round-trips a full view", () => {
    const state = {
      filter: {
        from: "2026-03",
        to: "2026-06",
        repos: ["mentl", "sonido"],
        q: "bootstrap",
        merges: false,
      },
      sort: { key: "additions" as const, desc: false },
    };
    const s = serializeViewState(state);
    expect(s).toBe(
      "?from=2026-03&to=2026-06&repo=mentl%2Csonido&q=bootstrap&merges=0&sort=additions",
    );
    expect(parseViewState(s)).toEqual(state);
  });

  it("leaves the plain URL plain", () => {
    expect(serializeViewState(DEFAULT_VIEW)).toBe("");
    expect(isDefaultView(parseViewState(""))).toBe(true);
    expect(isDefaultView(parseViewState("?sort=-date"))).toBe(true);
  });

  it("ignores garbage and clamps a reversed range", () => {
    const state = parseViewState(
      "?from=2026-13&to=2026-02&repo=..%2F..%2Fetc,mentl,mentl&sort=nope&q=" +
        "x".repeat(500),
    );
    expect(state.filter.from).toBeUndefined();
    expect(state.filter.to).toBe("2026-02");
    expect(state.filter.repos).toEqual(["mentl"]);
    expect(state.filter.q).toHaveLength(120);
    expect(state.sort).toEqual({ key: "date", desc: true });

    const reversed = parseViewState("?from=2026-06&to=2026-03");
    expect(reversed.filter.from).toBe("2026-03");
    expect(reversed.filter.to).toBe("2026-03");
  });

  it("reads a descending sort from the leading minus", () => {
    expect(parseViewState("?sort=-repo").sort).toEqual({
      key: "repo",
      desc: true,
    });
    expect(parseViewState("?sort=subject").sort).toEqual({
      key: "subject",
      desc: false,
    });
  });
});
