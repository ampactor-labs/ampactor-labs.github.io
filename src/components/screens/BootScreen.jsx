export default function BootScreen({
  lines,
  currentLine,
  bootPhase,
  onSkip,
  fs,
}) {
  if (bootPhase === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          animation: "testPattern 0.8s ease-out forwards",
        }}
        onClick={onSkip}
      >
        <svg
          viewBox="0 0 200 200"
          width="200"
          height="200"
          style={{ opacity: 0.7 }}
        >
          {[20, 40, 60, 80, 100].map((r) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke="#00E5FF"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          <line
            x1="100"
            y1="0"
            x2="100"
            y2="200"
            stroke="#00E5FF"
            strokeWidth="0.5"
            opacity="0.3"
          />
          <line
            x1="0"
            y1="100"
            x2="200"
            y2="100"
            stroke="#00E5FF"
            strokeWidth="0.5"
            opacity="0.3"
          />
          <line
            x1="29"
            y1="29"
            x2="171"
            y2="171"
            stroke="#00E5FF"
            strokeWidth="0.3"
            opacity="0.2"
          />
          <line
            x1="171"
            y1="29"
            x2="29"
            y2="171"
            stroke="#00E5FF"
            strokeWidth="0.3"
            opacity="0.2"
          />
          {/* A-mark */}
          <line
            x1="88"
            y1="118"
            x2="100"
            y2="88"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <line
            x1="112"
            y1="118"
            x2="100"
            y2="88"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M 93,108 C 95,102 97,102 99,108 C 101,114 103,114 105,108"
            stroke="#00E5FF"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />
          <line
            x1="85"
            y1="118"
            x2="91"
            y2="118"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <line
            x1="109"
            y1="118"
            x2="115"
            y2="118"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
        <div
          style={{
            fontSize: fs(7),
            color: "rgba(212,190,152,0.3)",
            letterSpacing: "0.15em",
            animation: "blink 2s step-end infinite",
            userSelect: "none",
          }}
        >
          [ TAP TO SKIP ]
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
          fontSize: fs(9),
          color: "var(--color-muted)",
          cursor: "pointer",
          letterSpacing: "0.1em",
          zIndex: 60,
        }}
      >
        [ SKIP ]
      </div>
      <div style={{ fontSize: fs(14), lineHeight: 2 }}>
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
                        : line.startsWith("CLEARANCE:")
                          ? "var(--color-teal)"
                          : line.startsWith("STATUS:")
                            ? "var(--color-amber)"
                            : line.includes("CLASSIFIED")
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
          [ press any key or tap A ]
        </div>
      )}
    </div>
  );
}
