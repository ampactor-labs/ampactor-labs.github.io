// The first-visit animation ("cold open"): on a first visit to the home page,
// the page opens with the cabinet full screen as it powers on and starts to
// boot, then zooms out to the page. It runs once per browser.
//
// Whether it runs is decided before first paint by COLD_OPEN_SCRIPT, which
// vite.config.js inlines into the home page's <head>. It marks <html> with
// `data-cold-open`, so the background is already dark in either theme on the
// first paint (global.css), and the app reads that mark instead of deciding
// again. It never runs for a returning visitor, a link to a section of the
// home page (such as /#work), the /arcade/ URL, or under reduced motion.

export const VISITED_KEY = "ampactor_visited";
export const COLD_OPEN_ATTRIBUTE = "data-cold-open";

// Power-on (about 1.3 s), the test pattern and the first boot lines, then
// the zoom out, which is slower than an ordinary exit.
export const COLD_OPEN_SECONDS = 2.3;
export const PULLBACK_SECONDS = 0.9;

export const COLD_OPEN_SCRIPT = `(function(){try{var l=location;if(l.pathname!=="/"&&l.pathname!=="/index.html")return;if(l.hash.length>1)return;if(localStorage.getItem("${VISITED_KEY}"))return;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.setAttribute("${COLD_OPEN_ATTRIBUTE}","")}catch(e){}})();`;

export function isColdOpenPending(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute(COLD_OPEN_ATTRIBUTE)
  );
}

// Ends the animation's dark background.
export function clearColdOpen(): void {
  document.documentElement.removeAttribute(COLD_OPEN_ATTRIBUTE);
}

export function hasVisited(): boolean {
  try {
    return !!localStorage.getItem(VISITED_KEY);
  } catch {
    return false;
  }
}

export function markVisited(): void {
  try {
    localStorage.setItem(VISITED_KEY, "1");
  } catch {
    // Blocked storage: the show runs again next time, which is harmless.
  }
}
