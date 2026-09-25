import { describe, it, expect } from "vitest";
import {
  aggregateByMonth,
  aggregateByRepo,
  applyFilter,
  bodyKey,
  bodyShardUrl,
  csvCell,
  exportFilename,
  isClaude,
  monthSpan,
  monthsBetween,
  serializeExport,
  shiftMonth,
  sortCommits,
  toCsv,
  totals,
  type LedgerCommit,
} from "../ledger";

const commit = (over: Partial<LedgerCommit>): LedgerCommit => ({
  sha: "abc1234",
  repo: "mentl",
  date: "2026-03-15T10:00:00-06:00",
  subject: "bootstrap: bit-identical L1",
  author: "Morgan Espitia",
  coAuthors: [],
  merge: false,
  additions: 10,
  deletions: 2,
  files: 3,
  hasBody: true,
  checked: null,
  ...over,
});

const SAMPLE: LedgerCommit[] = [
  commit({
    sha: "a000001",
    date: "2026-01-25T00:58:13-07:00",
    repo: "sonido",
    additions: 100,
    deletions: 0,
  }),
  commit({ sha: "a000002", date: "2026-03-01T12:00:00-06:00", repo: "mentl" }),
  commit({
    sha: "a000003",
    date: "2026-03-31T23:59:00-06:00",
    repo: "mentl",
    coAuthors: ["Claude Opus 5"],
  }),
  commit({
    sha: "a000004",
    date: "2026-05-02T08:00:00+00:00",
    repo: "site",
    author: "Claude",
    merge: true,
    additions: null,
    deletions: null,
    files: null,
  }),
  commit({
    sha: "a000005",
    date: "2026-05-02T09:00:00+00:00",
    repo: "site",
    subject: "floor: the cabinet stands in its room",
  }),
];

