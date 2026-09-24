import { CONTACT, MAILTO } from "../data/profile";
import { SITE } from "../data/site";
import styles from "./Floor.module.css";

export default function HeroText({
  inert,
  onEnterArcade,
}: {
  inert: boolean;
  onEnterArcade: () => void;
}) {
  return (
    <div className={styles.heroText} inert={inert || undefined}>
      <p className={styles.eyebrow}>AMPACTOR LABS · SALT LAKE CITY</p>
      <h1 className={styles.name}>{SITE.name}</h1>
      <p className={styles.range}>{SITE.range}</p>
      <p className={styles.status}>
        <span className={styles.dot} aria-hidden="true" />
        <span>Available — full-time or contract</span>
        <span aria-hidden="true">·</span>
        <span>{CONTACT.location}</span>
        <span aria-hidden="true">·</span>
        <span>remote</span>
      </p>
      <div className={styles.ctas}>
        <a className={styles.primary} href={MAILTO}>
          Email →
        </a>
        <a className={styles.ghost} href="/resume.html">
          Résumé
        </a>
        <button type="button" className={styles.ghost} onClick={onEnterArcade}>
          Enter the arcade ▸
        </button>
      </div>
      <p className={styles.hint} id="arcade-enter-hint">
        The cabinet is the portfolio: every project is a cartridge. Click it to
        play. Escape brings you back.
      </p>
    </div>
  );
}
