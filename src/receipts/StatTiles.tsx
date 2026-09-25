import type { Totals } from "./ledger";
import { compact, int, monthLabel, percent, shortDate } from "../lib/format";
import styles from "./Receipts.module.css";

// Six numbers that answer the filter. The tiles are quiet on purpose: the
// value in the ledger's mono readout face, one line of context beneath.
export default function StatTiles({
  totals,
  all,
  filtered,
}: {
  totals: Totals;
  all: Totals;
  filtered: boolean;
}) {
  const net = totals.additions - totals.deletions;
  const tiles: { label: string; value: string; title?: string; sub: string }[] =
    [
      {
        label: "Commits",
        value: int(totals.commits),
        sub: filtered
          ? `of ${int(all.commits)}`
          : all.first
            ? `since ${monthLabel(all.first.slice(0, 7))}`
            : "",
      },
      {
        label: "Repositories",
        value: int(totals.repos),
        sub: filtered ? `of ${int(all.repos)}` : "all public",
      },
      {
        label: "Lines added",
        value: `+${compact(totals.additions)}`,
        title: int(totals.additions),
        sub: filtered
          ? `${percent(totals.additions, all.additions)} of all`
          : "across every repository",
      },
      {
        label: "Lines removed",
        value: `−${compact(totals.deletions)}`,
        title: int(totals.deletions),
        sub: `net ${net >= 0 ? "+" : "−"}${compact(Math.abs(net))}`,
      },
      {
        label: "Active days",
        value: int(totals.activeDays),
        sub:
          totals.first && totals.last
            ? `${shortDate(totals.first)} – ${shortDate(totals.last)}`
            : "—",
      },
      {
        label: "With Claude",
        value: int(totals.withClaude),
        sub: `${percent(totals.withClaude, totals.commits)} as author or co-author`,
      },
    ];
  return (
    <dl className={styles.tiles}>
      {tiles.map((t) => (
        <div key={t.label} className={styles.tile}>
          <dt className={styles.tileLabel}>{t.label}</dt>
          <dd className={styles.tileBody}>
            <span className={styles.tileValue} title={t.title}>
              {t.value}
            </span>
            <span className={styles.tileSub}>{t.sub}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
