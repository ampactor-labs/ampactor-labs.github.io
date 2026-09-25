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

export function useLedger(url: string = LEDGER_URL): {
  status: LedgerStatus;
  retry: () => void;
} {
  const [status, setStatus] = useState<LedgerStatus>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
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
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, attempt]);

  const retry = useCallback(() => {
    setStatus({ state: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { status, retry };
}
