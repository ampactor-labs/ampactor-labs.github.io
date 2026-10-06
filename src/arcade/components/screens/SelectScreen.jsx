import { useRef, useEffect } from "react";
import { CONTACT, MAILTO } from "../../../data/profile";
import { MARQUEE_TEXT, MARQUEE_SECONDS } from "../../constants";
import { QUOTES } from "../../../data/quotes";
import { PALETTE, alpha } from "../../palette";

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

  // The list is the screen's one control, so it takes focus when the screen
  // comes up: the arrow keys land, and a screen reader hears the active row.
  useEffect(() => {
    listRef.current?.focus({ preventScroll: true });
  }, []);

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

  const pill = {
    fontFamily: "'Press Start 2P', monospace",
    color: PALETTE.mark,
    textDecoration: "none",
    display: "inline-block",
    fontSize: fs(8),
    lineHeight: 1,
    border: `1px solid ${alpha(PALETTE.mark, 0.35)}`,
    borderRadius: 3,
    background: alpha(PALETTE.mark, 0.06),
    padding: "7px 8px",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* The operator's sticker: who runs this machine and how to reach
          them, beside the three places a hiring manager goes next. */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "10px 16px",
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `1px solid ${alpha(PALETTE.mark, 0.1)}`,
        }}
      >
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div
            className="signage"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(16),
              lineHeight: 1.5,
              color: PALETTE.mark,
              letterSpacing: "0.1em",
            }}
          >
            SELECT PROGRAM
          </div>
          <h1
            style={{
              fontSize: fs(10),
              fontWeight: 400,
              color: "var(--cab-text)",
              letterSpacing: "0.12em",
              margin: "6px 0 0",
            }}
          >
            {CONTACT.name} · {CONTACT.role}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              columnGap: 10,
              fontSize: fs(11),
              color: "var(--cab-muted)",
              letterSpacing: "0.08em",
              marginTop: 2,
            }}
          >
            <a href={MAILTO} style={{ color: "inherit", textDecoration: "none" }}>
              {CONTACT.email}
            </a>
            <a
              href={`tel:${CONTACT.phoneTel}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
        <nav
          aria-label="Operator"
          style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}
        >
          {/* Press Start 2P draws É as a small é, so the sign reads RESUME, and
              that is also its name for a voice-control user. */}
          <a href="/resume.html" className="pill" style={pill}>
            RESUME
          </a>
          <a href={CONTACT.github} target="_blank" rel="noopener noreferrer" className="pill" style={pill}>
            GITHUB
          </a>
          <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" className="pill" style={pill}>
            LINKEDIN
          </a>
        </nav>
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label="Project list"
        tabIndex={0}
        aria-activedescendant={
          projects[selectedIdx] ? `program-${projects[selectedIdx].id}` : undefined
        }
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          // The lit row is the focus indicator, as in a listbox.
          outline: "none",
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
            web3: "WEB3",
            creative: "CREATIVE",
            operator: "OPERATOR",
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
                      color: alpha(PALETTE.mark, 0.3),
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
                      background: alpha(PALETTE.mark, 0.08),
                    }}
                  />
                </div>
              )}
              <div
                key={`row-${p.id}`}
                id={`program-${p.id}`}
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
                      ? alpha(PALETTE.coin, 0.04)
                      : alpha(PALETTE.mark, 0.05)
                    : "transparent",
                  border: active
                    ? `1px solid ${isH ? alpha(PALETTE.coin, 0.15) : alpha(PALETTE.mark, 0.15)}`
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
                        color: active ? p.color : "var(--cab-text)",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {p.title}
                    </span>
                    <span
                      style={{
                        fontSize: fs(9),
                        color: "var(--cab-muted)",
                        padding: "1px 5px",
                        background: alpha(PALETTE.white, 0.03),
                        borderRadius: 3,
                        border: `1px solid ${alpha(PALETTE.white, 0.05)}`,
                        flexShrink: 0,
                      }}
                    >
                      {p.lang}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: fs(10),
                      color: "var(--cab-text)",
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
                borderLeft: `2px dashed ${alpha(PALETTE.coin, 0.2)}`,
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
                  color: "var(--cab-faint)",
                  background: alpha(PALETTE.coin, 0.05),
                  borderRadius: 5,
                  border: `1px solid ${alpha(PALETTE.coin, 0.1)}`,
                  flexShrink: 0,
                }}
              >
                {"\uD83D\uDD12"}
              </div>
              <div>
                <div
                  style={{
                    fontSize: fs(11),
                    color: "var(--cab-faint)",
                    letterSpacing: "0.1em",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}
                >
                  [CLASSIFIED]
                </div>
                <div
                  style={{
                    fontSize: fs(9),
                    color: "var(--cab-faint)",
                    letterSpacing: "0.08em",
                    marginTop: 1,
                  }}
                >
                  {QUOTES.locked}
                </div>
              </div>
            </div>
          ))}
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${alpha(PALETTE.mark, 0.06)}`,
          overflow: "hidden",
          height: 24,
          position: "relative",
        }}
      >
        <div
          className="marquee-track"
          style={{
            fontSize: fs(8),
            color: "var(--cab-faint)",
            letterSpacing: "0.1em",
            animationDuration: `${MARQUEE_SECONDS}s`,
          }}
        >
          <span style={{ paddingRight: 48 }}>{MARQUEE_TEXT}</span>
          <span aria-hidden="true" style={{ paddingRight: 48 }}>
            {MARQUEE_TEXT}
          </span>
        </div>
      </div>
    </div>
  );
}
