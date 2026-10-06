import { CHROME, FRINGE, PALETTE, alpha } from "../palette";
// Every d-pad key goes through here, so none of them can ship as a bare div with
// no handler again — which is how ► stayed dead on every screen.
function DpadButton({ label, glyph, onPress, style }) {
  return (
    <div
      className="btn-cabinet"
      role="button"
      aria-label={label}
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPress();
        }
      }}
      style={style}
    >
      {glyph}
    </div>
  );
}

export default function Cabinet({
  navUp,
  navDown,
  navLeft,
  navRight,
  pressA,
  goBack,
  insertCoin,
  screen,
  coinCount,
  introComplete,
  fs,
  // On the floor the panel is decoration: it looks live but takes no input.
  attract = false,
  inert = false,
}) {
  const panelLive = attract || (introComplete && screen !== "boot");
  const dpadBtn = {
    width: 30,
    height: 30,
    background:
      `linear-gradient(145deg, ${CHROME.dpad[0]} 0%, ${CHROME.dpad[1]} 55%, ${CHROME.dpad[2]} 100%)`,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--cab-muted)",
    fontSize: fs(9),
    border: "1.5px solid var(--cab-line)",
    boxShadow: [
      `0 3px 6px ${alpha(PALETTE.black, 0.5)}`,
      `inset 0 1px 0 ${alpha(PALETTE.white, 0.10)}`,
      `inset 0 -1px 0 ${alpha(PALETTE.black, 0.4)}`,
    ].join(", "),
  };

  return (
    <div
      className="cabinet-body"
      inert={inert || undefined}
      style={{
        margin: "0 10px 10px",
        background:
          `linear-gradient(180deg, ${PALETTE.raised} 0%, ${PALETTE.room} 40%, ${PALETTE.void} 100%)`,
        borderRadius: "0 0 16px 16px",
        border: "3px solid var(--cab-line)",
        borderTop: "2px solid var(--cab-line)",
        padding: "10px 20px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: [
          `inset 0 2px 0 ${alpha(PALETTE.white, 0.06)}`,
          `inset 0 -4px 14px ${alpha(PALETTE.black, 0.65)}`,
          `0 4px 0 ${alpha(PALETTE.black, 0.55)}`,
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
        <DpadButton label="Navigate up" glyph={"\u25b2"} onPress={navUp} style={dpadBtn} />
        <div style={{ display: "flex", gap: 2 }}>
          <DpadButton
            label="Navigate left"
            glyph={"\u25c4"}
            onPress={navLeft}
            style={dpadBtn}
          />
          <div
            style={{
              width: 30,
              height: 30,
              background: `radial-gradient(circle, ${CHROME.centre[0]}, ${CHROME.centre[1]})`,
              borderRadius: 4,
              border: `1.5px solid ${CHROME.centre[2]}`,
              boxShadow: `inset 0 2px 8px ${alpha(PALETTE.black, 0.7)}`,
            }}
          />
          <DpadButton
            label="Navigate right"
            glyph={"\u25ba"}
            onPress={navRight}
            style={dpadBtn}
          />
        </div>
        <DpadButton
          label="Navigate down"
          glyph={"\u25bc"}
          onPress={navDown}
          style={dpadBtn}
        />
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
                `drop-shadow(-1.5px 0 0 ${alpha(FRINGE.warm, 0.35)}) drop-shadow(1.5px 0 0 ${alpha(FRINGE.cool, 0.3)}) drop-shadow(0 0 6px ${alpha(PALETTE.mark, 0.4)})`,
            }}
          >
            <line
              x1="108"
              y1="408"
              x2="256"
              y2="104"
              stroke={PALETTE.mark}
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
              stroke={PALETTE.mark}
              strokeWidth="36"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
              stroke={PALETTE.mark}
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
              stroke={PALETTE.mark}
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
              stroke={PALETTE.mark}
              strokeWidth="36"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div
            className="signage"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(9),
              color: PALETTE.mark,
              letterSpacing: "0.2em",
            }}
          >
            AMPACTOR
          </div>
          <div
            style={{
              fontSize: fs(7),
              color: "var(--cab-text)",
              letterSpacing: "0.15em",
            }}
          >
            SALT LAKE CITY {"\u00b7"} EST. 2018
          </div>
        </div>
        <div
          className={`coin-slot${coinCount > 0 ? " lit" : ""}`}
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
                ? alpha(PALETTE.coin, 0.08)
                : `linear-gradient(180deg, ${PALETTE.void} 0%, ${PALETTE.raised} 60%, ${PALETTE.void} 100%)`,
            borderRadius: 10,
            border: `2px solid ${coinCount > 0 ? alpha(PALETTE.coin, 0.45) : "var(--cab-line)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow:
              coinCount > 0
                ? `inset 0 2px 6px ${alpha(PALETTE.coin, 0.2)}, 0 0 10px ${alpha(PALETTE.coin, 0.15)}`
                : [
                    `inset 0 2px 8px ${alpha(PALETTE.black, 0.7)}`,
                    `0 1px 0 ${alpha(PALETTE.white, 0.05)}`,
                  ].join(", "),
            opacity: panelLive ? 1 : 0.3,
            pointerEvents: panelLive ? "auto" : "none",
            cursor: panelLive ? "pointer" : "default",
          }}
        >
          <div
            className="slit"
            style={{
              width: 38,
              height: 4,
              background:
                coinCount > 0
                  ? alpha(PALETTE.coin, 0.65)
                  : `linear-gradient(90deg, ${PALETTE.void}, ${PALETTE.raised} 35%, ${PALETTE.line} 50%, ${PALETTE.raised} 65%, ${PALETTE.void})`,
              borderRadius: 2,
              boxShadow:
                coinCount > 0
                  ? `0 0 8px ${alpha(PALETTE.coin, 0.5)}`
                  : `inset 0 1px 3px ${alpha(PALETTE.black, 0.7)}, 0 1px 0 ${alpha(PALETTE.white, 0.07)}`,
            }}
          />
        </div>
        {panelLive && (
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
                color: "var(--cab-voice)",
                letterSpacing: "0.12em",
                opacity: coinCount > 0 ? 0 : 1,
                transition: "opacity 0.4s ease",
                animation: coinCount > 0 ? "none" : "breathe 2.4s ease-in-out infinite",
              }}
            >
              INSERT COIN
            </div>
          </div>
        )}
        <div
          style={{
            fontSize: fs(6),
            color: coinCount > 0 ? alpha(PALETTE.coin, 0.5) : "var(--cab-line)",
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
                `radial-gradient(circle at 38% 32%, ${CHROME.b[0]} 0%, ${CHROME.b[1]} 50%, ${CHROME.b[2]} 100%)`,
              border: `2.5px solid ${CHROME.b[3]}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(9),
              color: "var(--cab-danger)",
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: [
                `0 0 16px ${alpha(PALETTE.danger, 0.40)}`,
                `0 0 6px ${alpha(PALETTE.danger, 0.70)}`,
                `0 4px 10px ${alpha(PALETTE.black, 0.55)}`,
                `inset 0 1px 0 ${alpha(PALETTE.white, 0.12)}`,
                `inset 0 -3px 6px ${alpha(PALETTE.black, 0.45)}`,
              ].join(", "),
            }}
          >
            B
          </div>
          <div
            style={{
              fontSize: fs(5),
              color: alpha(PALETTE.muted, 0.45),
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
            aria-label={screen === "detail" ? "Open link" : "Select"}
            tabIndex={0}
            onClick={pressA}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pressA();
              }
            }}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background:
                `radial-gradient(circle at 38% 32%, ${CHROME.a[0]} 0%, ${CHROME.a[1]} 50%, ${CHROME.a[2]} 100%)`,
              border: `2.5px solid ${CHROME.a[3]}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(9),
              color: PALETTE.mark,
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: [
                `0 0 16px ${alpha(PALETTE.mark, 0.40)}`,
                `0 0 6px ${alpha(PALETTE.mark, 0.70)}`,
                `0 4px 10px ${alpha(PALETTE.black, 0.55)}`,
                `inset 0 1px 0 ${alpha(PALETTE.white, 0.12)}`,
                `inset 0 -3px 6px ${alpha(PALETTE.black, 0.45)}`,
              ].join(", "),
            }}
          >
            A
          </div>
          <div
            style={{
              fontSize: fs(5),
              color: alpha(PALETTE.muted, 0.45),
              letterSpacing: "0.12em",
              fontFamily: "'Press Start 2P', monospace",
              userSelect: "none",
            }}
          >
            {screen === "detail" ? "OPEN" : "SELECT"}
          </div>
        </div>
      </div>
    </div>
  );
}
