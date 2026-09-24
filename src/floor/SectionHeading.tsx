import type { ReactNode } from "react";
import styles from "./Section.module.css";

// The repeating chapter heading: a Press Start 2P eyebrow, a hairline that
// takes the rest of the width, then the real heading and an optional lede.
export default function SectionHeading({
  id,
  eyebrow,
  title,
  lede,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede?: ReactNode;
}) {
  return (
    <div className={styles.heading}>
      <p className={styles.eyebrow} aria-hidden="true">
        <span>{eyebrow}</span>
        <span className={styles.rule} />
      </p>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
    </div>
  );
}
