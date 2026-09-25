import { useEffect, useId, useState } from "react";
import {
  monthsBetween,
  shiftMonth,
  type LedgerFilter,
  type LedgerRepo,
} from "./ledger";
import { int, monthLabel } from "../lib/format";
import styles from "./Receipts.module.css";

// One row of controls above everything else: a range, a subject search, the
// merge switch, then the repositories as chips with live counts. Every
// control writes to the URL through the view state; nothing here is local
// except the half-typed search.
export default function FilterBar({
  filter,
  span,
  repos,
  facet,
  isDefault,
  onChange,
  onReset,
}: {
  filter: LedgerFilter;
  span: { first: string; last: string };
  repos: LedgerRepo[];
  facet: Map<string, number>;
  isDefault: boolean;
  onChange: (patch: Partial<LedgerFilter>) => void;
  onReset: () => void;
}) {
  const uid = useId();
  const months = monthsBetween(span.first, span.last);

  // Presets are measured from the ledger's last month, not today's date, so
  // a shared link means the same thing next week.
  const presets = [
    { label: "All", from: undefined as string | undefined },
    { label: "3 mo", from: shiftMonth(span.last, -2) },
    { label: "6 mo", from: shiftMonth(span.last, -5) },
  ].filter((p, i) => i === 0 || (p.from && p.from > span.first));
  const presetActive = (from: string | undefined) =>
    filter.to === undefined && filter.from === from;

  // The search box keeps its own text and debounces into the URL; an outside
  // change to the URL (Back, Reset) resets the text.
  const [q, setQ] = useState(filter.q);
  const [seen, setSeen] = useState(filter.q);
  if (filter.q !== seen) {
    setSeen(filter.q);
    setQ(filter.q);
  }
  useEffect(() => {
    if (q === filter.q) return;
    const timer = setTimeout(() => onChange({ q }), 150);
    return () => clearTimeout(timer);
  }, [q, filter.q, onChange]);

  const toggleRepo = (id: string) =>
    onChange({
      repos: filter.repos.includes(id)
        ? filter.repos.filter((r) => r !== id)
        : [...filter.repos, id],
    });

  return (
    <section className={styles.filters} aria-labelledby={`${uid}-filters`}>
      <h2 id={`${uid}-filters`} className="visually-hidden">
        Filters
      </h2>
      <div className={styles.filterRow}>
        <div className={styles.seg} role="group" aria-label="Range">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={presetActive(p.from)}
              onClick={() => onChange({ from: p.from, to: undefined })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className={styles.field}>
          <span>From</span>
          <select
            value={filter.from ?? ""}
            onChange={(e) => {
              const from = e.target.value || undefined;
              onChange({
                from,
                to: from && filter.to && filter.to < from ? from : filter.to,
              });
            }}
          >
            <option value="">start</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>To</span>
          <select
            value={filter.to ?? ""}
            onChange={(e) => {
              const to = e.target.value || undefined;
              onChange({
                to,
                from: to && filter.from && filter.from > to ? to : filter.from,
              });
            }}
          >
            <option value="">now</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.search}`}>
          <span className="visually-hidden">Search subjects</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subjects…"
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={filter.merges}
            onChange={(e) => onChange({ merges: e.target.checked })}
          />
          <span>Include merges</span>
        </label>
        {!isDefault ? (
          <button type="button" className={styles.reset} onClick={onReset}>
            Reset
          </button>
        ) : null}
      </div>
      <div className={styles.chips} role="group" aria-label="Repositories">
        {repos.map((r) => {
          const count = facet.get(r.id) ?? 0;
          const pressed = filter.repos.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              className={`${styles.chip} ${count === 0 && !pressed ? styles.chipZero : ""}`}
              aria-pressed={pressed}
              aria-label={`${r.id}: ${int(count)} ${count === 1 ? "commit" : "commits"}`}
              onClick={() => toggleRepo(r.id)}
            >
              <span aria-hidden="true">{r.id}</span>
              <span className={styles.chipCount} aria-hidden="true">
                {int(count)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
