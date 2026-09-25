import type { MonthRow, RepoRow } from "../ledger";
import { int, monthLabel, shortDate, signed } from "../../lib/format";
import styles from "./Charts.module.css";

// The table twins of the charts. Same rows, same numbers, real <table>s.
export function MonthTable({
  rows,
  caption,
}: {
  rows: MonthRow[];
  caption: string;
}) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col" className={styles.num}>
              Commits
            </th>
            <th scope="col" className={styles.num}>
              Added
            </th>
            <th scope="col" className={styles.num}>
              Removed
            </th>
            <th scope="col" className={styles.num}>
              Net
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <th scope="row" style={{ fontWeight: 400, color: "var(--fg)" }}>
                {monthLabel(r.month)}
              </th>
              <td className={styles.num}>{int(r.commits)}</td>
              <td className={styles.num}>{signed(r.additions, "+")}</td>
              <td className={styles.num}>{signed(r.deletions, "−")}</td>
              <td className={styles.num}>
                {r.additions - r.deletions >= 0
                  ? signed(r.additions - r.deletions, "+")
                  : signed(r.deletions - r.additions, "−")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RepoTable({
  rows,
  caption,
}: {
  rows: RepoRow[];
  caption: string;
}) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Repository</th>
            <th scope="col" className={styles.num}>
              Commits
            </th>
            <th scope="col" className={styles.num}>
              Added
            </th>
            <th scope="col" className={styles.num}>
              Removed
            </th>
            <th scope="col">Last commit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.repo}>
              <th scope="row" style={{ fontWeight: 400, color: "var(--fg)" }}>
                {r.repo}
              </th>
              <td className={styles.num}>{int(r.commits)}</td>
              <td className={styles.num}>{signed(r.additions, "+")}</td>
              <td className={styles.num}>{signed(r.deletions, "−")}</td>
              <td>{shortDate(r.lastCommit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
