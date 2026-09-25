// The ledger's data model and the pure operations on it: filtering,
// aggregation, totals, and export. No DOM, no React; everything here is unit
// tested and shared by the tiles, the charts, the table and the export form,
// so they can never disagree about a number.

export interface LedgerRepo {
  id: string;
  repo: string;
  url: string;
  defaultBranch: string;
  languages: Record<string, number>;
  commits: number;
  firstCommit: string | null;
  lastCommit: string | null;
}

export interface LedgerCommit {
  sha: string;
  repo: string;
  date: string;
  subject: string;
  author: string;
  coAuthors: string[];
  merge: boolean;
  additions: number | null;
  deletions: number | null;
  files: number | null;
  hasBody: boolean;
  checked: string | null;
}

export interface Ledger {
  generatedAt: string;
  repos: LedgerRepo[];
  commits: LedgerCommit[];
}

export const LEDGER_URL = "/receipts/data.json";

// Message bodies are sharded by the first two characters of the sha, keyed
// "repo/sha" inside the shard (see scripts/sync-receipts.mjs).
export function bodyShardUrl(sha: string): string {
  return `/receipts/bodies/${sha.slice(0, 2)}.json`;
}

export function bodyKey(commit: Pick<LedgerCommit, "repo" | "sha">): string {
  return `${commit.repo}/${commit.sha}`;
}

export function commitUrl(
  repo: LedgerRepo | undefined,
  commit: LedgerCommit,
): string | null {
  return repo ? `${repo.url}/commit/${commit.sha}` : null;
}

// Month keys are taken from the commit's own date string, in its own
// timezone, so a late-night commit stays in the month its author made it.
export const monthOf = (iso: string): string => iso.slice(0, 7);
export const dayOf = (iso: string): string => iso.slice(0, 10);

export function isClaude(
  commit: Pick<LedgerCommit, "author" | "coAuthors">,
): boolean {
  return (
    /^claude\b/i.test(commit.author) ||
    commit.coAuthors.some((name) => /^claude\b/i.test(name))
  );
}

export interface LedgerFilter {
  // Inclusive month bounds, "YYYY-MM"; undefined means unbounded.
  from?: string;
  to?: string;
  // Repo ids; empty means every repository.
  repos: string[];
  // Case-insensitive substring of the subject.
  q: string;
  merges: boolean;
}

export const EMPTY_FILTER: LedgerFilter = { repos: [], q: "", merges: true };

export function applyFilter(
  commits: LedgerCommit[],
  f: LedgerFilter,
): LedgerCommit[] {
  const q = f.q.trim().toLowerCase();
  const repoSet = f.repos.length ? new Set(f.repos) : null;
  return commits.filter((c) => {
    const m = monthOf(c.date);
    if (f.from && m < f.from) return false;
    if (f.to && m > f.to) return false;
    if (repoSet && !repoSet.has(c.repo)) return false;
    if (!f.merges && c.merge) return false;
    if (q && !c.subject.toLowerCase().includes(q)) return false;
    return true;
  });
}

export interface MonthRow {
  month: string;
  commits: number;
  additions: number;
  deletions: number;
}

// Every month from `from` to `to` inclusive, zeros included, so a quiet month
// shows as a quiet month. Bounds default to the data's own span.
export function aggregateByMonth(
  commits: LedgerCommit[],
  bounds: { from?: string; to?: string } = {},
): MonthRow[] {
  const map = new Map<string, MonthRow>();
  for (const c of commits) {
    const key = monthOf(c.date);
    const row = map.get(key) ?? {
      month: key,
      commits: 0,
      additions: 0,
      deletions: 0,
    };
    row.commits += 1;
    row.additions += c.additions ?? 0;
    row.deletions += c.deletions ?? 0;
    map.set(key, row);
  }
  const keys = [...map.keys()].sort();
  const from = bounds.from ?? keys[0];
  const to = bounds.to ?? keys[keys.length - 1];
  if (!from || !to) return [];
  const out: MonthRow[] = [];
  for (const key of monthsBetween(from, to)) {
    out.push(
      map.get(key) ?? { month: key, commits: 0, additions: 0, deletions: 0 },
    );
  }
  return out;
}

