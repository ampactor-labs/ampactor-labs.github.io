import { useRef, useEffect } from "react";

export default function SelectScreen({
  projects,
  selectedIdx,
  onSelect,
  onHover,
  coinCount,
  onHoverBlip,
  fs,
  gameHighlight,
}) {
  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current?.children[selectedIdx])
      listRef.current.children[selectedIdx].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
  }, [selectedIdx]);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: "1px solid rgba(0,229,255,0.1)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(16),
              color: "#00E5FF",
              textShadow: "0 0 12px rgba(0,229,255,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            SELECT PROGRAM
          </div>
          <div
            style={{
              fontSize: fs(10),
              color: "#b8c8d8",
              letterSpacing: "0.12em",
              marginTop: 3,
            }}
          >
            MORGAN ESPITIA {"\u00b7"} SYSTEMS ENGINEER
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              columnGap: 6,
              fontSize: fs(11),
              color: "#8a9aaa",
              letterSpacing: "0.08em",
              marginTop: 2,
            }}
          >
            <a href="mailto:ampactorlabs@gmail.com" style={{ color: "inherit", textDecoration: "none" }}>ampactorlabs@gmail.com</a>
            <a href="tel:+14352682446" style={{ color: "inherit", textDecoration: "none" }}>435-268-2446</a>
          </div>
          <div
            style={{
              fontSize: fs(11),
              color: "#b8c8d8",
              marginTop: 5,
              letterSpacing: "0.05em",
            }}
          >
            {projects.length} CARTRIDGE{projects.length !== 1 ? "S" : ""} LOADED
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: fs(9),
            color: "#96a8ba",
            textAlign: "right",
            lineHeight: 1.8,
          }}
        >
          {"\u25b2\u25bc"} NAV
          <br />
          {"\u24b6"} SELECT
        </div>
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label="Project list"
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {projects.map((p, i) => {
          const active = i === selectedIdx,
            isH = p.hidden,
            isGame = p.id === "tunnel-run",
            isGameGlow = isGame && gameHighlight;
          return (
            <div
              key={p.id}
              role="option"
              aria-selected={active}
              aria-label={`${p.title} — ${p.subtitle}`}
              className={`project-row${isH ? ` hidden-row tier-${p.tier}-enter` : ""}${isGameGlow ? " game-highlight" : ""}`}
              onClick={() => onSelect(i)}
              onMouseEnter={() => {
                onHover(i);
                onHoverBlip();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: isGame ? "14px 12px" : "10px 12px",
                borderRadius: 6,
                background: active
                  ? isH
                    ? "rgba(255,200,0,0.04)"
                    : "rgba(0,229,255,0.05)"
                  : "transparent",
                border: active
                  ? `1px solid ${isH ? "rgba(255,200,0,0.15)" : "rgba(0,229,255,0.15)"}`
                  : "1px solid transparent",
                position: "relative",
                borderLeft: isH ? `2px dashed ${p.color}33` : undefined,
                boxShadow: isGame && isH ? `0 0 8px ${p.color}22` : undefined,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: "70%",
                  background: active ? p.color : "transparent",
                  borderRadius: 2,
                  position: "absolute",
                  left: isH ? -1 : 2,
                  boxShadow: active ? `0 0 6px ${p.color}` : "none",
                  transition: "all 0.2s ease",
                }}
              />
              <div
                style={{
                  width: isGame ? 40 : 32,
                  height: isGame ? 40 : 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isGame ? fs(20) : fs(16),
                  color: p.color,
                  background: `${p.color}${isGame ? "1a" : "11"}`,
                  borderRadius: 5,
                  border: `1px solid ${p.color}${isGame ? "44" : "22"}`,
                  textShadow: active || isGame ? `0 0 8px ${p.color}` : "none",
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontFamily: "'Silkscreen', monospace",
                      fontSize: fs(14),
                      color: active ? p.color : "#b8c8d8",
                      textShadow: active ? `0 0 8px ${p.color}44` : "none",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {p.title}
                  </span>
                  <span
                    style={{
                      fontSize: fs(9),
                      color: "#96a8ba",
                      padding: "1px 5px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.05)",
                      flexShrink: 0,
                    }}
                  >
                    {p.lang}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: fs(10),
                    color: "#b8c8d8",
                    marginTop: 1,
                    letterSpacing: "0.08em",
                  }}
                >
                  {p.subtitle}
                </div>
              </div>
              {active && (
                <div
                  style={{
                    color: p.color,
                    fontSize: fs(14),
                    flexShrink: 0,
                    opacity: 0.6,
                  }}
                >
                  {"\u203a"}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid rgba(0,229,255,0.06)",
          overflow: "hidden",
          height: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            whiteSpace: "nowrap",
            fontSize: fs(8),
            color: "#5a6a7a",
            letterSpacing: "0.1em",
            animation: "marquee 90s linear infinite",
          }}
        >
          MORGAN ESPITIA {"\u00b7"} FULL-STACK + DSP + EMBEDDED {"\u00b7"} RUST{" "}
          {"\u00b7"} REACT {"\u00b7"} TYPESCRIPT {"\u00b7"} PYTHON {"\u00b7"}{" "}
          AUDIO ENGINEERING {"\u00b7"} SOLANA {"\u00b7"} x402 {"\u00b7"} SLC UT{" "}
          {"\u00b7\u00a0\u00a0\u00a0"}MORGAN ESPITIA {"\u00b7"} FULL-STACK + DSP
          + EMBEDDED {"\u00b7"} RUST {"\u00b7"} REACT {"\u00b7"} TYPESCRIPT{" "}
          {"\u00b7"} PYTHON {"\u00b7"} AUDIO ENGINEERING {"\u00b7"} SOLANA{" "}
          {"\u00b7"} x402 {"\u00b7"} SLC UT
        </div>
      </div>
    </div>
  );
}
