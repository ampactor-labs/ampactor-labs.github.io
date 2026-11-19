// A tab left open across a deploy still runs the old page, whose lazy chunks
// GitHub Pages deleted with the deploy: the next screen it opens fails to
// load. One reload fetches the new page and its chunks. The timestamp keeps a
// chunk that is missing for any other reason from reloading in a loop.

const KEY = "ampactor_chunk_reload";
const WINDOW_MS = 10_000;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(
    message,
  );
}

// Reloads once and returns true; returns false when a reload already
// happened moments ago, so the caller shows its fallback instead.
export function reloadOnce(): boolean {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(KEY) || 0);
  } catch {
    /* storage blocked: reload anyway, once per page */
  }
  if (Date.now() - last < WINDOW_MS) return false;
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  window.location.reload();
  return true;
}

// Vite dispatches this when a dynamic import's preload fails.
export function recoverStaleChunks(): void {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadOnce()) event.preventDefault();
  });
}
