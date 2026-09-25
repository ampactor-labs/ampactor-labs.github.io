import { useState } from "react";
import { currentTheme, setTheme, type Theme } from "../lib/theme";
import styles from "./ThemeToggle.module.css";

// The room's light switch. Dark is the default; light is the same room with
// the lights on. The cabinet stays dark either way (see .cabinet-scope).
export default function ThemeToggle() {
  // The pre-paint script has already applied the resolved theme by the time
  // this mounts, so the document is the source of truth.
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document === "undefined" ? "patina-dark" : currentTheme(),
  );

  const light = theme === "patina-light";
  const next: Theme = light ? "patina-dark" : "patina-light";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => {
        setTheme(next);
        setThemeState(next);
      }}
      aria-pressed={light}
      aria-label={light ? "Lights on. Switch to dark theme" : "Lights off. Switch to light theme"}
      title={light ? "Switch to dark" : "Switch to light"}
    >
      <span className={styles.bulb} aria-hidden="true" />
      <span className={styles.label}>{light ? "LIGHTS ON" : "LIGHTS OFF"}</span>
    </button>
  );
}
