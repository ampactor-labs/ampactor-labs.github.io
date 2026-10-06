import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyTheme,
  currentTheme,
  resolveTheme,
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

  it("follows the system preference", () => {
    expect(resolveTheme()).toBe("patina-dark");
    mockSystemPreference(true);
    expect(resolveTheme()).toBe("patina-light");
  });

  it("ignores a choice stored by the old light switch", () => {
    localStorage.setItem("ampactor_theme", "patina-light");
    expect(resolveTheme()).toBe("patina-dark");
  });

  it("marks <html> only for the light theme", () => {
    applyTheme("patina-light");
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "patina-light",
    );
    expect(currentTheme()).toBe("patina-light");
    applyTheme("patina-dark");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(currentTheme()).toBe("patina-dark");
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
    localStorage.setItem("ampactor_theme", "patina-dark");
    expect(run()).toBe("patina-light");
  });
});
