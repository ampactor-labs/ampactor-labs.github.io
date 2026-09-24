import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyTheme,
  currentTheme,
  resolveTheme,
  setTheme,
  toggleTheme,
  THEME_STORAGE_KEY,
  PREPAINT_SCRIPT,
} from "../theme";

function mockSystemPreference(light: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: light && query.includes("light"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    mockSystemPreference(false);
  });

  it("defaults to the system preference when nothing is stored", () => {
    expect(resolveTheme()).toBe("patina-dark");
    mockSystemPreference(true);
    expect(resolveTheme()).toBe("patina-light");
  });

  it("lets a stored choice beat the system preference", () => {
    mockSystemPreference(true);
    localStorage.setItem(THEME_STORAGE_KEY, "patina-dark");
    expect(resolveTheme()).toBe("patina-dark");
  });

  it("ignores garbage in storage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon-pink");
    expect(resolveTheme()).toBe("patina-dark");
  });

  it("expresses dark as the absence of the attribute", () => {
    applyTheme("patina-light");
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "patina-light",
    );
    applyTheme("patina-dark");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("toggle persists and applies the next theme", () => {
    expect(toggleTheme()).toBe("patina-light");
    expect(currentTheme()).toBe("patina-light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("patina-light");
    expect(toggleTheme()).toBe("patina-dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("patina-dark");
  });

  it("setTheme survives blocked storage", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(() => setTheme("patina-light")).not.toThrow();
    expect(currentTheme()).toBe("patina-light");
    spy.mockRestore();
  });

  // The inline script must make the same decision as resolveTheme(), because
  // it runs first and anything else would flash.
  it("the pre-paint script agrees with resolveTheme", () => {
    const run = () => {
      document.documentElement.removeAttribute("data-theme");
      new Function(PREPAINT_SCRIPT)();
      return currentTheme();
    };
    expect(run()).toBe("patina-dark");
    mockSystemPreference(true);
    expect(run()).toBe("patina-light");
    localStorage.setItem(THEME_STORAGE_KEY, "patina-dark");
    expect(run()).toBe("patina-dark");
    localStorage.setItem(THEME_STORAGE_KEY, "patina-light");
    mockSystemPreference(false);
    expect(run()).toBe("patina-light");
  });
});
