// The CRT test pattern: concentric rings, crosshairs, and the A-mark. It is
// the boot sequence's phase 0 and the attract loop's first frame, so the
// markup lives here once. BootScreen's phase-0 output must stay identical to
// what it was before the extraction (its snapshot pins that).
export default function TestPattern({
  fs,
  onSkip,
  hint = "[ TAP TO SKIP ]",
  animate = true,
}) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        animation: animate ? "testPattern 0.5s ease-out forwards" : undefined,
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
      {hint ? (
        <div
          style={{
            fontSize: fs(9),
            color: "rgba(212,190,152,0.6)",
            letterSpacing: "0.15em",
            animation: "blink 2s step-end infinite",
            userSelect: "none",
            cursor: "pointer",
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
