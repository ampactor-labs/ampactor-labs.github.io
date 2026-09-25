import {
  useCallback,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  columnSizingFeature,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  isClaude,
  type LedgerCommit,
  type SortKey,
  type SortSpec,
} from "./ledger";
import { int, shortDate } from "../lib/format";
import styles from "./Receipts.module.css";

// The ledger itself. TanStack Table owns the column model and the header
// state; the rows arrive already sorted (the sort lives in the URL, applied
// by sortCommits, so the export matches what is on screen); TanStack Virtual
// draws only the rows in view. The markup stays a real table with explicit
// roles, because flex rows lose their table semantics in some browsers.

const features = tableFeatures({
  columnSizingFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

const helper = createColumnHelper<typeof features, LedgerCommit>();

const dash = (v: number | null, sign: "+" | "−") =>
  v === null ? "—" : `${sign}${int(v)}`;

const columns = helper.columns([
  helper.accessor("date", {
    id: "date",
    header: "Date",
    size: 112,
    cell: (c) => shortDate(c.getValue()),
  }),
  helper.accessor("repo", { id: "repo", header: "Repository", size: 120 }),
  helper.accessor("subject", { id: "subject", header: "Subject", size: 320 }),
  helper.accessor("author", { id: "author", header: "Author", size: 124 }),
  helper.accessor("additions", {
    id: "additions",
    header: "Added",
    size: 92,
    cell: (c) => dash(c.getValue(), "+"),
  }),
  helper.accessor("deletions", {
    id: "deletions",
    header: "Removed",
    size: 96,
    cell: (c) => dash(c.getValue(), "−"),
  }),
  helper.accessor("files", {
    id: "files",
    header: "Files",
    size: 64,
    cell: (c) => (c.getValue() === null ? "—" : int(c.getValue())),
  }),
]);

const NUMERIC = new Set<SortKey>(["additions", "deletions", "files"]);
// A first click on a date or a number shows the biggest first.
const DESC_FIRST = new Set<SortKey>([
  "date",
  "additions",
  "deletions",
  "files",
]);
const ROW_ESTIMATE = 44;

export default function LedgerTable({
  commits,
  total,
  sort,
  onSortChange,
  onOpen,
  onReset,
}: {
  commits: LedgerCommit[];
  total: number;
  sort: SortSpec;
  onSortChange: (sort: SortSpec) => void;
  onOpen: (commit: LedgerCommit) => void;
  onReset: () => void;
}) {
  const table = useTable(
    {
      features,
      columns,
      data: commits,
      manualSorting: true,
      enableSortingRemoval: false,
      state: { sorting: [{ id: sort.key, desc: sort.desc }] },
      getRowId: (c) => `${c.repo}/${c.sha}`,
    },
    () => ({}),
  );
  const rows = table.getRowModel().rows;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // No React Compiler runs here; the virtualizer's functions are read fresh
  // every render, which is exactly what the rule is worried about.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 8,
    getItemKey: (i) => rows[i]?.id ?? i,
  });

  // Arrow keys walk the rows; a row that is not drawn yet is scrolled into
  // the window first and focused as soon as it exists.
  const focusRow = useCallback(
    (index: number, tries = 8) => {
      const el = scrollRef.current?.querySelector<HTMLElement>(
        `tr[data-index="${index}"] button`,
      );
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "nearest" });
        return;
      }
      if (tries === 0) return;
      virtualizer.scrollToIndex(index, { align: "auto" });
      requestAnimationFrame(() => focusRow(index, tries - 1));
    },
    [virtualizer],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    const tr = (e.target as HTMLElement).closest("tr[data-index]");
    if (!tr) return;
    const index = Number(tr.getAttribute("data-index"));
    const last = rows.length - 1;
    const jumps: Record<string, number> = {
      ArrowDown: 1,
      ArrowUp: -1,
      PageDown: 10,
      PageUp: -10,
    };
    let next: number | null = null;
    if (e.key in jumps)
      next = Math.min(last, Math.max(0, index + (jumps[e.key] ?? 0)));
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null || next === index) return;
    e.preventDefault();
    focusRow(next);
  };

  const widthStyle = (size: number): CSSProperties =>
    ({ "--w": `${size}px` }) as CSSProperties;

  return (
    <div className={styles.tableWrap}>
      <p id="ledger-summary" className={styles.summary} aria-live="polite">
        Showing <strong>{int(rows.length)}</strong> of {int(total)} commits
        {sort.key === "date"
          ? sort.desc
            ? ", newest first"
            : ", oldest first"
          : `, by ${sort.key}`}
        {rows.length > 0 ? ". Open a row for the full message." : "."}
      </p>
      <div ref={scrollRef} className={styles.scroller}>
        <table
          role="table"
          className={styles.table}
          aria-rowcount={rows.length + 1}
          aria-describedby="ledger-summary"
        >
          <thead role="rowgroup" className={styles.thead}>
            {table.getHeaderGroups().map((group) => (
              <tr role="row" key={group.id} className={styles.tr}>
                {group.headers.map((header) => {
                  const key = header.column.id as SortKey;
                  const active = sort.key === key;
                  return (
                    <th
                      role="columnheader"
                      scope="col"
                      key={header.id}
                      className={`${styles.th} ${NUMERIC.has(key) ? styles.numCell : ""} ${key === "subject" ? styles.subjectCell : ""}`}
                      style={widthStyle(header.column.getSize())}
                      aria-sort={
                        active
                          ? sort.desc
                            ? "descending"
                            : "ascending"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() =>
                          onSortChange({
                            key,
                            desc: active ? !sort.desc : DESC_FIRST.has(key),
                          })
                        }
                      >
                        <table.FlexRender header={header} />
                        <span className={styles.sortMark} aria-hidden="true">
                          {active ? (sort.desc ? "▼" : "▲") : "↕"}
                        </span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          {rows.length > 0 ? (
            <tbody
              role="rowgroup"
              className={styles.tbody}
              style={{ height: virtualizer.getTotalSize() }}
              onKeyDown={onKeyDown}
            >
              {virtualizer.getVirtualItems().map((item) => {
                const row = rows[item.index];
                if (!row) return null;
                const c = row.original;
                return (
                  <tr
                    role="row"
                    key={row.id}
                    data-index={item.index}
                    ref={virtualizer.measureElement}
                    aria-rowindex={item.index + 2}
                    className={styles.tr}
                    style={{ transform: `translateY(${item.start}px)` }}
                    onClick={() => onOpen(c)}
                  >
                    {row.getAllCells().map((cell) => {
                      const key = cell.column.id as SortKey;
                      if (key === "subject") {
                        return (
                          <td
                            role="cell"
                            key={cell.id}
                            className={`${styles.td} ${styles.subjectCell}`}
                            style={widthStyle(cell.column.getSize())}
                          >
                            <button
                              type="button"
                              className={styles.subjectButton}
                            >
                              {c.subject}
                            </button>
                            {c.merge || isClaude(c) || c.checked ? (
                              <span className={styles.badges}>
                                {c.merge ? (
                                  <span className={styles.badge}>merge</span>
                                ) : null}
                                {isClaude(c) ? (
                                  <span
                                    className={`${styles.badge} ${styles.badgeClaude}`}
                                  >
                                    ∿ claude
                                  </span>
                                ) : null}
                                {c.checked ? (
                                  <span
                                    className={`${styles.badge} ${styles.badgeChecked}`}
                                  >
                                    ✓ checked
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </td>
                        );
                      }
                      return (
                        <td
                          role="cell"
                          key={cell.id}
                          className={`${styles.td} ${NUMERIC.has(key) ? styles.numCell : ""} ${styles[`cell_${key}`] ?? ""}`}
                          style={widthStyle(cell.column.getSize())}
                          data-label={String(cell.column.columnDef.header)}
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          ) : null}
        </table>
        {rows.length === 0 ? (
          <div className={styles.empty} role="status">
            <p>No commits match this filter.</p>
            <button type="button" className={styles.reset} onClick={onReset}>
              Reset filters
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
