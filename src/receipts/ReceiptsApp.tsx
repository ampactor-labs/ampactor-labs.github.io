import { useCallback, useMemo, useState } from "react";
import Header from "../floor/Header";
import Footer from "../floor/Footer";
import {
  aggregateByMonth,
  aggregateByRepo,
  applyFilter,
  monthSpan,
  sortCommits,
  totals,
  type Ledger,
  type LedgerCommit,
  type LedgerFilter,
  type SortSpec,
} from "./ledger";
import { isDefaultView, type LedgerViewState } from "./urlState";
import { useLedger } from "./useLedger";
import { useViewState } from "./useViewState";
import FilterBar from "./FilterBar";
import StatTiles from "./StatTiles";
import LedgerTable from "./LedgerTable";
import CommitDrawer from "./CommitDrawer";
import ExportForm from "./ExportForm";
import ChartFrame from "./charts/ChartFrame";
import MonthColumns from "./charts/MonthColumns";
import MonthDiverging, { DivergingLegend } from "./charts/MonthDiverging";
import RepoBars from "./charts/RepoBars";
import { MonthTable, RepoTable } from "./charts/ChartTables";
import { int, monthLabel, shortDate } from "../lib/format";
import styles from "./Receipts.module.css";

const SYNC_SCRIPT =
  "https://github.com/ampactor-labs/ampactor-labs.github.io/blob/main/scripts/sync-receipts.mjs";

// Every public commit, read from git by scripts/sync-receipts.mjs at build
// time, served as one JSON file and worked entirely in the browser. The URL
// is the state; the tiles, charts, table and export all read one filtered
// slice, so they can never disagree.
export default function ReceiptsApp() {
  const { status, retry } = useLedger();
  const { view, setFilter, setSort, reset } = useViewState();

  return (
    <>
      <Header current="receipts" />
      <main id="main" className={styles.main} tabIndex={-1}>
        <header className={styles.pageHead}>
          <p className={styles.eyebrow} aria-hidden="true">
            RECEIPTS
          </p>
          <h1 className={styles.h1}>Every public commit, in one ledger</h1>
          {status.state === "ready" ? (
            <Lede ledger={status.ledger} />
          ) : (
            <p className={styles.lede}>
              Read straight from git at build time, then filtered, sorted,
              charted and exported here, in your browser. Every view is a link.
            </p>
          )}
        </header>
        {status.state === "loading" ? <Loading /> : null}
        {status.state === "error" ? (
          <div className={styles.errorBox} role="alert">
            <p>The ledger did not load. {status.message}</p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : null}
        {status.state === "ready" ? (
          <LedgerView
            ledger={status.ledger}
            view={view}
            setFilter={setFilter}
            setSort={setSort}
            reset={reset}
          />
        ) : null}
      </main>
      <Footer inert={false} />
    </>
  );
}

function Lede({ ledger }: { ledger: Ledger }) {
  const all = useMemo(() => totals(ledger.commits), [ledger]);
  return (
    <>
      <p className={styles.lede}>
        <strong>{int(all.commits)} commits</strong> across {int(all.repos)}{" "}
        repositories since{" "}
        {all.first ? monthLabel(all.first.slice(0, 7), "long") : "the start"},
        read straight from git by{" "}
        <a href={SYNC_SCRIPT} target="_blank" rel="noopener noreferrer">
          a build script
        </a>{" "}
        and worked here, in your browser. Filter it, sort it, chart it, take it
        with you. Every view is a link.
      </p>
      <p className={styles.generated}>
        Ledger generated {shortDate(ledger.generatedAt)} ·{" "}
        <a href="/receipts/data.json">data.json</a>
      </p>
    </>
  );
}

function Loading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <p>Reading the ledger…</p>
      <div className={styles.skeletonTiles} aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    </div>
  );
}

