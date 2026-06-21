// Theme activation seam. The dark "Patina Dark" theme is the default (no attribute);
// the light theme is opt-in via data-theme="patina-light" on <html>.
//
// applyTheme() reads a persisted choice from localStorage and applies it at startup.
// Nothing writes "ampactor_theme" yet — the light theme is wired and ready, not shipped
// (the arcade cabinet is still dark-only). A future toggle persists the key here and
// calls applyTheme() to flip live. To preview light now: in the console run
//   localStorage.setItem("ampactor_theme", "patina-light"); location.reload();

const STORAGE_KEY = "ampactor_theme";
const VALID = new Set(["patina-light"]); // dark is the attribute-absent default

export function applyTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode / blocked storage — fall through to the dark default.
  }
  if (stored && VALID.has(stored)) {
    document.documentElement.setAttribute("data-theme", stored);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}
