import AMark from "../ui/AMark";
import ThemeToggle from "../ui/ThemeToggle";
import { CONTACT } from "../data/profile";
import styles from "./Floor.module.css";

// The same header on every flat page (the ledger, the case study). The
// cabinet itself has no header: it is the page, and the A-mark here leads
// back to it.
export default function Header({
  current,
}: {
  current: "receipts" | "craft";
}) {
  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <a href="/" className={styles.brand} aria-label="Ampactor Labs, home">
        <AMark size={22} />
        <span>AMPACTOR</span>
      </a>
      <nav className={styles.nav} aria-label="Site">
        <a href="/arcade/">ARCADE</a>
        <a
          href="/receipts/"
          aria-current={current === "receipts" ? "page" : undefined}
        >
          COMMITS
        </a>
        <a
          href="/craft/"
          aria-current={current === "craft" ? "page" : undefined}
        >
          CRAFT
        </a>
        {/* Press Start 2P draws É as a small é, so the sign reads RESUME, and
            that is also its name: what a voice-control user says is what is
            on screen. The résumé keeps its accents everywhere else. */}
        <a href="/resume.html">RESUME</a>
        <a
          href={CONTACT.github}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navPhoneHide}
        >
          GITHUB
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
