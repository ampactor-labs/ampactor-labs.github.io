import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  COLD_OPEN_ATTRIBUTE,
  COLD_OPEN_SCRIPT,
  VISITED_KEY,
  clearColdOpen,
  hasVisited,
  isColdOpenPending,
  markVisited,
} from "../coldOpen";

// The pre-paint script decides once, before first paint; these are its rules.
function runAt(url: string): boolean {
  window.history.replaceState(null, "", url);
  document.documentElement.removeAttribute(COLD_OPEN_ATTRIBUTE);
  new Function(COLD_OPEN_SCRIPT)();
  return isColdOpenPending();
}

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

describe("the cold open", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    mockReducedMotion(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.removeAttribute(COLD_OPEN_ATTRIBUTE);
    window.history.replaceState(null, "", "/");
  });

  it("runs on a first visit to the floor, whatever the query string", () => {
    expect(runAt("/")).toBe(true);
    expect(runAt("/index.html")).toBe(true);
    expect(runAt("/?ref=linkedin")).toBe(true);
    expect(runAt("/#")).toBe(true);
  });

  it("never runs for an anchor, another page, a returning visitor or reduced motion", () => {
    expect(runAt("/#work")).toBe(false);
    expect(runAt("/arcade/")).toBe(false);
    expect(runAt("/arcade/#mentl")).toBe(false);
    expect(runAt("/receipts/")).toBe(false);

    localStorage.setItem(VISITED_KEY, "1");
    expect(runAt("/")).toBe(false);
    localStorage.clear();

    mockReducedMotion(true);
    expect(runAt("/")).toBe(false);
  });

  it("stays out of the way when storage is blocked", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(() => runAt("/")).not.toThrow();
    expect(isColdOpenPending()).toBe(false);
    expect(hasVisited()).toBe(false);
    spy.mockRestore();

    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(() => markVisited()).not.toThrow();
    set.mockRestore();
  });

  it("marks the visit and turns the lights back on", () => {
    expect(runAt("/")).toBe(true);
    markVisited();
    clearColdOpen();
    expect(hasVisited()).toBe(true);
    expect(isColdOpenPending()).toBe(false);
    expect(runAt("/")).toBe(false);
  });
});
