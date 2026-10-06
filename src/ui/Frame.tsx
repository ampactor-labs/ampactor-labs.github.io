import AMark from "./AMark";
import styles from "./Frame.module.css";

// The one line of frame on a page beside the cabinet: the A-mark, which walks
// back into the machine, over the cabinet's sunset rule. No nav, no footer,
// no light switch: the cabinet is the site, and these pages are its printout
// and its manual.
export default function Frame() {
  return (
    <header className={styles.frame}>
      <a href="/" className={styles.mark} aria-label="Ampactor Labs, home">
        <AMark size={22} />
        <span>AMPACTOR</span>
      </a>
    </header>
  );
}
