import type { CSSProperties } from "react";
import { PROJECTS } from "../data/projects";
import type { Project, ProjectCategory } from "../data/types";
import SectionHeading from "./SectionHeading";
import section from "./Section.module.css";
import styles from "./Shelf.module.css";

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  systems: "SYSTEMS",
  web3: "WEB3",
  security: "SECURITY",
  creative: "CREATIVE",
  defi: "DEFI",
  tooling: "TOOLING",
};

// projects.js is JavaScript; its order is the shelf's order.
const projects = PROJECTS as Project[];

// The per-project neon is the cabinet's; on the floor it is muted toward the
// patina so seventeen hues read as one shelf (see docs/DESIGN-SYSTEM.md §3).
const accent = (color: string) => `color-mix(in srgb, ${color} 55%, var(--color-muted))`;

function Cartridge({
  project: p,
  onOpen,
}: {
  project: Project;
  onOpen: (id: string) => void;
}) {
  const live = p.live ? { href: p.live, label: p.liveLabel ?? "Live →" } : null;
  return (
    <article
      className={styles.card}
      style={{ "--accent": accent(p.color), "--raw": p.color } as CSSProperties}
      aria-labelledby={`work-${p.id}`}
    >
      <div className={styles.cardTop}>
        <span className={styles.icon} aria-hidden="true">
          {p.icon}
        </span>
        <span className={styles.lang}>{p.lang}</span>
      </div>
      <h3 id={`work-${p.id}`} className={styles.title}>
        {p.title}
      </h3>
      <p className={styles.subtitle}>
        <span className={styles.category}>
          {CATEGORY_LABELS[p.category] ?? p.category.toUpperCase()}
        </span>
        <span aria-hidden="true"> · </span>
        {p.subtitle}
      </p>
      <p className={styles.outcome}>{p.outcome}</p>
      <ul className={styles.stack} aria-label="Stack">
        {p.stack.slice(0, 4).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div className={styles.actions}>
        {live ? (
          <a
            className={styles.action}
            href={live.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {live.label === "▸ APK" ? "APK →" : live.label}
          </a>
        ) : null}
        {p.github ? (
          <a
            className={styles.action}
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            Source →
          </a>
        ) : null}
        <button
          type="button"
          className={styles.cabinet}
          onClick={() => onOpen(p.id)}
          aria-label={`Open ${p.title} in the cabinet`}
        >
          ▸ Cabinet
        </button>
      </div>
    </article>
  );
}

export default function Shelf({
  inert,
  onOpen,
}: {
  inert: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <section
      id="work"
      className={section.section}
      aria-labelledby="work-heading"
      inert={inert || undefined}
    >
      <SectionHeading
        id="work-heading"
        eyebrow="THE WORK"
        title={`${projects.length} cartridges, all shipped`}
        lede={
          <>
            Every project is a cartridge in the cabinet. Each card is generated
            from the project&apos;s own README at build time, so a card can&apos;t
            outrun its repo. Open one in the cabinet for the readout: what it
            does, what it&apos;s made of, and where it&apos;s weak.
          </>
        }
      />
      <div className={styles.grid}>
        {projects.map((p) => (
          <Cartridge key={p.id} project={p} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