function LedgerView({
  ledger,
  view,
  setFilter,
  setSort,
  reset,
}: {
  ledger: Ledger;
  view: LedgerViewState;
  setFilter: (
    patch: Partial<LedgerFilter> | ((f: LedgerFilter) => Partial<LedgerFilter>),
  ) => void;
  setSort: (sort: SortSpec) => void;
  reset: () => void;
}) {
  const { filter, sort } = view;
  const span = useMemo(() => monthSpan(ledger), [ledger]);
  const all = useMemo(() => totals(ledger.commits), [ledger]);
  const filtered = useMemo(
    () => applyFilter(ledger.commits, filter),
    [ledger, filter],
  );
  const sorted = useMemo(() => sortCommits(filtered, sort), [filtered, sort]);
  const slice = useMemo(() => totals(filtered), [filtered]);
  const facet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of applyFilter(ledger.commits, { ...filter, repos: [] })) {
      counts.set(c.repo, (counts.get(c.repo) ?? 0) + 1);
    }
    return counts;
  }, [ledger, filter]);
  const months = useMemo(
    () =>
      aggregateByMonth(filtered, {
        from: filter.from ?? span?.first,
        to: filter.to ?? span?.last,
      }),
    [filtered, filter.from, filter.to, span],
  );
  const byRepo = useMemo(() => aggregateByRepo(filtered), [filtered]);
  const repoById = useMemo(
    () => new Map(ledger.repos.map((r) => [r.id, r])),
    [ledger],
  );
  const repos = useMemo(
    () =>
      [...ledger.repos].sort(
        (a, b) => b.commits - a.commits || a.id.localeCompare(b.id),
      ),
    [ledger],
  );

  const [open, setOpen] = useState<LedgerCommit | null>(null);
  const isDefault = isDefaultView({
    filter,
    sort: { key: "date", desc: true },
  });
  const singleMonth =
    filter.from && filter.from === filter.to ? filter.from : null;

  const pickMonth = useCallback(
    (month: string) =>
      setFilter((f) =>
        f.from === month && f.to === month
          ? { from: undefined, to: undefined }
          : { from: month, to: month },
      ),
    [setFilter],
  );
  const pickRepo = useCallback(
    (repo: string) =>
      setFilter((f) => ({
        repos: f.repos.includes(repo)
          ? f.repos.filter((r) => r !== repo)
          : [...f.repos, repo],
      })),
    [setFilter],
  );
  const onlyRepo = useCallback(
    (repo: string) => setFilter({ repos: [repo] }),
    [setFilter],
  );

  if (!span) {
    return (
      <p className={styles.errorBox} role="status">
        The ledger is empty.
      </p>
    );
  }

  return (
    <>
      <FilterBar
        filter={filter}
        span={span}
        repos={repos}
        facet={facet}
        isDefault={isDefault}
        onChange={setFilter}
        onReset={reset}
      />
      <StatTiles totals={slice} all={all} filtered={!isDefault} />
      <section className={styles.charts} aria-label="Charts">
        <ChartFrame
          id="c-months"
          title="Commits per month"
          subtitle={
            singleMonth
              ? "Click the column again to widen the range"
              : "Click a column to narrow the range to that month"
          }
          wide
          table={<MonthTable rows={months} caption="Commits per month" />}
        >
          <MonthColumns
            id="c-months"
            rows={months}
            active={singleMonth}
            onPick={pickMonth}
          />
        </ChartFrame>
        <ChartFrame
          id="c-lines"
          title="Lines added and removed"
          subtitle="Per month, one shared scale"
          legend={<DivergingLegend />}
          table={
            <MonthTable
              rows={months}
              caption="Lines added and removed per month"
            />
          }
        >
          <MonthDiverging
            id="c-lines"
            rows={months}
            active={singleMonth}
            onPick={pickMonth}
          />
        </ChartFrame>
        <ChartFrame
          id="c-repos"
          title="Commits by repository"
          subtitle="Click a bar to add or remove that repository"
          table={<RepoTable rows={byRepo} caption="Commits by repository" />}
        >
          <RepoBars
            id="c-repos"
            rows={byRepo}
            active={filter.repos}
            onPick={pickRepo}
          />
        </ChartFrame>
      </section>
      <section
        className={styles.ledgerSection}
        aria-labelledby="ledger-heading"
      >
        <h2 id="ledger-heading" className="visually-hidden">
          Commits
        </h2>
        <LedgerTable
          commits={sorted}
          total={ledger.commits.length}
          sort={sort}
          onSortChange={setSort}
          onOpen={setOpen}
          onReset={reset}
        />
      </section>
      <CommitDrawer
        commit={open}
        repo={open ? repoById.get(open.repo) : undefined}
        onClose={() => setOpen(null)}
        onFilterRepo={onlyRepo}
      />
      <ExportForm commits={sorted} filter={filter} />
    </>
  );
}