// "2026-03" shifted by `delta` months, either direction.
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ly, lm] = to.split("-").map(Number);
  if (!y || !m || !ly || !lm) return out;
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export interface RepoRow {
  repo: string;
  commits: number;
  additions: number;
  deletions: number;
  lastCommit: string;
}

export function aggregateByRepo(commits: LedgerCommit[]): RepoRow[] {
  const map = new Map<string, RepoRow>();
  for (const c of commits) {
    const row = map.get(c.repo) ?? {
      repo: c.repo,
      commits: 0,
      additions: 0,
      deletions: 0,
      lastCommit: c.date,
    };
    row.commits += 1;
    row.additions += c.additions ?? 0;
    row.deletions += c.deletions ?? 0;
    if (c.date > row.lastCommit) row.lastCommit = c.date;
    map.set(c.repo, row);
  }
  return [...map.values()].sort(
    (a, b) => b.commits - a.commits || a.repo.localeCompare(b.repo),
  );
}

export interface Totals {
  commits: number;
  repos: number;
  additions: number;
  deletions: number;
  activeDays: number;
  withClaude: number;
  first: string | null;
  last: string | null;
}

export function totals(commits: LedgerCommit[]): Totals {
  const repos = new Set<string>();
  const days = new Set<string>();
  let additions = 0;
  let deletions = 0;
  let withClaude = 0;
  let first: string | null = null;
  let last: string | null = null;
  for (const c of commits) {
    repos.add(c.repo);
    days.add(dayOf(c.date));
    additions += c.additions ?? 0;
    deletions += c.deletions ?? 0;
    if (isClaude(c)) withClaude += 1;
    if (first === null || c.date < first) first = c.date;
    if (last === null || c.date > last) last = c.date;
  }
  return {
    commits: commits.length,
    repos: repos.size,
    additions,
    deletions,
    activeDays: days.size,
    withClaude,
    first,
    last,
  };
}

export function monthSpan(
  ledger: Pick<Ledger, "commits">,
): { first: string; last: string } | null {
  let first: string | null = null;
  let last: string | null = null;
  for (const c of ledger.commits) {
    const m = monthOf(c.date);
    if (first === null || m < first) first = m;
    if (last === null || m > last) last = m;
  }
  return first && last ? { first, last } : null;
}

// ---- Export -----------------------------------------------------------------

export type ExportFormat = "csv" | "json";
export type ExportGroup = "none" | "month" | "repo";

export interface ExportOptions {
  format: ExportFormat;
  group: ExportGroup;
  stats: boolean;
}

