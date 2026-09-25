import { useState, type ReactNode } from "react";
import styles from "./Charts.module.css";

// The figure every chart sits in: a title, an optional unit line, a
// Chart | Table switch, and (for two series) a legend. The table view is
// the accessible twin of the drawing and is always one click away.
export default function ChartFrame({
  id,
  title,
  subtitle,
  legend,
  table,
  wide = false,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  table: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const titleId = `${id}-title`;
  return (
    <figure
      className={`${styles.figure} ${wide ? styles.wide : ""}`}
      aria-labelledby={titleId}
      data-chart={id}
    >
      <figcaption className={styles.caption}>
        <div>
          <h3 id={titleId} className={styles.title}>
            {title}
          </h3>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        <div
          className={styles.seg}
          role="group"
          aria-label={`${title}: view as`}
        >
          <button
            type="button"
            aria-pressed={mode === "chart"}
            onClick={() => setMode("chart")}
          >
            Chart
          </button>
          <button
            type="button"
            aria-pressed={mode === "table"}
            onClick={() => setMode("table")}
          >
            Table
          </button>
        </div>
      </figcaption>
      {legend && mode === "chart" ? legend : null}
      <div className={styles.body}>{mode === "chart" ? children : table}</div>
    </figure>
  );
}
