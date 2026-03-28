export default function Cabinet({
  navUp,
  navDown,
  goBack,
  openProject,
  advanceBoot,
  insertCoin,
  screen,
  selectedIdx,
  coinCount,
  introComplete,
  fs,
  isBootTransitioning,
}) {
  const dpadBtn = {
    width: 30,
    height: 30,
    background:
      "linear-gradient(145deg, #3a3632 0%, #2e2a27 55%, #241f1c 100%)",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-muted)",
    fontSize: fs(9),
    border: "1.5px solid var(--color-umber)",
    boxShadow: [
      "0 3px 6px rgba(0,0,0,0.5)",
      "inset 0 1px 0 rgba(255,255,255,0.10)",
      "inset 0 -1px 0 rgba(0,0,0,0.4)",
    ].join(", "),
  };

  return (
    <div
      className="cabinet-body"
      style={{
        margin: "0 10px 10px",
        background:
          "linear-gradient(180deg, #2a2826 0%, #1d2021 40%, #0f0e0d 100%)",
        borderRadius: "0 0 16px 16px",
        border: "3px solid var(--color-umber)",
        borderTop: "2px solid var(--color-umber)",
        padding: "10px 20px",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: [
          "inset 0 2px 0 rgba(255,255,255,0.06)",
          "inset 0 -4px 14px rgba(0,0,0,0.65)",
          "0 4px 0 rgba(0,0,0,0.55)",
        ].join(", "),
      }}
    >
      {/* D-pad */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <div
          className="btn-cabinet"
          role="button"
          aria-label="Navigate up"
          tabIndex={0}
          onClick={navUp}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navUp();
            }
          }}
          style={dpadBtn}
        >
          {"\u25b2"}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <div
            className="btn-cabinet"
            role="button"
            aria-label="Go back"
            tabIndex={0}
            onClick={goBack}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goBack();
              }
            }}
            style={dpadBtn}
          >
            {"\u25c4"}
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              background: "radial-gradient(circle, #1c1e2e, #121420)",
              borderRadius: 4,
              border: "1.5px solid #242636",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7)",
            }}
          />
          <div
            style={{
              ...dpadBtn,
            }}
          >
            {"\u25ba"}
          </div>
        </div>
        <div
          className="btn-cabinet"
          role="button"
          aria-label="Navigate down"
          tabIndex={0}
          onClick={navDown}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navDown();
            }
          }}
          style={dpadBtn}
        >
          {"\u25bc"}
        </div>
      </div>

      {/* Center: logo, coin slot, CTA */}
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <svg
            viewBox="0 0 512 512"
            width="28"
            height="28"
            style={{
              filter:
                "drop-shadow(-1.5px 0 0 rgba(219,116,151,0.35)) drop-shadow(1.5px 0 0 rgba(0,80,255,0.3)) drop-shadow(0 0 6px rgba(0,229,255,0.4))",
            }}
          >
            <line
              x1="108"
              y1="408"
              x2="256"
              y2="104"
              stroke="#00E5FF"
              strokeWidth="36"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="404"
              y1="408"
              x2="256"
              y2="104"
              stroke="#00E5FF"
              strokeWidth="36"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
              stroke="#00E5FF"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="76"
              y1="408"
              x2="140"
              y2="408"
              stroke="#00E5FF"
              strokeWidth="36"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="372"
              y1="408"
              x2="436"
              y2="408"
              stroke="#00E5FF"
              strokeWidth="36"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(9),
              color: "#00E5FF",
              letterSpacing: "0.2em",
              textShadow: "0 0 8px rgba(0,229,255,0.4)",
            }}
          >
            AMPACTOR
          </div>
          <div
            style={{
              fontSize: fs(7),
              color: "var(--fg)",
              letterSpacing: "0.15em",
            }}
          >
            SALT LAKE CITY {"\u00b7"} EST. 2018
          </div>
          <div
            style={{
              fontSize: fs(6),
              color: "var(--color-comment)",
              letterSpacing: "0.12em",
            }}
          >
            <a
              href="https://github.com/ampactor"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-comment)", textDecoration: "none" }}
            >
              GH: AMPACTOR
            </a>
          </div>
        </div>
        <div
          className="coin-slot"
          role="button"
          aria-label="Insert coin"
          tabIndex={0}
          onClick={insertCoin}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              insertCoin();
            }
          }}
          title="Insert coin"
          style={{
            width: 60,
            height: 20,
            background:
              coinCount > 0
                ? "rgba(255,184,0,0.08)"
                : "linear-gradient(180deg, #0f0e0d 0%, #2a2826 60%, #0f0e0d 100%)",
            borderRadius: 10,
            border: `2px solid ${coinCount > 0 ? "rgba(255,184,0,0.45)" : "var(--color-umber)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              coinCount > 0
                ? "inset 0 2px 6px rgba(255,184,0,0.2), 0 0 10px rgba(255,184,0,0.15)"
                : [
                    "inset 0 2px 8px rgba(0,0,0,0.7)",
                    "0 1px 0 rgba(255,255,255,0.05)",
                  ].join(", "),
            opacity: introComplete && screen !== "boot" ? 1 : 0.3,
            pointerEvents: introComplete && screen !== "boot" ? "auto" : "none",
            cursor: introComplete && screen !== "boot" ? "pointer" : "default",
          }}
        >
          <div
            style={{
              width: 38,
              height: 4,
              background:
                coinCount > 0
                  ? "rgba(255,184,0,0.65)"
                  : "linear-gradient(90deg, #0f0e0d, #2a2826 35%, #45403d 50%, #2a2826 65%, #0f0e0d)",
              borderRadius: 2,
              boxShadow:
                coinCount > 0
                  ? "0 0 8px rgba(255,184,0,0.5)"
                  : "inset 0 1px 3px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.07)",
            }}
          />
        </div>
        {introComplete && screen !== "boot" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div
              style={{
                fontSize: fs(7),
                fontFamily: "'Press Start 2P', monospace",
                color: "var(--color-amber)",
                letterSpacing: "0.12em",
                opacity: coinCount > 0 ? 0 : 1,
                transition: "opacity 0.4s ease",
                animation: "blink 1.2s step-end infinite",
              }}
            >
              INSERT COIN
            </div>
          </div>
        )}
        <div
          style={{
            fontSize: fs(6),
            color: coinCount > 0 ? "rgba(255,184,0,0.5)" : "var(--color-umber)",
            letterSpacing: "0.15em",
            transition: "color 0.3s ease",
            animation:
              coinCount > 0 ? "none" : "coinTextPulse 3s ease-in-out infinite",
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          {coinCount >= 1 ? "\u25c9" : "\u25ce"}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            className="btn-action"
            role="button"
            aria-label="Back"
            tabIndex={0}
            onClick={goBack}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goBack();
              }
            }}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 38% 32%, #5a2a28 0%, #3e1a18 50%, #2c1210 100%)",
              border: "2.5px solid #5a3a38",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(9),
              color: "var(--ui-danger)",
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: [
                "0 0 16px rgba(234,105,98,0.40)",
                "0 0 6px rgba(234,105,98,0.70)",
                "0 4px 10px rgba(0,0,0,0.55)",
                "inset 0 1px 0 rgba(255,255,255,0.12)",
                "inset 0 -3px 6px rgba(0,0,0,0.45)",
              ].join(", "),
            }}
          >
            B
          </div>
          <div
            style={{
              fontSize: fs(5),
              color: "rgba(168,153,132,0.45)",
              letterSpacing: "0.12em",
              fontFamily: "'Press Start 2P', monospace",
              userSelect: "none",
            }}
          >
            BACK
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            className="btn-action"
            role="button"
            aria-label="Select"
            tabIndex={0}
            onClick={() => {
              if (screen === "boot") advanceBoot();
              if (screen === "select") {
                if (!isBootTransitioning()) openProject(selectedIdx);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (screen === "boot") advanceBoot();
                if (screen === "select") {
                  if (!isBootTransitioning()) openProject(selectedIdx);
                }
              }
            }}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 38% 32%, #164458 0%, #0c2a3a 50%, #071828 100%)",
              border: "2.5px solid #1e6888",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(9),
              color: "#00E5FF",
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: [
                "0 0 16px rgba(0,200,240,0.40)",
                "0 0 6px rgba(0,200,240,0.70)",
                "0 4px 10px rgba(0,0,0,0.55)",
                "inset 0 1px 0 rgba(255,255,255,0.12)",
                "inset 0 -3px 6px rgba(0,0,0,0.45)",
              ].join(", "),
            }}
          >
            A
          </div>
          <div
            style={{
              fontSize: fs(5),
              color: "rgba(168,153,132,0.45)",
              letterSpacing: "0.12em",
              fontFamily: "'Press Start 2P', monospace",
              userSelect: "none",
            }}
          >
            SELECT
          </div>
        </div>
      </div>
    </div>
  );
}
