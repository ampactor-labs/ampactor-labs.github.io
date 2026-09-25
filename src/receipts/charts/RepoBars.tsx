import type { RepoRow } from "../ledger";
import { compact, int, shortDate } from "../../lib/format";
import { roundedRight, ticks } from "./scale";
import { useMeasure } from "./useMeasure";
import { ChartTooltip, useChartTooltip } from "./tooltip";
import styles from "./Charts.module.css";

const ROW = 24;
const M = { top: 6, right: 56, bottom: 6, left: 128 };

// Commits by repository, most first. A ranked list of at most seventeen
// rows reads as a table with bars, so every bar carries its value.
export default function RepoBars({
  id,
  rows,
  active,
  onPick,
}: {
  id: string;
  rows: RepoRow[];
  active?: string[];
  onPick?: (repo: string) => void;
}) {
  const [wrapRef, width] = useMeasure<HTMLDivElement>();
  const { tip, show, hide } = useChartTooltip(wrapRef);
  const innerW = Math.max(80, width - M.left - M.right);
  const H = M.top + Math.max(1, rows.length) * ROW + M.bottom;
  const max = rows.reduce((m, r) => Math.max(m, r.commits), 0);
  const tk = ticks(max, 2);
  const top = tk[tk.length - 1] ?? 1;
  const x = (v: number) => M.left + (v / top) * innerW;
  const desc = rows.length
    ? `${rows.length} repositories. ${rows
        .slice(0, 3)
        .map((r) => `${r.repo} ${int(r.commits)}`)
        .join(", ")}${rows.length > 3 ? ", and more" : ""}.`
    : "No commits in this range.";
  const selected = active ?? [];

  const tipFor = (r: RepoRow) => (
    <>
      <b>{r.repo}</b>
      {int(r.commits)} commits
      <br />
      <span className={styles.tipPos}>+{compact(r.additions)}</span>{" "}
      <span className={styles.tipNeg}>−{compact(r.deletions)}</span> lines
      <br />
      last {shortDate(r.lastCommit)}
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
        <title id={`${id}-t`}>Commits by repository</title>
        <desc id={`${id}-d`}>{desc}</desc>
        {tk.map((t) => (
          <line
            key={t}
            x1={x(t)}
            x2={x(t)}
            y1={M.top}
            y2={H - M.bottom}
            className={styles.grid}
          />
        ))}
        {rows.map((r, i) => {
          const y = M.top + i * ROW;
          const isActive = selected.includes(r.repo);
          const cls = [
            styles.mark,
            onPick ? styles.pickable : "",
            isActive ? styles.active : "",
            selected.length && !isActive ? styles.dimmed : "",
          ].join(" ");
          const w = Math.max(2, x(r.commits) - M.left);
          return (
            <g
              key={r.repo}
              className={cls}
              onPointerEnter={(e) => show(e, tipFor(r))}
              onPointerMove={(e) => show(e, tipFor(r))}
              onPointerLeave={hide}
              onClick={onPick ? () => onPick(r.repo) : undefined}
            >
              <rect
                x={0}
                y={y}
                width={width}
                height={ROW}
                className={styles.hit}
              />
              <text
                x={M.left - 10}
                y={y + ROW / 2 + 4}
                textAnchor="end"
                className={styles.label}
              >
                {r.repo}
              </text>
              <path
                d={roundedRight(M.left, y + 6, w, ROW - 12, 3)}
                className={styles.bar}
              />
              <text
                x={M.left + w + 8}
                y={y + ROW / 2 + 4}
                className={styles.value}
              >
                {int(r.commits)}
              </text>
            </g>
          );
        })}
        <line
          x1={M.left}
          x2={M.left}
          y1={M.top}
          y2={H - M.bottom}
          className={styles.baseline}
        />
      </svg>
      <ChartTooltip tip={tip} width={width} />
    </div>
  );
}
