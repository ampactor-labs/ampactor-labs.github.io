import type { MonthRow } from "../ledger";
import { compact, int, monthLabel } from "../../lib/format";
import { roundedBottom, roundedTop, ticks } from "./scale";
import { useMeasure } from "./useMeasure";
import { ChartTooltip, useChartTooltip } from "./tooltip";
import styles from "./Charts.module.css";

const H = 240;
const M = { top: 20, right: 8, bottom: 26, left: 48 };

const shortMonth = (month: string) => monthLabel(month).split(" ")[0] ?? month;

// Lines added above the baseline, lines removed below it, one shared scale.
// Sign is carried by position as well as hue, the legend names both series,
// and each side's largest month is labelled, so the pair is never colour-alone.
export default function MonthDiverging({
  id,
  rows,
  onPick,
  active,
}: {
  id: string;
  rows: MonthRow[];
  onPick?: (month: string) => void;
  active?: string | null;
}) {
  const [wrapRef, width] = useMeasure<HTMLDivElement>();
  const { tip, show, hide } = useChartTooltip(wrapRef);
  const innerW = Math.max(120, width - M.left - M.right);
  const innerH = H - M.top - M.bottom;
  const half = innerH / 2;
  const maxAdd = rows.reduce((m, r) => Math.max(m, r.additions), 0);
  const maxDel = rows.reduce((m, r) => Math.max(m, r.deletions), 0);
  const tk = ticks(Math.max(maxAdd, maxDel), 2);
  const top = tk[tk.length - 1] ?? 1;
  const mid = M.top + half;
  const up = (v: number) => (v / top) * half;
  const step = innerW / Math.max(1, rows.length);
  const barW = Math.min(28, Math.max(3, step * 0.62));
  const addIndex = rows.findIndex((r) => r.additions === maxAdd);
  const delIndex = rows.findIndex((r) => r.deletions === maxDel);
  const labelEvery = Math.max(
    1,
    Math.ceil(rows.length / Math.max(1, Math.floor(innerW / 56))),
  );
  const totalAdd = rows.reduce((s, r) => s + r.additions, 0);
  const totalDel = rows.reduce((s, r) => s + r.deletions, 0);
  const desc = rows.length
    ? `${compact(totalAdd)} lines added and ${compact(totalDel)} removed across ${rows.length} months. Most added: ${monthLabel(
        rows[addIndex]?.month ?? "",
        "long",
      )} with ${compact(maxAdd)}. Most removed: ${monthLabel(rows[delIndex]?.month ?? "", "long")} with ${compact(maxDel)}.`
    : "No commits in this range.";

  const tipFor = (r: MonthRow) => (
    <>
      <b>{monthLabel(r.month, "long")}</b>
      <span className={styles.tipPos}>+{int(r.additions)}</span> added
      <br />
      <span className={styles.tipNeg}>−{int(r.deletions)}</span> removed
      <br />
      net {r.additions - r.deletions >= 0 ? "+" : "−"}
      {int(Math.abs(r.additions - r.deletions))}
    </>
  );

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
        <title id={`${id}-t`}>Lines added and removed per month</title>
        <desc id={`${id}-d`}>{desc}</desc>
        {tk.map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={M.left + innerW}
              y1={mid - up(t)}
              y2={mid - up(t)}
              className={styles.grid}
            />
            <text
              x={M.left - 8}
              y={mid - up(t) + 3.5}
              textAnchor="end"
              className={styles.tick}
            >
              {t === 0 ? "0" : `+${compact(t)}`}
            </text>
            {t > 0 ? (
              <>
                <line
                  x1={M.left}
                  x2={M.left + innerW}
                  y1={mid + up(t)}
                  y2={mid + up(t)}
                  className={styles.grid}
                />
                <text
                  x={M.left - 8}
                  y={mid + up(t) + 3.5}
                  textAnchor="end"
                  className={styles.tick}
                >
                  −{compact(t)}
                </text>
              </>
            ) : null}
          </g>
        ))}
        {rows.map((r, i) => {
          const cx = M.left + step * i + step / 2;
          const isActive = active === r.month;
          const cls = [
            styles.mark,
            onPick ? styles.pickable : "",
            active && !isActive ? styles.dimmed : "",
          ].join(" ");
          return (
            <g
              key={r.month}
              className={cls}
              onPointerEnter={(e) => show(e, tipFor(r))}
              onPointerMove={(e) => show(e, tipFor(r))}
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
              {r.additions > 0 ? (
                <path
                  d={roundedTop(
                    cx - barW / 2,
                    mid - up(r.additions),
                    barW,
                    up(r.additions),
                    3,
                  )}
                  className={styles.barPos}
                />
              ) : null}
              {r.deletions > 0 ? (
                <path
                  d={roundedBottom(
                    cx - barW / 2,
                    mid + 1,
                    barW,
                    up(r.deletions),
                    3,
                  )}
                  className={styles.barNeg}
                />
              ) : null}
              {i === addIndex && maxAdd > 0 ? (
                <text
                  x={cx}
                  y={mid - up(r.additions) - 5}
                  textAnchor="middle"
                  className={styles.value}
                >
                  +{compact(r.additions)}
                </text>
              ) : null}
              {i === delIndex && maxDel > 0 ? (
                <text
                  x={cx}
                  y={mid + up(r.deletions) + 13}
                  textAnchor="middle"
                  className={styles.value}
                >
                  −{compact(r.deletions)}
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
          y1={mid}
          y2={mid}
          className={styles.baseline}
        />
      </svg>
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}

export function DivergingLegend() {
  return (
    <ul className={styles.legend} aria-label="Series">
      <li>
        <span
          className={`${styles.swatch} ${styles.swatchPos}`}
          aria-hidden="true"
        />
        Lines added (above)
      </li>
      <li>
        <span
          className={`${styles.swatch} ${styles.swatchNeg}`}
          aria-hidden="true"
        />
        Lines removed (below)
      </li>
    </ul>
  );
}
