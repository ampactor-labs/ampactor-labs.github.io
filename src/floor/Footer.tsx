import { CONTACT, MAILTO } from "../data/profile";
import styles from "./Floor.module.css";

const REPO = "https://github.com/ampactor-labs/ampactor-labs.github.io";

export default function Footer({ inert }: { inert: boolean }) {
  return (
    <footer className={styles.footer} inert={inert || undefined}>
      <div className={styles.footerLinks}>
        <a href={MAILTO}>{CONTACT.email}</a>
        <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <span>{CONTACT.location}</span>
      </div>
      <div>
        React 19 · Vite 8 · TypeScript ·{" "}
        <a href={REPO} target="_blank" rel="noopener noreferrer">
          source →
        </a>
      </div>
    </footer>
  );
}
