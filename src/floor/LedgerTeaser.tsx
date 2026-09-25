import { summary } from "../data/receiptsSummary";
import SectionHeading from "./SectionHeading";
import { compact, int, monthLabel } from "../lib/format";
import { roundedTop, ticks } from "../receipts/charts/scale";
import section from "./Section.module.css";
import styles from "./LedgerTeaser.module.css";

// The ledger's front step on the floor: the headline numbers and the months
// as a strip, drawn from the same summary the build wrote. The page itself
// is one click away.
export default function LedgerTeaser({ inert }: { inert: boolean }) {
  const { totals, months } = summary;
  const since = totals.first
    ? monthLabel(totals.first.slice(0, 7), "long")
    : null;
  const W = 560;
  const H = 120;
  const M = { top: 18, right: 4, bottom: 20, left: 4 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const max = months.reduce((m, r) => Math.max(m, r.commits), 0);
  const tk = ticks(max, 2);
  const top = tk[tk.length - 1] ?? 1;
  const step = innerW / Math.max(1, months.length);
  const barW = Math.min(36, step * 0.64);
  const maxIndex = months.findIndex((r) => r.commits === max);
  const first = months[0];
  const last = months[months.length - 1];

  return (
    <section
      id="receipts"
      className={section.section}
      aria-labelledby="receipts-heading"
      inert={inert || undefined}
    >
      <SectionHeading
        id="receipts-heading"
        eyebrow="RECEIPTS"
        title={`${int(totals.commits)} commits, in the open`}
        lede={
          <>
            Every public commit{since ? ` since ${since}` : ""}, read from git
            when this site is built: {int(totals.repos)} repositories,{" "}
            {compact(totals.additions)} lines added, {int(totals.withClaude)}{" "}
            commits with Claude as author or co-author. The ledger filters,
            sorts, charts and exports, and every view of it is a link.
          </>
        }
      />
      <div className={styles.card}>
        <div className={styles.numbers}>
          <div>
            <span className={styles.big}>{int(totals.commits)}</span>
            <span className={styles.label}>commits</span>
          </div>
          <div>
            <span className={styles.big}>{int(totals.repos)}</span>
            <span className={styles.label}>repositories</span>
          </div>
          <div>
            <span className={styles.big}>+{compact(totals.additions)}</span>
            <span className={styles.label}>lines added</span>
          </div>
          <a className={styles.link} href="/receipts/">
            Open the ledger →
          </a>
        </div>
        <figure className={styles.figure}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-labelledby="receipts-strip-title receipts-strip-desc"
          >
            <title id="receipts-strip-title">Commits per month</title>
            <desc id="receipts-strip-desc">
              {months
                .map((m) => `${monthLabel(m.month)}: ${int(m.commits)}`)
                .join("; ")}
              .
            </desc>
            <line
              x1={M.left}
              x2={M.left + innerW}
              y1={M.top + innerH}
              y2={M.top + innerH}
              className={styles.baseline}
            />
            {months.map((m, i) => {
              const cx = M.left + step * i + step / 2;
              const h = (m.commits / top) * innerH;
              return (
                <g key={m.month}>
                  {m.commits > 0 ? (
                    <path
                      d={roundedTop(
                        cx - barW / 2,
                        M.top + innerH - h,
                        barW,
                        h,
                        3,
                      )}
                      className={styles.bar}
                    />
                  ) : null}
                  {i === maxIndex ? (
                    <text
                      x={cx}
                      y={M.top + innerH - h - 6}
                      textAnchor="middle"
                      className={styles.value}
                    >
                      {int(m.commits)}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {first ? (
              <text x={M.left} y={H - 5} className={styles.axis}>
                {monthLabel(first.month)}
              </text>
            ) : null}
            {last && last !== first ? (
              <text
                x={M.left + innerW}
                y={H - 5}
                textAnchor="end"
                className={styles.axis}
              >
                {monthLabel(last.month)}
              </text>
            ) : null}
          </svg>
          <figcaption className={styles.caption}>Commits per month</figcaption>
        </figure>
      </div>
    </section>
  );
}
