import resumeData from "../data/resume.json";
import type { Resume, ResumeRole } from "../data/types";
import SectionHeading from "./SectionHeading";
import section from "./Section.module.css";
import styles from "./Timeline.module.css";

const resume = resumeData as Resume;

// The years since 2017 as a chart. Jobs are solid bars; Ampactor Labs is a
// bar that starts faint (a side business) and turns solid in the year it
// became full-time.
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
        eyebrow="EXPERIENCE"
        title="Six years at companies, then independent"
        lede={
          <>
            Front-end, back-end and full-stack roles in PHP, Node, React and
            TypeScript, building for credit unions, a healthcare-benefits
            platform and an enterprise shipping-data dashboard. Independent
            since 2023 as Ampactor Labs: client work under NDA and{" "}
            <a href="#work">the projects above</a>. Dates and details are in{" "}
            <a href="/resume.html">the résumé</a>.
          </>
        }
      />
      <figure className={`${styles.figure} reveal`}>
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
          Solid bars are jobs. The faint bar is Ampactor Labs as a side
          business, before it became full-time in 2023.
        </figcaption>
      </figure>
    </section>
  );
}
