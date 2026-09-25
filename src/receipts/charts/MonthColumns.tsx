import type { MonthRow } from "../ledger";
import { compact, int, monthLabel } from "../../lib/format";
import { roundedTop, ticks } from "./scale";
import { useMeasure } from "./useMeasure";
import { ChartTooltip, useChartTooltip } from "./tooltip";
import styles from "./Charts.module.css";

const H = 220;
const M = { top: 22, right: 8, bottom: 26, left: 44 };

const shortMonth = (month: string) => monthLabel(month).split(" ")[0] ?? month;

// Commits per month: one series, one hue. The highest month is labelled;
// the rest are a hover away. Clicking a column narrows the ledger to it.
export default function MonthColumns({
  id,
  rows,
  active,
  onPick,
}: {
  id: string;
  rows: MonthRow[];
  active?: string | null;
  onPick?: (month: string) => void;
}) {
  const [wrapRef, width] = useMeasure<HTMLDivElement>();
  const { tip, show, hide } = useChartTooltip(wrapRef);
  const innerW = Math.max(120, width - M.left - M.right);
  const innerH = H - M.top - M.bottom;
  const max = rows.reduce((m, r) => Math.max(m, r.commits), 0);
  const tk = ticks(max, 4);
  const top = tk[tk.length - 1] ?? 1;
  const y = (v: number) => M.top + innerH - (v / top) * innerH;
  const step = innerW / Math.max(1, rows.length);
  const barW = Math.min(28, Math.max(3, step * 0.62));
  const maxIndex = rows.findIndex((r) => r.commits === max);
  const labelEvery = Math.max(
    1,
    Math.ceil(rows.length / Math.max(1, Math.floor(innerW / 56))),
  );
  const total = rows.reduce((s, r) => s + r.commits, 0);
  const first = rows[0];
  const last = rows[rows.length - 1];
  const desc =
    rows.length && first && last
      ? `${int(total)} commits from ${monthLabel(first.month, "long")} to ${monthLabel(
          last.month,
          "long",
        )}. Highest month: ${monthLabel(rows[maxIndex]?.month ?? first.month, "long")} with ${int(
          max,
        )}.`
      : "No commits in this range.";

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <svg
        className={styles.svg}
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-labelledby={`${id}-t ${id}-d`}
      >
        <title id={`${id}-t`}>Commits per month</title>
        <desc id={`${id}-d`}>{desc}</desc>
        {tk.map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={M.left + innerW}
              y1={y(t)}
              y2={y(t)}
              className={styles.grid}
            />
            <text
              x={M.left - 8}
              y={y(t) + 3.5}
              textAnchor="end"
              className={styles.tick}
            >
              {compact(t)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cx = M.left + step * i + step / 2;
          const h = (r.commits / top) * innerH;
          const isActive = active === r.month;
          const cls = [
            styles.mark,
            onPick ? styles.pickable : "",
            isActive ? styles.active : "",
            active && !isActive ? styles.dimmed : "",
          ].join(" ");
          return (
            <g
              key={r.month}
              className={cls}
              onPointerEnter={(e) =>
                show(
                  e,
                  <>
                    <b>{monthLabel(r.month, "long")}</b>
                    {int(r.commits)} commits
                    <br />
                    <span className={styles.tipPos}>
                      +{compact(r.additions)}
                    </span>{" "}
                    <span className={styles.tipNeg}>
                      −{compact(r.deletions)}
                    </span>{" "}
                    lines
                  </>,
                )
              }
              onPointerMove={(e) =>
                show(
                  e,
                  <>
                    <b>{monthLabel(r.month, "long")}</b>
                    {int(r.commits)} commits
                    <br />
                    <span className={styles.tipPos}>
                      +{compact(r.additions)}
                    </span>{" "}
                    <span className={styles.tipNeg}>
                      −{compact(r.deletions)}
                    </span>{" "}
                    lines
                  </>,
                )
              }
              onPointerLeave={hide}
              onClick={onPick ? () => onPick(r.month) : undefined}
            >
              <rect
                x={cx - step / 2}
                y={M.top - 8}
                width={step}
                height={innerH + 8}
                className={styles.hit}
              />
              {r.commits > 0 ? (
                <path
                  d={roundedTop(cx - barW / 2, y(r.commits), barW, h, 3)}
                  className={styles.bar}
                />
              ) : (
                <rect
                  x={cx - barW / 2}
                  y={y(0) - 1}
                  width={barW}
                  height={2}
                  className={styles.zero}
                />
              )}
              {i === maxIndex && max > 0 ? (
                <text
                  x={cx}
                  y={y(r.commits) - 6}
                  textAnchor="middle"
                  className={styles.value}
                >
                  {int(r.commits)}
                </text>
              ) : null}
              {i % labelEvery === 0 || i === rows.length - 1 ? (
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  className={styles.axis}
                >
                  {i === 0 || r.month.endsWith("-01")
                    ? monthLabel(r.month)
                    : shortMonth(r.month)}
                </text>
              ) : null}
            </g>
          );
        })}
        <line
          x1={M.left}
          x2={M.left + innerW}
          y1={y(0)}
          y2={y(0)}
          className={styles.baseline}
        />
      </svg>
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}
