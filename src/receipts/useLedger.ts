import { useCallback, useEffect, useState } from "react";
import { LEDGER_URL, type Ledger } from "./ledger";

// Loads the ledger once per page. The three states are the page's three
// faces: a skeleton, an error with a retry, or the data.
export type LedgerStatus =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; ledger: Ledger };

function isLedger(value: unknown): value is Ledger {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.generatedAt === "string" &&
    Array.isArray(v.repos) &&
    Array.isArray(v.commits)
  );
}

// Runs `start` once the page's first paint with words in it is on screen.
// Text waits for its web font (font-display: swap hides it briefly), so that
// paint comes when the fonts land; after them, a timeout queued from inside
// requestAnimationFrame fires once the next frame has painted. A hidden page
// paints nothing, so there it starts at once.
function afterFirstPaint(start: () => void): () => void {
  let cancelled = false;
  let scheduled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ceiling: ReturnType<typeof setTimeout> | undefined;
  const later = () => {
    if (!cancelled) timer = setTimeout(start, 0);
  };
  const nextFrame = () => {
    if (cancelled || scheduled) return;
    scheduled = true;
    requestAnimationFrame(later);
  };
  const fonts = document.fonts as FontFaceSet | undefined;
  if (document.visibilityState === "hidden") {
    scheduled = true;
    later();
  } else if (fonts && fonts.status === "loading") {
    fonts.ready.then(nextFrame, nextFrame);
    // A font that stalls never holds the data back for long.
    ceiling = setTimeout(nextFrame, 1500);
  } else {
    nextFrame();
  }
  return () => {
    cancelled = true;
    if (timer !== undefined) clearTimeout(timer);
    if (ceiling !== undefined) clearTimeout(ceiling);
  };
}

export function useLedger(url: string = LEDGER_URL): {
  status: LedgerStatus;
  retry: () => void;
} {
  const [status, setStatus] = useState<LedgerStatus>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  // The page paints its head from the build's summary first; the ledger, by
  // far the largest thing it downloads, is asked for once that paint is on
  // screen, so on a slow connection it never competes with the script and
  // the fonts the headline is waiting for.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const load = () =>
      fetch(url, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok)
            throw new Error(`The ledger came back as HTTP ${res.status}.`);
          const json: unknown = await res.json();
          if (!isLedger(json))
            throw new Error("The ledger file has an unexpected shape.");
          return json;
        })
        .then((ledger) => {
          if (!cancelled) setStatus({ state: "ready", ledger });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          setStatus({
            state: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        });
    const cancelStart = afterFirstPaint(load);
    return () => {
      cancelled = true;
      cancelStart();
      controller.abort();
    };
  }, [url, attempt]);

  const retry = useCallback(() => {
    setStatus({ state: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { status, retry };
}
