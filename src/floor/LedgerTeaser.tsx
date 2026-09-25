import { summary } from "../data/receiptsSummary";
import SectionHeading from "./SectionHeading";
import { int, monthLabel } from "../lib/format";
import { roundedTop, ticks } from "../receipts/charts/scale";
import section from "./Section.module.css";
import styles from "./LedgerTeaser.module.css";

// The commit log's summary on the home page: two totals and commits per
// month, from the summary the build writes. The full page is one click away.
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
        eyebrow="COMMITS"
        title={
          since
            ? `${int(totals.commits)} commits since ${since}`
            : `${int(totals.commits)} public commits`
        }
        lede={
          <>
            Every commit in my public repositories, read from git each time this
            site is built. The commit log lets you filter, sort and chart them,
            or export them as CSV or JSON.
          </>
        }
      />
      <div className={`${styles.card} reveal`}>
        <div className={styles.numbers}>
          <div>
            <span className={styles.big}>{int(totals.commits)}</span>
            <span className={styles.label}>commits</span>
          </div>
          <div>
            <span className={styles.big}>{int(totals.repos)}</span>
            <span className={styles.label}>public repositories</span>
          </div>
          <a className={styles.link} href="/receipts/">
            Open the commit log →
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
