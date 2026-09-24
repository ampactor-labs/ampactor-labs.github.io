import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { detailLinksOf } from "../../hooks/useCabinetState";

const CoherenceField = lazy(() => import("../../CoherenceField"));
const SynthEngine = lazy(() => import("../../SynthEngine"));

function SectionLabel({ text, color, fs }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}
    >
      <span
        style={{
          fontFamily: "'Press Start 2P'",
          fontSize: fs(7),
          color: `${color}55`,
          letterSpacing: "0.2em",
        }}
      >
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: `${color}15` }} />
    </div>
  );
}

export default function DetailScreen({
  project: p,
  onBack,
  screenWidth,
  screenHeight,
  fs,
  bodyRef,
  linkRefs,
  focusedLink = 0,
}) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);
  const iw = Math.min(screenWidth, 400),
    ih = Math.min(screenHeight - 220, 240);
  // Standalone render (tests, stories) still works: fall back to local refs.
  const localBody = useRef(null);
  const localLinks = useRef([]);
  const body = bodyRef ?? localBody;
  const links = linkRefs ?? localLinks;
  const rail = detailLinksOf(p);
  const statusColor =
    p.status === "active"
      ? "var(--ui-signal-ok)"
      : p.status === "deployed"
        ? "var(--color-amber)"
        : "var(--color-steel)";
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: loaded ? 1 : 0,
        transform: loaded ? "none" : "translateY(10px)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `1px solid ${p.color}22`,
        }}
      >
        <div
          className="btn-cabinet"
          role="button"
          aria-label="Back to project list"
          tabIndex={0}
          onClick={onBack}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onBack();
            }
          }}
          style={{
            fontSize: fs(12),
            color: "var(--fg)",
            padding: "3px 7px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {"\u25c4"}
        </div>
        <div
          style={{
            fontSize: fs(20),
            color: p.color,
            textShadow: `0 0 12px ${p.color}44`,
          }}
        >
          {p.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(12),
              fontWeight: 400,
              color: p.color,
              textShadow: `0 0 10px ${p.color}44`,
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            {p.title}
          </h2>
          <div
            style={{
              fontSize: fs(10),
              color: "var(--fg)",
              letterSpacing: "0.1em",
              marginTop: 3,
            }}
          >
            {p.subtitle}
          </div>
        </div>
        {rail.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {rail.map((link, i) => {
              const demo = link.kind === "live";
              const focused = i === focusedLink;
              // The APK pill links to its GitHub releases PAGE now (the
              // notes + the .apk asset), but it must still navigate
              // same-tab: the A button activates links with a synthetic
              // `el.click()`, and mobile browsers block a programmatic
              // click that spawns a `target="_blank"` tab as a popup — so
              // pressing A did nothing. Same-tab navigation is never a
              // popup; the browser Back returns to the cabinet.
              const sameTab = /github\.com\/[^/]+\/[^/]+\/releases/.test(
                link.href || "",
              );
              return (
                <a
                  key={link.kind}
                  ref={(el) => {
                    links.current[i] = el;
                  }}
                  href={link.href}
                  target={sameTab ? undefined : "_blank"}
                  rel={sameTab ? undefined : "noopener noreferrer"}
                  aria-current={focused ? "true" : undefined}
                  style={{
                    fontSize: fs(10),
                    letterSpacing: "0.08em",
                    textDecoration: "none",
                    padding: "5px 12px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    fontWeight: demo ? 700 : 600,
                    color: demo ? "var(--color-void)" : p.color,
                    background: demo ? p.color : `${p.color}11`,
                    border: demo
                      ? "1px solid transparent"
                      : `1px solid ${p.color}55`,
                    // The focus ring is what tells you A will open this one.
                    boxShadow: focused
                      ? `0 0 0 2px var(--color-void), 0 0 0 4px ${p.color}, 0 0 18px ${p.color}99`
                      : demo
                        ? `0 0 14px ${p.color}66`
                        : "none",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  {demo ? link.label || "\u25b8 DEMO" : "\u203a SOURCE"}
                </a>
              );
            })}
          </div>
        )}
      </div>
      {/* Body */}
      <div ref={body} style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {/* Tagline stencil — rotated 90deg, barely visible */}
        {p.tagline && (
          <span
            style={{
              position: "absolute",
              right: 6,
              top: "50%",
              transform: "rotate(90deg)",
              transformOrigin: "right center",
              whiteSpace: "nowrap",
              fontFamily: "'Press Start 2P'",
              fontSize: fs(7),
              letterSpacing: "0.3em",
              color: `${p.color}0a`,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {p.tagline}
          </span>
        )}
        {/* Plain-language outcome — buyer-framed lead line */}
        {p.outcome && (
          <div
            style={{
              marginBottom: 14,
              fontSize: fs(13),
              lineHeight: 1.5,
              color: p.color,
              fontWeight: 600,
              maxWidth: 520,
              textShadow: `0 0 12px ${p.color}22`,
            }}
          >
            {p.outcome}
          </div>
        )}
        {/* Zone A — SYS/READOUT */}
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 4,
            background: `${p.color}05`,
            border: `1px solid ${p.color}0a`,
          }}
        >
          <SectionLabel color={p.color} text="SYS/READOUT" fs={fs} />
          <div
            style={{
              fontSize: fs(11),
              lineHeight: 1.75,
              color: "var(--fg)",
              maxWidth: 520,
            }}
          >
            <span style={{ color: p.color }}>&gt; </span>
            {p.desc}
          </div>
        </div>
        {/* Zone B — SPECIFICATIONS + STACK */}
        {(p.highlights || p.stack) && (
          <div
            style={{
              display: "flex",
              flexDirection: screenWidth < 340 ? "column" : "row",
              gap: 14,
              marginBottom: 14,
            }}
          >
            {p.highlights && (
              <div style={{ flex: 1 }}>
                <SectionLabel color={p.color} text="SPECIFICATIONS" fs={fs} />
                {p.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: fs(10),
                      color: "var(--fg)",
                      lineHeight: 1.8,
                      letterSpacing: "0.04em",
                    }}
                  >
                    <span style={{ color: `${p.color}88` }}>&gt;&gt; </span>
                    {h}
                  </div>
                ))}
              </div>
            )}
            {p.stack && (
              <div style={{ minWidth: 90 }}>
                <SectionLabel color={p.color} text="STACK" fs={fs} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {p.stack.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: fs(9),
                        padding: "2px 7px",
                        borderRadius: 3,
                        background: `${p.color}15`,
                        border: `1px solid ${p.color}30`,
                        color: `${p.color}cc`,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Zone C — OPERATOR NOTES (flagship projects only) */}
        {p.operatorNote && (
          <div
            style={{
              marginBottom: 14,
              padding: "8px 12px",
              borderRadius: 4,
              background: `${p.color}06`,
              border: `1px solid ${p.color}15`,
              borderLeft: `3px solid ${p.color}40`,
            }}
          >
            <SectionLabel color={p.color} text="OPERATOR NOTES" fs={fs} />
            <div
              style={{
                fontSize: fs(10),
                lineHeight: 1.75,
                color: "var(--fg)",
                fontStyle: "italic",
                maxWidth: 520,
              }}
            >
              {p.operatorNote}
            </div>
          </div>
        )}
        {/* Zone D — STATUS + TAGS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          {p.status && (
            <>
              <span style={{ fontSize: fs(10), color: statusColor }}>
                {"\u25cf"} {p.status.toUpperCase()}
              </span>
              <span style={{ color: "var(--color-comment)", fontSize: fs(10) }}>
                {"\u2502"}
              </span>
            </>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {p.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: fs(8),
                  padding: "2px 6px",
                  borderRadius: 3,
                  background: `${p.color}0a`,
                  border: `1px solid ${p.color}20`,
                  color: `${p.color}aa`,
                  letterSpacing: "0.05em",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {p.interactive === "coherence" && (
          <Suspense fallback={null}>
            <CoherenceField width={iw} height={ih} />
          </Suspense>
        )}
        {p.interactive === "synth" && (
          <Suspense fallback={null}>
            <SynthEngine width={iw} />
          </Suspense>
        )}
      </div>
      {/* Footer */}
      <div
        style={{
          paddingTop: 10,
          borderTop: `1px solid ${p.color}11`,
          fontSize: fs(8),
          color: "var(--color-muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>[ {"\u24b7"} BACK ]</span>
        {p.github ? (
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: `${p.color}aa`,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {p.github.replace("https://github.com/", "")}
          </a>
        ) : (
          <span>{p.id}</span>
        )}
      </div>
    </div>
  );
}
