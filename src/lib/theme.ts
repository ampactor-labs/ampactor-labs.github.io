// Theme resolution. The pages' palette lives in src/styles/theme.css (the
// cabinet's indigo by default, lilac paper under [data-theme="patina-light"]);
// this module only decides which attribute the <html> element carries. There
// is no light switch: the pages follow the system preference, and a choice
// stored by the old switch is ignored. PREPAINT_SCRIPT applies the same rule
// before first paint so a light-theme visitor never sees a dark flash; keep
// the two in sync.

export type Theme = "patina-dark" | "patina-light";

export const LIGHT_ATTRIBUTE_VALUE = "patina-light";

export function systemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "patina-dark";
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "patina-light"
    : "patina-dark";
}

export function resolveTheme(): Theme {
  return systemTheme();
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

// Inlined into every entry's <head> by the Vite head plugin. Runs before
// the stylesheet paints, mirrors resolveTheme(), and must stay dependency-free.
export const PREPAINT_SCRIPT = `(function(){try{if(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.setAttribute("data-theme","${LIGHT_ATTRIBUTE_VALUE}")}catch(e){}})();`;
