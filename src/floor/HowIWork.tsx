import { summary } from "../data/receiptsSummary";
import { int } from "../lib/format";
import SectionHeading from "./SectionHeading";
import section from "./Section.module.css";
import styles from "./HowIWork.module.css";

const REPO = "https://github.com/ampactor-labs/ampactor-labs.github.io";
const { totals } = summary;

// Three habits, each one checkable against this repository.
export default function HowIWork({ inert }: { inert: boolean }) {
  return (
    <section
      id="how"
      className={section.section}
      aria-labelledby="how-heading"
      inert={inert || undefined}
    >
      <SectionHeading id="how-heading" eyebrow="PROCESS" title="How I work" />
      <div className={styles.grid}>
        <article className={`${styles.item} reveal`}>
          <h3 className={styles.itemTitle}>
            <span className={styles.glyph} aria-hidden="true">
              ▸
            </span>
            End to end
          </h3>
          <p>
            I take projects from design to deployment on my own: the interface,
            the backend, the tests, CI and the documentation. This site is React
            19 and TypeScript on Vite, with unit tests and browser tests that
            run on every pull request.
          </p>
        </article>
        <article className={`${styles.item} reveal`}>
          <h3 className={styles.itemTitle}>
            <span className={styles.glyph} aria-hidden="true">
              ◈
            </span>
            Documented limits
          </h3>
          <p>
            Most of my READMEs have a section on known weaknesses, and where I
            publish benchmarks, they include the cases I lose. The arcade&apos;s
            project pages are generated from those READMEs, so the site and the
            repositories say the same thing.
          </p>
        </article>
        <article className={`${styles.item} reveal`}>
          <h3 className={styles.itemTitle}>
            <span className={styles.glyph} aria-hidden="true">
              ∿
            </span>
            Working with AI
          </h3>
          <p>
            I use Claude Code daily as a pair programmer. I review every diff
            and run the checks myself, and on this site every commit since the
            rebuild ends with what I checked. Of the {int(totals.commits)}{" "}
            commits in <a href="/receipts/">my commit log</a>,{" "}
            {int(totals.withClaude)} list Claude as author or co-author, and{" "}
            <a
              href={`${REPO}/commits`}
              target="_blank"
              rel="noopener noreferrer"
            >
              this site&apos;s history
            </a>{" "}
            is public.
          </p>
        </article>
      </div>
      <a className={`${styles.more} reveal`} href="/craft/">
        How this site is built →
      </a>
    </section>
  );
}
