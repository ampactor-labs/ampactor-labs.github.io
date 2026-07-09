import { useRef, useEffect } from "react";
import { CONTACT, MAILTO } from "../../data/profile";

export default function SelectScreen({
  projects,
  selectedIdx,
  onSelect,
  onHover,
  onHoverBlip,
  onHoverSelect,
  fs,
  gameHighlight,
  coinCount,
}) {
  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current?.children[selectedIdx])
      listRef.current.children[selectedIdx].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
  }, [selectedIdx]);

  useEffect(() => {
    if (coinCount > 0 && listRef.current) {
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [coinCount]);

  const metadataNode = (
    <>
      <div
        style={{
          fontSize: fs(10),
          color: "var(--fg)",
          letterSpacing: "0.12em",
          marginTop: 6,
        }}
      >
        MORGAN ESPITIA · SYSTEMS ENGINEER
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          columnGap: 6,
          fontSize: fs(11),
          color: "var(--color-muted)",
          letterSpacing: "0.08em",
          marginTop: 2,
        }}
      >
        <a
          href={`mailto:${CONTACT.email}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {CONTACT.email}
        </a>
        <a
          href={`tel:${CONTACT.phoneTel}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {CONTACT.phoneDisplay}
        </a>
      </div>
    </>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* DESKTOP HEADER */}
      <div
        className="desktop-only-flex"
        style={{
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
          {metadataNode}
        </div>
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: fs(8),
            color: "var(--color-muted)",
            textAlign: "right",
            lineHeight: 2.0,
          }}
        >
          <a
            href={CONTACT.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#00E5FF",
              textDecoration: "none",
              display: "inline-block",
              fontSize: fs(8),
              border: "1px solid rgba(0,229,255,0.35)",
              borderRadius: 3,
              background: "rgba(0,229,255,0.06)",
              padding: "3px 7px",
              marginBottom: 5,
            }}
          >
            GITHUB
          </a>
          <br />
          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#00E5FF",
              textDecoration: "none",
              display: "inline-block",
              fontSize: fs(8),
              border: "1px solid rgba(0,229,255,0.35)",
              borderRadius: 3,
              background: "rgba(0,229,255,0.06)",
              padding: "3px 7px",
              marginBottom: 5,
            }}
          >
            LINKEDIN
          </a>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div
        className="mobile-only-block"
        style={{
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: "1px solid rgba(0,229,255,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(16),
              color: "#00E5FF",
              textShadow: "0 0 12px rgba(0,229,255,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            SELECT
          </div>
          <a
            href={CONTACT.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              color: "#00E5FF",
              textDecoration: "none",
              display: "inline-block",
              fontSize: fs(8),
              border: "1px solid rgba(0,229,255,0.35)",
              borderRadius: 3,
              background: "rgba(0,229,255,0.06)",
              padding: "3px 7px",
            }}
          >
            GITHUB
          </a>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(16),
              color: "#00E5FF",
              textShadow: "0 0 12px rgba(0,229,255,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            PROGRAM
          </div>
          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              color: "#00E5FF",
              textDecoration: "none",
              display: "inline-block",
              fontSize: fs(8),
              border: "1px solid rgba(0,229,255,0.35)",
              borderRadius: 3,
              background: "rgba(0,229,255,0.06)",
              padding: "3px 7px",
            }}
          >
            LINKEDIN
          </a>
        </div>

        <div>
          {metadataNode}
        </div>
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label="Project list"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
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
          const prevCategory = i > 0 ? projects[i - 1].category : null;
          const showHeader = !isH && p.category && p.category !== prevCategory;
          const CATEGORY_LABELS = {
            systems: "SYSTEMS",
            security: "SECURITY",
            defi: "DEFI",
            tooling: "TOOLING",
            creative: "CREATIVE",
          };
          return (
            <div key={p.id}>
              {showHeader && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 4px 4px",
                    marginTop: i === 0 ? 0 : 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: fs(7),
                      color: "rgba(0,229,255,0.3)",
                      letterSpacing: "0.3em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {CATEGORY_LABELS[p.category] ?? p.category.toUpperCase()}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "rgba(0,229,255,0.08)",
                    }}
                  />
                </div>
              )}
              <div
                key={`row-${p.id}`}
                role="option"
                aria-selected={active}
                aria-label={`${p.title} — ${p.subtitle}`}
                className={`project-row${isH ? ` hidden-row tier-${p.tier}-enter` : ""}${isGameGlow ? " game-highlight" : ""}`}
                onClick={() => onSelect(i)}
                onMouseEnter={() => {
                  onHoverSelect(i);
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
                    textShadow:
                      active || isGame ? `0 0 8px ${p.color}` : "none",
                    flexShrink: 0,
                  }}
                >
                  {p.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: fs(14),
                        color: active ? p.color : "var(--fg)",
                        textShadow: active ? `0 0 8px ${p.color}44` : "none",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {p.title}
                    </span>
                    <span
                      style={{
                        fontSize: fs(9),
                        color: "var(--color-muted)",
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
                      color: "var(--fg)",
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
            </div>
          );
        })}
        {coinCount === 0 &&
          [1, 2, 3].map((tier) => (
            <div
              key={`locked-${tier}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 6,
                opacity: 0.3,
                pointerEvents: "none",
                borderLeft: "2px dashed rgba(255,184,0,0.2)",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: fs(14),
                  color: "var(--color-comment)",
                  background: "rgba(255,184,0,0.05)",
                  borderRadius: 5,
                  border: "1px solid rgba(255,184,0,0.1)",
                  flexShrink: 0,
                }}
              >
                {"\uD83D\uDD12"}
              </div>
              <div>
                <div
                  style={{
                    fontSize: fs(11),
                    color: "var(--color-comment)",
                    letterSpacing: "0.1em",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}
                >
                  [CLASSIFIED]
                </div>
                <div
                  style={{
                    fontSize: fs(9),
                    color: "var(--color-comment)",
                    letterSpacing: "0.08em",
                    marginTop: 1,
                  }}
                >
                  INSERT COIN TO UNLOCK
                </div>
              </div>
            </div>
          ))}
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid rgba(0,229,255,0.06)",
          overflow: "hidden",
          height: 24,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            whiteSpace: "nowrap",
            fontSize: fs(8),
            color: "var(--color-comment)",
            letterSpacing: "0.1em",
            animation: "marquee 90s linear infinite",
          }}
        >
          MORGAN ESPITIA {"\u00b7"} COMPILER {"\u00b7"} DSP {"\u00b7"} EMBEDDED{" "}
          {"\u00b7"} SECURITY {"\u00b7"} RUST {"\u00b7"} WASM {"\u00b7"}{" "}
          {"\u00b7"} github.com/ampactor-labs
          {"\u00a0\u00a0\u00a0\u00b7\u00a0\u00a0\u00a0"}SELF-HOSTING COMPILER{" "}
          {"\u00b7"} ZERO-HEAP DSP KERNEL {"\u00b7"} DETERMINISTIC NETCODE{" "}
          {"\u00b7"} TERNARY ML ARCHITECTURE {"\u00b7"} AVAILABLE FOR CONTRACT{" "}
          {"\u00b7"} ampactorlabs@gmail.com
        </div>
      </div>
    </div>
  );
}
