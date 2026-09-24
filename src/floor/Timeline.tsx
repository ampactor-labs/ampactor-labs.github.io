import resumeData from "../data/resume.json";
import type { Resume, ResumeRole } from "../data/types";
import SectionHeading from "./SectionHeading";
import section from "./Section.module.css";
import styles from "./Timeline.module.css";

const resume = resumeData as Resume;

// The years since 2017, drawn. Employment as solid bars; the studio as a bar
// that starts faint (a side practice) and goes solid the year it became the
// whole job. No gap to explain when it is a picture.
export function timelineSpan(
  roles: ResumeRole[],
  now = new Date().getFullYear(),
) {
  const start = Math.min(...roles.map((r) => r.start));
  return { start, end: now + 1 }; // exclusive: the current year is a full bar
}

export default function Timeline({ inert }: { inert: boolean }) {
  const roles = resume.experience;
  const { start, end } = timelineSpan(roles);
  const years = Array.from({ length: end - start }, (_, i) => start + i);
  const W = 1000;
  const LABEL_W = 210;
  const ROW_H = 30;
  const TOP = 26;
  const H = TOP + roles.length * ROW_H + 8;
  const x = (year: number) =>
    LABEL_W + ((year - start) / (end - start)) * (W - LABEL_W);
  const nowYear = end - 1;

  return (
    <section
      id="since"
      className={section.section}
      aria-labelledby="since-heading"
      inert={inert || undefined}
    >
      <SectionHeading
        id="since-heading"
        eyebrow="SINCE 2017"
        title="Six years employed, then a studio"
        lede={
          <>
            Front-end, then back-end, then both — PHP, Node, React and
            TypeScript — for credit unions, a healthcare-benefits platform and
            enterprise dashboards. Then Ampactor Labs, full-time since 2023:
            client work under NDA and <a href="#work">the public work above</a>.{" "}
            <a href="/resume.html">The résumé</a> has the dates and the details.
          </>
        }
      />
      <figure className={styles.figure}>
        {/* On narrow screens the drawing scrolls sideways, so the scroller
            itself is a focusable, named region: keyboard users can reach it
            and pan it with the arrow keys. */}
        <div
          className={styles.scroller}
          tabIndex={0}
          role="region"
          aria-label="Employment timeline; scrolls sideways on small screens"
        >
          <svg
            className={styles.svg}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-labelledby="since-title since-desc"
          >
            <title id="since-title">
              Employment timeline, {start} to {nowYear}
            </title>
            <desc id="since-desc">
              {roles
                .map(
                  (r) =>
                    `${r.org}, ${r.role}, ${r.start} to ${r.end ?? "present"}${
                      r.note ? ` (${r.note})` : ""
                    }`,
                )
                .join("; ")}
              .
            </desc>
            {years.map((year) => (
              <g key={year}>
                <line
                  x1={x(year)}
                  x2={x(year)}
                  y1={TOP - 6}
                  y2={H - 6}
                  className={styles.gridline}
                />
                <text x={x(year) + 4} y={TOP - 10} className={styles.year}>
                  {year}
                </text>
              </g>
            ))}
            {roles.map((r, i) => {
              const y = TOP + i * ROW_H;
              const x0 = x(r.start);
              const x1 = x((r.end ?? nowYear) + (r.end ? 0 : 1));
              const solidFrom = r.note?.startsWith("full-time since")
                ? Number(r.note.replace(/\D/g, ""))
                : null;
              return (
                <g key={r.org}>
                  <text x={0} y={y + 15} className={styles.label}>
                    {r.org}
                  </text>
                  <text x={0} y={y + 26} className={styles.roleText}>
                    {r.role}
                  </text>
                  {solidFrom ? (
                    <>
                      <rect
                        x={x0}
                        y={y + 6}
                        width={x(solidFrom) - x0}
                        height={12}
                        rx={3}
                        className={styles.barFaint}
                      />
                      <rect
                        x={x(solidFrom)}
                        y={y + 6}
                        width={x1 - x(solidFrom)}
                        height={12}
                        rx={3}
                        className={styles.barStudio}
                      />
                    </>
                  ) : (
                    <rect
                      x={x0}
                      y={y + 6}
                      width={x1 - x0}
                      height={12}
                      rx={3}
                      className={styles.bar}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <figcaption className={styles.caption}>
          Solid bars are employment; the faint run is the studio as a side
          practice before it became the whole job in 2023.
        </figcaption>
      </figure>
    </section>
  );
}
