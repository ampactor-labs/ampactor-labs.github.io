// The first visit to the floor opens inside the cabinet: the machine powers
// on in the dark, starts to boot, and the camera pulls back to the room. Once.
//
// Whether it runs is decided before first paint by COLD_OPEN_SCRIPT (inlined
// into the floor's <head> by vite.config.js). It marks <html> with
// `data-cold-open`, so the room is already dark in either theme when the page
// first paints (global.css), and the app reads that mark instead of deciding
// again. It never runs for a returning visitor, a floor anchor (/#work is a
// destination), the arcade's own URL, or under reduced motion.

export const VISITED_KEY = "ampactor_visited";
export const COLD_OPEN_ATTRIBUTE = "data-cold-open";

// Power-on (about 1.3 s), the test pattern, the first boot lines; then the
// camera pulls back, slower than an ordinary exit.
export const COLD_OPEN_SECONDS = 2.3;
export const PULLBACK_SECONDS = 0.9;

export const COLD_OPEN_SCRIPT = `(function(){try{var l=location;if(l.pathname!=="/"&&l.pathname!=="/index.html")return;if(l.hash.length>1)return;if(localStorage.getItem("${VISITED_KEY}"))return;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.setAttribute("${COLD_OPEN_ATTRIBUTE}","")}catch(e){}})();`;

export function isColdOpenPending(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute(COLD_OPEN_ATTRIBUTE)
  );
}

// The lights come back on: the room drops the dark it was held in.
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
