import {
  EMPTY_FILTER,
  type LedgerFilter,
  type SortKey,
  type SortSpec,
} from "./ledger";

// Every view of the ledger is a link. The filter and the sort live in the
// query string, defaults are omitted so the plain URL stays plain, and
// anything unparseable falls back to the default rather than breaking the page.

export type { SortKey, SortSpec } from "./ledger";

export interface LedgerViewState {
  filter: LedgerFilter;
  sort: SortSpec;
}

export const DEFAULT_SORT: SortSpec = { key: "date", desc: true };

const SORT_KEYS: readonly SortKey[] = [
  "date",
  "repo",
  "subject",
  "author",
  "additions",
  "deletions",
  "files",
];

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const REPO_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

export function parseViewState(search: string): LedgerViewState {
  const params = new URLSearchParams(search);
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const repos = (params.get("repo") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => REPO_ID.test(s));
  const q = (params.get("q") ?? "").slice(0, 120);
  const merges = params.get("merges") !== "0";
  const sortRaw = params.get("sort") ?? "";
  const desc = sortRaw.startsWith("-");
  const key = sortRaw.replace(/^-/, "") as SortKey;
  const validFrom = from && MONTH.test(from) ? from : undefined;
  const validTo = to && MONTH.test(to) ? to : undefined;
  return {
    filter: {
      from: validFrom && validTo && validFrom > validTo ? validTo : validFrom,
      to: validTo,
      repos: [...new Set(repos)],
      q,
      merges,
    },
    sort: SORT_KEYS.includes(key) ? { key, desc } : { ...DEFAULT_SORT },
  };
}

export function serializeViewState(state: LedgerViewState): string {
  const params = new URLSearchParams();
  const { filter, sort } = state;
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  if (filter.repos.length) params.set("repo", filter.repos.join(","));
  if (filter.q.trim()) params.set("q", filter.q.trim());
  if (!filter.merges) params.set("merges", "0");
  if (sort.key !== DEFAULT_SORT.key || sort.desc !== DEFAULT_SORT.desc) {
    params.set("sort", `${sort.desc ? "-" : ""}${sort.key}`);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const DEFAULT_VIEW: LedgerViewState = {
  filter: { ...EMPTY_FILTER },
  sort: { ...DEFAULT_SORT },
};

export function isDefaultView(state: LedgerViewState): boolean {
  return serializeViewState(state) === "";
}
