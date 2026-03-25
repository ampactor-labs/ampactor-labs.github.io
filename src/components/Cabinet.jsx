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
  return (
    <div
      className="cabinet-body"
      style={{
        margin: "0 10px 10px",
        background: "linear-gradient(180deg, #2a2c40 0%, #1e2030 100%)",
        borderRadius: "0 0 16px 16px",
        border: "3px solid #2a2c40",
        borderTop: "1px solid #363650",
        padding: "14px 20px",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
          style={{
            width: 34,
            height: 34,
            background: "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b8c8d8",
            fontSize: fs(11),
            border: "1px solid #565870",
            boxShadow:
              "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
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
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b8c8d8",
              fontSize: fs(11),
              border: "1px solid #565870",
              boxShadow:
                "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {"\u25c4"}
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              background: "radial-gradient(circle at 50% 50%, #2a2c40, #222436)",
              borderRadius: 5,
              border: "1px solid #3a3c52",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
            }}
          />
          <div
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b8c8d8",
              fontSize: fs(11),
              border: "1px solid #565870",
              boxShadow:
                "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
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
          style={{
            width: 34,
            height: 34,
            background: "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b8c8d8",
            fontSize: fs(11),
            border: "1px solid #565870",
            boxShadow:
              "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
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
          gap: 8,
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
              color: "#b8c8d8",
              letterSpacing: "0.15em",
            }}
          >
            SALT LAKE CITY {"\u00b7"} EST. 2018
          </div>
          <div
            style={{
              fontSize: fs(6),
              color: "#4a5a6a",
              letterSpacing: "0.12em",
            }}
          >
            <a
              href="https://github.com/ampactor"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4a5a6a", textDecoration: "none" }}
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
            width: 52,
            height: 16,
            background:
              coinCount > 0
                ? "rgba(255,184,0,0.1)"
                : "linear-gradient(180deg, #1e2030 0%, #222436 100%)",
            borderRadius: 8,
            border: `2px solid ${coinCount > 0 ? "rgba(255,184,0,0.35)" : "#3a3a4a"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              coinCount > 0
                ? "inset 0 2px 6px rgba(255,184,0,0.15)"
                : "inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)",
            opacity: introComplete && screen !== "boot" ? 1 : 0.3,
            pointerEvents:
              introComplete && screen !== "boot" ? "auto" : "none",
            cursor:
              introComplete && screen !== "boot" ? "pointer" : "default",
          }}
        >
          <div
            style={{
              width: 30,
              height: 3,
              background:
                coinCount > 0
                  ? "rgba(255,184,0,0.5)"
                  : "linear-gradient(90deg, #2a2a3a, #383848, #2a2a3a)",
              borderRadius: 2,
              boxShadow:
                coinCount > 0
                  ? "0 0 6px rgba(255,184,0,0.4)"
                  : "inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)",
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
                color: "#FFB800",
                letterSpacing: "0.12em",
                opacity: coinCount > 0 ? 0 : 1,
                transition: "opacity 0.4s ease",
                animation: "blink 1.2s step-end infinite",
              }}
            >
              INSERT COIN
            </div>
            <div
              style={{
                fontSize: fs(6),
                color: "#FFB800",
                letterSpacing: "0.1em",
                opacity: coinCount > 0 ? 0 : 0.7,
                transition: "opacity 0.4s ease",
                animation: "blink 1.2s step-end infinite",
              }}
            >
              UNLOCK HIDDEN DEMOS
            </div>
          </div>
        )}
        <div
          style={{
            fontSize: fs(6),
            color: coinCount > 0 ? "rgba(255,184,0,0.5)" : "#556",
            letterSpacing: "0.15em",
            transition: "color 0.3s ease",
            animation:
              coinCount > 0
                ? "none"
                : "coinTextPulse 3s ease-in-out infinite",
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          {coinCount >= 1 ? "\u25c9" : "\u25ce"}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div
          className="btn-cabinet"
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
            width: 42,
            height: 42,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, #664040, #441818 70%)",
            border: "2px solid #774444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: fs(9),
            color: "#ff7755",
            fontFamily: "'Press Start 2P', monospace",
            boxShadow:
              "0 3px 10px rgba(255,100,68,0.3), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
        >
          B
        </div>
        <div
          className="btn-cabinet"
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
            width: 42,
            height: 42,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, #2a5566, #143344 70%)",
            border: "2px solid #3a7799",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: fs(9),
            color: "#00E5FF",
            fontFamily: "'Press Start 2P', monospace",
            boxShadow:
              "0 3px 10px rgba(0,229,255,0.25), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
