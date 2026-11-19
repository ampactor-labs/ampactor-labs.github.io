import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useArcadeHistory } from "../useArcadeHistory";
import { SELECT_ROUTE, projectRoute, stateFor } from "../arcadeRoute";

// jsdom keeps one history per test file; each test starts from a fresh entry
// on the list.
beforeEach(() => {
  window.history.replaceState(null, "", "/arcade/");
});

describe("useArcadeHistory", () => {
  it("a deep link gets a list entry beneath it", () => {
    window.history.replaceState(null, "", "/arcade/#mentl");
    const before = window.history.length;
    renderHook(() => useArcadeHistory(projectRoute("mentl")));
    expect(window.history.length).toBe(before + 1);
    expect(window.history.state).toEqual(stateFor(projectRoute("mentl")));
  });

  // A reload keeps history.state; the list entry the cabinet laid down is
  // still beneath it, so the reload must not lay another.
  it("a reload of a cartridge adds no entry", () => {
    window.history.replaceState(
      stateFor(projectRoute("mentl")),
      "",
      "/arcade/#mentl",
    );
    const before = window.history.length;
    renderHook(() => useArcadeHistory(projectRoute("mentl")));
    expect(window.history.length).toBe(before);
    expect(window.history.state).toEqual(stateFor(projectRoute("mentl")));
  });

  it("two opens of the same cartridge push one entry", () => {
    const { result } = renderHook(() => useArcadeHistory(SELECT_ROUTE));
    const before = window.history.length;
    act(() => {
      result.current.navigate({ type: "open", id: "mentl" });
      result.current.navigate({ type: "open", id: "mentl" });
    });
    expect(window.history.length).toBe(before + 1);
    expect(result.current.route).toEqual(projectRoute("mentl"));
  });
});