// RFC 4180: quote when a field holds a comma, a quote or a newline; double
// the quotes inside. Always quote text so a subject like `=SUM()` cannot be
// read as a formula by a spreadsheet.
export function csvCell(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  const s = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(
  header: string[],
  rows: (string | number | boolean | null)[][],
): string {
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return lines.join("\r\n") + "\r\n";
}

export function exportRows(
  commits: LedgerCommit[],
  options: ExportOptions,
): {
  header: string[];
  rows: (string | number | boolean | null)[][];
  objects: Record<string, unknown>[];
} {
  const { group, stats } = options;
  if (group === "month") {
    const rows = aggregateByMonth(commits);
    const header = [
      "month",
      "commits",
      ...(stats ? ["additions", "deletions"] : []),
    ];
    return {
      header,
      rows: rows.map((r) => [
        r.month,
        r.commits,
        ...(stats ? [r.additions, r.deletions] : []),
      ]),
      objects: rows.map((r) =>
        stats
          ? {
              month: r.month,
              commits: r.commits,
              additions: r.additions,
              deletions: r.deletions,
            }
          : { month: r.month, commits: r.commits },
      ),
    };
  }
  if (group === "repo") {
    const rows = aggregateByRepo(commits);
    const header = [
      "repo",
      "commits",
      ...(stats ? ["additions", "deletions"] : []),
      "last_commit",
    ];
    return {
      header,
      rows: rows.map((r) => [
        r.repo,
        r.commits,
        ...(stats ? [r.additions, r.deletions] : []),
        r.lastCommit,
      ]),
      objects: rows.map((r) =>
        stats
          ? {
              repo: r.repo,
              commits: r.commits,
              additions: r.additions,
              deletions: r.deletions,
              lastCommit: r.lastCommit,
            }
          : { repo: r.repo, commits: r.commits, lastCommit: r.lastCommit },
      ),
    };
  }
  const header = [
    "sha",
    "repo",
    "date",
    "subject",
    "author",
    "co_authors",
    "merge",
    ...(stats ? ["additions", "deletions", "files"] : []),
  ];
  return {
    header,
    rows: commits.map((c) => [
      c.sha,
      c.repo,
      c.date,
      c.subject,
      c.author,
      c.coAuthors.join("; "),
      c.merge,
      ...(stats ? [c.additions, c.deletions, c.files] : []),
    ]),
    objects: commits.map((c) => {
      const o: Record<string, unknown> = {
        sha: c.sha,
        repo: c.repo,
        date: c.date,
        subject: c.subject,
        author: c.author,
        coAuthors: c.coAuthors,
        merge: c.merge,
      };
      if (stats)
        Object.assign(o, {
          additions: c.additions,
          deletions: c.deletions,
          files: c.files,
        });
      return o;
    }),
  };
}

export function serializeExport(
  commits: LedgerCommit[],
  options: ExportOptions,
): string {
  const { header, rows, objects } = exportRows(commits, options);
  return options.format === "csv"
    ? toCsv(header, rows)
    : JSON.stringify(objects, null, 2) + "\n";
}

export function exportFilename(
  options: ExportOptions,
  filter: LedgerFilter,
): string {
  const parts = ["receipts"];
  if (filter.repos.length === 1) parts.push(filter.repos[0]!);
  if (filter.from || filter.to)
    parts.push(`${filter.from ?? "start"}_${filter.to ?? "now"}`);
  if (options.group !== "none") parts.push(`by-${options.group}`);
  return `${parts.join("-")}.${options.format}`;
}

// ---- Sorting ----------------------------------------------------------------

// The table's sort lives in the URL and is applied here, once, so the table,
// the export and a shared link all agree on the order of the rows.
export type SortKey =
  | "date"
  | "repo"
  | "subject"
  | "author"
  | "additions"
  | "deletions"
  | "files";

export interface SortSpec {
  key: SortKey;
  desc: boolean;
}

const byText = (a: string, b: string) =>
  a.localeCompare(b, "en", { sensitivity: "base" });

// Missing stats (merge commits) sort last whichever way the column points.
const byNumber = (a: number | null, b: number | null, dir: 1 | -1) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir * (a - b);
};

export function sortCommits(
  commits: LedgerCommit[],
  sort: SortSpec,
): LedgerCommit[] {
  const dir: 1 | -1 = sort.desc ? -1 : 1;
  const primary = (a: LedgerCommit, b: LedgerCommit): number => {
    switch (sort.key) {
      case "date":
        return dir * (Date.parse(a.date) - Date.parse(b.date));
      case "repo":
        return dir * byText(a.repo, b.repo);
      case "subject":
        return dir * byText(a.subject, b.subject);
      case "author":
        return dir * byText(a.author, b.author);
      case "additions":
        return byNumber(a.additions, b.additions, dir);
      case "deletions":
        return byNumber(a.deletions, b.deletions, dir);
      case "files":
        return byNumber(a.files, b.files, dir);
    }
  };
  return [...commits].sort(
    (a, b) =>
      primary(a, b) ||
      Date.parse(b.date) - Date.parse(a.date) ||
      a.sha.localeCompare(b.sha),
  );
}