describe("ledger", () => {
  it("filters by month bounds, repos, merges and subject", () => {
    expect(
      applyFilter(SAMPLE, { repos: [], q: "", merges: true }),
    ).toHaveLength(5);
    expect(
      applyFilter(SAMPLE, {
        from: "2026-03",
        to: "2026-03",
        repos: [],
        q: "",
        merges: true,
      }).map((c) => c.sha),
    ).toEqual(["a000002", "a000003"]);
    expect(
      applyFilter(SAMPLE, { repos: ["site"], q: "", merges: true }),
    ).toHaveLength(2);
    expect(
      applyFilter(SAMPLE, { repos: ["site"], q: "", merges: false }),
    ).toHaveLength(1);
    expect(
      applyFilter(SAMPLE, { repos: [], q: "CABINET", merges: true }).map(
        (c) => c.sha,
      ),
    ).toEqual(["a000005"]);
    expect(
      applyFilter(SAMPLE, { to: "2026-02", repos: [], q: "", merges: true }),
    ).toHaveLength(1);
  });

  it("keeps a commit in the month of its own timezone", () => {
    // 23:59 on Mar 31 in UTC-6 is Apr 1 in UTC; the author committed in March.
    const rows = aggregateByMonth(SAMPLE, { from: "2026-03", to: "2026-04" });
    expect(rows.map((r) => [r.month, r.commits])).toEqual([
      ["2026-03", 2],
      ["2026-04", 0],
    ]);
  });

  it("fills quiet months with zeros across the data's span", () => {
    const rows = aggregateByMonth(SAMPLE);
    expect(rows.map((r) => r.month)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
    expect(rows.map((r) => r.commits)).toEqual([1, 0, 2, 0, 2]);
    expect(rows[0]!.additions).toBe(100);
    expect(aggregateByMonth([])).toEqual([]);
  });

  it("lists months between two bounds", () => {
    expect(monthsBetween("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
    expect(monthsBetween("2026-05", "2026-03")).toEqual([]);
    expect(monthsBetween("x", "2026-03")).toEqual([]);
  });

  it("aggregates by repository, most commits first", () => {
    const rows = aggregateByRepo(SAMPLE);
    expect(rows.map((r) => [r.repo, r.commits])).toEqual([
      ["mentl", 2],
      ["site", 2],
      ["sonido", 1],
    ]);
    expect(rows.find((r) => r.repo === "site")!.lastCommit).toBe(
      "2026-05-02T09:00:00+00:00",
    );
    expect(rows.find((r) => r.repo === "site")!.additions).toBe(10); // the merge has no stats
  });

  it("totals the slice, counting active days and Claude's share", () => {
    const t = totals(SAMPLE);
    expect(t.commits).toBe(5);
    expect(t.repos).toBe(3);
    expect(t.additions).toBe(130);
    expect(t.deletions).toBe(6);
    expect(t.activeDays).toBe(4);
    expect(t.withClaude).toBe(2);
    expect(t.first).toBe("2026-01-25T00:58:13-07:00");
    expect(t.last).toBe("2026-05-02T09:00:00+00:00");
    expect(totals([]).first).toBeNull();
  });

  it("recognises Claude as author or co-author, case-insensitively", () => {
    expect(isClaude({ author: "Claude", coAuthors: [] })).toBe(true);
    expect(
      isClaude({ author: "Morgan Espitia", coAuthors: ["claude fable 5.1"] }),
    ).toBe(true);
    expect(isClaude({ author: "Morgan Espitia", coAuthors: [] })).toBe(false);
    expect(isClaude({ author: "Claudette", coAuthors: [] })).toBe(false);
  });

  it("reports the month span", () => {
    expect(monthSpan({ commits: SAMPLE })).toEqual({
      first: "2026-01",
      last: "2026-05",
    });
    expect(monthSpan({ commits: [] })).toBeNull();
  });

  it("shifts months across a year boundary", () => {
    expect(shiftMonth("2026-03", -2)).toBe("2026-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 3)).toBe("2027-02");
    expect(shiftMonth("nope", 1)).toBe("nope");
  });

  it("sorts by any column, with missing stats last either way", () => {
    const shas = (rows: LedgerCommit[]) => rows.map((c) => c.sha);
    expect(shas(sortCommits(SAMPLE, { key: "date", desc: true }))).toEqual([
      "a000005",
      "a000004",
      "a000003",
      "a000002",
      "a000001",
    ]);
    expect(shas(sortCommits(SAMPLE, { key: "date", desc: false }))[0]).toBe(
      "a000001",
    );
    expect(shas(sortCommits(SAMPLE, { key: "additions", desc: true }))).toEqual(
      ["a000001", "a000005", "a000003", "a000002", "a000004"],
    );
    expect(
      shas(sortCommits(SAMPLE, { key: "additions", desc: false })).at(-1),
    ).toBe("a000004");
    expect(
      shas(sortCommits(SAMPLE, { key: "repo", desc: false })).slice(0, 2),
    ).toEqual(["a000003", "a000002"]);
    expect(shas(sortCommits(SAMPLE, { key: "author", desc: false }))[0]).toBe(
      "a000004",
    );
    // The input is left alone.
    expect(SAMPLE[0]!.sha).toBe("a000001");
  });

  it("locates a body shard and key", () => {
    expect(bodyShardUrl("a7f3c21")).toBe("/receipts/bodies/a7.json");
    expect(bodyKey({ repo: "mentl", sha: "a7f3c21" })).toBe("mentl/a7f3c21");
  });

  describe("export", () => {
    it("quotes CSV cells safely, including spreadsheet formulas", () => {
      expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
      expect(csvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
      expect(csvCell(12)).toBe("12");
      expect(csvCell(null)).toBe("");
      expect(csvCell(true)).toBe("true");
    });

    it("writes RFC 4180 lines", () => {
      expect(
        toCsv(
          ["a", "b"],
          [
            ["x", 1],
            ["y,z", 2],
          ],
        ),
      ).toBe('"a","b"\r\n"x",1\r\n"y,z",2\r\n');
    });

    it("serialises rows, month groups and repo groups", () => {
      const csv = serializeExport(SAMPLE, {
        format: "csv",
        group: "none",
        stats: true,
      });
      expect(csv.split("\r\n")[0]).toBe(
        '"sha","repo","date","subject","author","co_authors","merge","additions","deletions","files"',
      );
      expect(csv.split("\r\n")).toHaveLength(SAMPLE.length + 2);

      const json = JSON.parse(
        serializeExport(SAMPLE, {
          format: "json",
          group: "month",
          stats: false,
        }),
      );
      expect(json).toEqual([
        { month: "2026-01", commits: 1 },
        { month: "2026-02", commits: 0 },
        { month: "2026-03", commits: 2 },
        { month: "2026-04", commits: 0 },
        { month: "2026-05", commits: 2 },
      ]);

      const byRepo = serializeExport(SAMPLE, {
        format: "csv",
        group: "repo",
        stats: true,
      });
      expect(byRepo.split("\r\n")[1]).toBe(
        '"mentl",2,20,4,"2026-03-31T23:59:00-06:00"',
      );
    });

    it("names the file after the slice", () => {
      expect(
        exportFilename(
          { format: "csv", group: "none", stats: true },
          { repos: [], q: "", merges: true },
        ),
      ).toBe("receipts.csv");
      expect(
        exportFilename(
          { format: "json", group: "month", stats: true },
          { repos: ["mentl"], from: "2026-03", q: "", merges: true },
        ),
      ).toBe("receipts-mentl-2026-03_now-by-month.json");
    });
  });
});
