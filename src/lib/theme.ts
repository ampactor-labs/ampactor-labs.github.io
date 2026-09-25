// Theme resolution and persistence. The palette itself lives in
// public/tokens.css (dark by default, light under [data-theme="patina-light"]);
// this module only decides which attribute the <html> element carries.
//
// Resolution order: an explicit choice stored under `ampactor_theme` wins,
// otherwise the system preference. PREPAINT_SCRIPT applies the same rule
// before first paint so a light-theme visitor never sees a dark flash; keep
// the two in sync.

export type Theme = "patina-dark" | "patina-light";

export const THEME_STORAGE_KEY = "ampactor_theme";
export const LIGHT_ATTRIBUTE_VALUE = "patina-light";

const THEMES: readonly Theme[] = ["patina-dark", "patina-light"];

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function systemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "patina-dark";
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "patina-light"
    : "patina-dark";
}

export function resolveTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

// Dark is the palette's default, so it is the absence of the attribute.
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "patina-light") {
    root.setAttribute("data-theme", LIGHT_ATTRIBUTE_VALUE);
  } else {
    root.removeAttribute("data-theme");
  }
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") ===
    LIGHT_ATTRIBUTE_VALUE
    ? "patina-light"
    : "patina-dark";
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const next: Theme =
    currentTheme() === "patina-light" ? "patina-dark" : "patina-light";
  setTheme(next);
  return next;
}

// Inlined into every entry's <head> by the Vite head plugin. Runs before
// the stylesheet paints, mirrors resolveTheme(), and must stay dependency-free.
export const PREPAINT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}",t=localStorage.getItem(k);if(t!=="patina-light"&&t!=="patina-dark")t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"patina-light":"patina-dark";if(t==="patina-light")document.documentElement.setAttribute("data-theme","${LIGHT_ATTRIBUTE_VALUE}")}catch(e){}})();`;
