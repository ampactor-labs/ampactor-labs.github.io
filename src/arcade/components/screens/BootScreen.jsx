import TestPattern from "../TestPattern";

export default function BootScreen({
  lines,
  currentLine,
  bootPhase,
  onSkip,
  fs,
  screenWidth = 400,
}) {
  const bootColumnWidth = `${Math.max(1, ...lines.map((line) => line.length))}ch`;

  if (bootPhase === 0) {
    return <TestPattern fs={fs} onSkip={onSkip} />;
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
          color: "var(--color-amber)",
          cursor: "pointer",
          letterSpacing: "0.1em",
          zIndex: 60,
          opacity: 0.7,
        }}
      >
        {/* [ SKIP ] */}
      </div>
      <div
        style={{
          fontSize: Math.min(fs(14), screenWidth / 28),
          lineHeight: 2,
          maxWidth: "100%",
          textAlign: "left",
          whiteSpace: "nowrap",
          width: bootColumnWidth,
        }}
      >
        {lines.slice(0, currentLine + 1).map((line, i) => (
          <div
            key={i}
            style={{
              color:
                i === 0
                  ? "#00E5FF"
                  : line === "ALL SYSTEMS NOMINAL"
                    ? "#00E5FF"
                    : line === "PRESS ANY KEY"
                      ? "var(--color-amber)"
                      : line.startsWith("OPERATOR:")
                        ? "#00E5FF"
                        : line.startsWith("FOCUS:")
                          ? "var(--color-teal)"
                          : line.startsWith("STATUS:")
                            ? "var(--color-amber)"
                            : line.includes("OK")
                              ? "var(--color-teal)"
                              : "var(--color-muted)",
              animation: i === currentLine ? "slideUp 0.2s ease" : undefined,
              fontFamily:
                line === "PRESS ANY KEY"
                  ? "'Press Start 2P', monospace"
                  : undefined,
              fontSize: line === "PRESS ANY KEY" ? fs(13) : undefined,
              textAlign: line === "PRESS ANY KEY" ? "center" : undefined,
              marginTop: line === "PRESS ANY KEY" ? 8 : undefined,
            }}
          >
            {line}
            {i === currentLine && line !== "" && (
              <span className="blink-cursor" style={{ color: "#00E5FF" }}>
                {" "}
                {"\u2588"}
              </span>
            )}
          </div>
        ))}
      </div>
      {currentLine >= 6 && (
        <div
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: fs(9),
            color: "var(--color-muted)",
            cursor: "pointer",
          }}
          onClick={onSkip}
        >
          {/* [ press any key or tap A ] */}
        </div>
      )}
    </div>
  );
}
