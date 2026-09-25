import AMark from "../ui/AMark";
import ThemeToggle from "../ui/ThemeToggle";
import { CONTACT } from "../data/profile";
import styles from "./Floor.module.css";

// The same header on every page. On the floor the ARCADE control zooms the
// cabinet in place; anywhere else it is a plain link to /arcade/, and the
// section anchors point back at the floor.
export default function Header({
  inert = false,
  onEnterArcade,
  current = "floor",
}: {
  inert?: boolean;
  onEnterArcade?: () => void;
  current?: "floor" | "receipts";
}) {
  const home = current === "floor";
  const anchor = (id: string) => (home ? `#${id}` : `/#${id}`);
  return (
    <header className={styles.header} inert={inert || undefined}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <a href="/" className={styles.brand} aria-label="Ampactor Labs, home">
        <AMark size={22} />
        <span>AMPACTOR</span>
      </a>
      <nav className={styles.nav} aria-label="Site">
        <a href={anchor("work")}>WORK</a>
        <a
          href="/receipts/"
          aria-current={current === "receipts" ? "page" : undefined}
        >
          RECEIPTS
        </a>
        <a href={anchor("how")} className={styles.navWide}>
          HOW I WORK
        </a>
        {onEnterArcade ? (
          <button
            type="button"
            className={styles.navButton}
            onClick={onEnterArcade}
          >
            ARCADE
          </button>
        ) : (
          <a href="/arcade/">ARCADE</a>
        )}
        {/* Press Start 2P has no accented capitals; the résumé keeps its accents everywhere else. */}
        <a href="/resume.html" aria-label="Résumé">
          RESUME
        </a>
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
