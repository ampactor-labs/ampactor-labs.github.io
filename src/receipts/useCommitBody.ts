import { useEffect, useState } from "react";
import { bodyKey, bodyShardUrl, type LedgerCommit } from "./ledger";

// Message bodies live in 256 small shards keyed by the sha's first two
// characters; a shard is fetched once per page and shared across commits.
const shards = new Map<string, Promise<Record<string, string>>>();

function loadShard(url: string): Promise<Record<string, string>> {
  let pending = shards.get(url);
  if (!pending) {
    pending = fetch(url).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Record<string, string>;
    });
    pending.catch(() => shards.delete(url));
    shards.set(url, pending);
  }
  return pending;
}

export type BodyState =
  | { status: "idle" }
  | { status: "none" }
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "error" };

export function useCommitBody(commit: LedgerCommit | null): {
  state: BodyState;
  retry: () => void;
} {
  const key = commit ? bodyKey(commit) : null;
  const [loaded, setLoaded] = useState<{
    key: string;
    state: BodyState;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!commit || !commit.hasBody) return;
    let cancelled = false;
    const k = bodyKey(commit);
    loadShard(bodyShardUrl(commit.sha))
      .then((shard) => {
        if (cancelled) return;
        const body = shard[k];
        setLoaded({
          key: k,
          state: body ? { status: "ready", body } : { status: "none" },
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: k, state: { status: "error" } });
      });
    return () => {
      cancelled = true;
    };
  }, [commit, attempt]);

  let state: BodyState;
  if (!commit || !key) state = { status: "idle" };
  else if (!commit.hasBody) state = { status: "none" };
  else if (loaded && loaded.key === key) state = loaded.state;
  else state = { status: "loading" };

  return { state, retry: () => setAttempt((n) => n + 1) };
}
