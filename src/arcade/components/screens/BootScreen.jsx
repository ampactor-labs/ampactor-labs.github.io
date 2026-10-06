import TestPattern from "../TestPattern";
import { WORDS } from "../../../data/profile";
import { PALETTE } from "../../palette";
import { pixel } from "../../type";

// A BIOS status line: a name, dots, a verb, dots, OK.
const STATUS = /^(.+?) \.{2,} (.+?) \.{2,} (OK)$/;

export default function BootScreen({
  lines,
  currentLine,
  bootPhase,
  onSkip,
  fs,
  screenWidth = 400,
  // The test card holds while the tube is still powering on and only starts
  // to fade once it is fully lit; otherwise a machine that ignites from the
  // dark (the cold open, a hard load of /arcade/) blooms onto an empty tube.
  introComplete = true,
}) {

  if (bootPhase === 0) {
    return <TestPattern fs={fs} onSkip={onSkip} animate={introComplete} />;
  }
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        onClick={onSkip}
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          fontSize: fs(10),
          color: "var(--cab-voice)",
          cursor: "pointer",
          letterSpacing: "var(--track-ui)",
          zIndex: 60,
          opacity: 0.7,
        }}
      >
        {/* [ SKIP ] */}
      </div>
      {/* Every line is laid out from the start and the ones still to come
          are hidden, so the column has its final height at once: it prints
          top to bottom instead of re-centring each time a line lands. A
          status line ("name ..... verb ..... OK") is a lit checklist row:
          name, verb and a mint OK cell; every other line spans the row. The
          last line is the prompt (READY.), set in the display face. */}
      <div
        className="bios"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: Math.min(fs(14), screenWidth / 24),
          lineHeight: 2,
          maxWidth: "100%",
          whiteSpace: "nowrap",
        }}
      >
        {lines.flatMap((line, i) => {
          const hidden = i > currentLine ? "hidden" : undefined;
          const row = STATUS.exec(line);
          if (row)
            return [
              <span key={`${i}n`} style={{ visibility: hidden, color: "var(--cab-text)" }}>
                {row[1]}
              </span>,
              <span key={`${i}v`} style={{ visibility: hidden, color: "var(--cab-muted)" }}>
                {row[2]}
              </span>,
              <span key={`${i}k`} className="ok-cell" style={{ visibility: hidden }}>
                {row[3]}
              </span>,
            ];
          const last = i === lines.length - 1;
          return (
            <div
              key={i}
              className="wide"
              style={{
                visibility: hidden,
                color:
                  i === 0 || line === "ALL SYSTEMS NOMINAL" || line === WORDS.boot || line.startsWith("OPERATOR:")
                    ? PALETTE.mark
                    : last || line.startsWith("STATUS:")
                      ? "var(--cab-voice)"
                      : line.startsWith("FOCUS:") || line.includes("OK")
                        ? "var(--cab-ok)"
                        : "var(--cab-muted)",
                fontFamily: last ? "'Press Start 2P', monospace" : undefined,
                fontSize: last ? pixel(fs(12)) : undefined,
                marginTop: last ? 8 : undefined,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
