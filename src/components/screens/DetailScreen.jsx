import { lazy, Suspense, useState, useEffect } from "react";

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
}) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);
  const iw = Math.min(screenWidth, 400),
    ih = Math.min(screenHeight - 220, 240);
  const statusColor =
    p.status === "active"
      ? "#00ff88"
      : p.status === "deployed"
        ? "#ffaa00"
        : "#4488ff";
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
            color: "#b8c8d8",
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
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: fs(12),
              color: p.color,
              textShadow: `0 0 10px ${p.color}44`,
              letterSpacing: "0.05em",
            }}
          >
            {p.title}
          </div>
          <div
            style={{
              fontSize: fs(10),
              color: "#b8c8d8",
              letterSpacing: "0.1em",
              marginTop: 3,
            }}
          >
            {p.subtitle}
          </div>
        </div>
        {p.github && (
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: fs(10),
              color: "#b8c8d8",
              letterSpacing: "0.08em",
              textDecoration: "none",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {"\u203a"} SOURCE
          </a>
        )}
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
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
              color: "#b8c8d8",
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
                      color: "#b8c8d8",
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
                color: "#c8d8e8",
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
              <span style={{ color: "#333", fontSize: fs(10) }}>
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
          color: "#96a8ba",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>[ {"\u24b7"} BACK ]</span>
        <span>
          {p.github ? p.github.replace("https://github.com/", "") : p.id}
        </span>
      </div>
    </div>
  );
}
