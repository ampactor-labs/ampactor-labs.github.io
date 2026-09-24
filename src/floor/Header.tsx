import AMark from "../ui/AMark";
import ThemeToggle from "../ui/ThemeToggle";
import { CONTACT } from "../data/profile";
import styles from "./Floor.module.css";

export default function Header({
  inert,
  onEnterArcade,
}: {
  inert: boolean;
  onEnterArcade: () => void;
}) {
  return (
    <header className={styles.header} inert={inert || undefined}>
      <a href="/" className={styles.brand} aria-label="Ampactor Labs, home">
        <AMark size={22} />
        <span>AMPACTOR</span>
      </a>
      <nav className={styles.nav} aria-label="Site">
        <button type="button" className={styles.navButton} onClick={onEnterArcade}>
          ARCADE
        </button>
        {/* Press Start 2P has no accented capitals; the résumé keeps its accents everywhere else. */}
        <a href="/resume.html" aria-label="Résumé">
          RESUME
        </a>
        <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
          GITHUB
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
