import { summary } from "../data/receiptsSummary";
import { int } from "../lib/format";
import SectionHeading from "./SectionHeading";
import section from "./Section.module.css";
import styles from "./HowIWork.module.css";

const REPO = "https://github.com/ampactor-labs/ampactor-labs.github.io";
const { totals } = summary;

// Three claims a reader can check against this repository.
export default function HowIWork({ inert }: { inert: boolean }) {
  return (
    <section
      id="how"
      className={section.section}
      aria-labelledby="how-heading"
      inert={inert || undefined}
    >
      <SectionHeading
        id="how-heading"
        eyebrow="HOW I WORK"
        title="Receipts over claims"
      />
      <div className={styles.grid}>
        <article className={`${styles.item} reveal`}>
          <h3 className={styles.itemTitle}>
            <span className={styles.glyph} aria-hidden="true">
              ▸
            </span>
            End to end
          </h3>
          <p>
            Every project here is one person&apos;s: the design, the code, the
            tests, the deploy, and the README that says where it&apos;s weak.
            This site is a typed React&nbsp;19 + Vite floor around an arcade
            cabinet, with a unit suite and a browser suite that plays the
            cabinet on a phone before anything ships.
          </p>
        </article>
        <article className={`${styles.item} reveal`}>
          <h3 className={styles.itemTitle}>
            <span className={styles.glyph} aria-hidden="true">
              ◈
            </span>
            Published losses
          </h3>
          <p>
            Benchmarks show where they lose. READMEs carry a <em>Weak spots</em>{" "}
            section, and the cards on this floor are generated from those
            READMEs at build time, so a claim can&apos;t outrun its repository.
          </p>
        </article>
        <article className={`${styles.item} reveal`}>
          <h3 className={styles.itemTitle}>
            <span className={styles.glyph} aria-hidden="true">
              ∿
            </span>
            AI in the loop, hands on the wheel
          </h3>
          <p>
            I use Claude Code every day and treat it like a fast colleague with
            no memory: I read every diff, run the checks myself, and on this
            site the commit message ends with what was checked. Of the{" "}
            {int(totals.commits)} public commits in{" "}
            <a href="/receipts/">the ledger</a>, {int(totals.withClaude)} name
            Claude as author or co-author, and{" "}
            <a
              href={`${REPO}/commits`}
              target="_blank"
              rel="noopener noreferrer"
            >
              this site&apos;s own history
            </a>{" "}
            is the record.
          </p>
        </article>
      </div>
      <a className={`${styles.more} reveal`} href="/craft/">
        How this site is made: what was hard, what I chose, how I know →
      </a>
    </section>
  );
}
