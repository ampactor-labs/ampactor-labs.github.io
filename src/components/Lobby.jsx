import { useState } from "react";
import { PROJECTS } from "../data/projects";
import {
  CONTACT,
  MAILTO,
  POSITIONING,
  PROOF,
  TAKE_ON,
  FLAGSHIP_IDS,
} from "../data/profile";

// The lobby is the front desk: a fast, skimmable conversion surface that paints
// instantly (no boot, no GSAP, no audio). Same visual world as the arcade cabinet
// — CRT teal, patina palette, mono fonts — but calmer. A buyer can read everything
// they need and make contact here without ever entering the cabinet.

const lobbyStyles = `
  .lobby { color: var(--fg); font-family: var(--font-body); }
  .lobby ::selection { background: var(--color-umber); color: var(--fg); }
  .lobby-link { color: var(--color-muted); text-decoration: none; transition: color 0.15s ease; }
  .lobby-link:hover { color: var(--color-cyan); }
  .lobby-cta {
    text-decoration: none;
    transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease;
  }
  .lobby-cta:hover { background: rgba(0,229,255,0.14); box-shadow: 0 0 24px rgba(0,229,255,0.25); transform: translateY(-1px); }
  .lobby-cta:active { transform: translateY(0); }
  .lobby-ghost { text-decoration: none; transition: color 0.15s ease, border-color 0.15s ease; }
  .lobby-ghost:hover { color: var(--fg); border-color: var(--hairline-strong); }
  .lobby-card { text-decoration: none; transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease; }
  .lobby-card:hover { transform: translateY(-3px); }
  .lobby-explore { transition: background 0.18s ease, box-shadow 0.18s ease, letter-spacing 0.2s ease; cursor: pointer; }
  .lobby-explore:hover { background: rgba(0,229,255,0.06); box-shadow: inset 0 0 30px rgba(0,229,255,0.06); letter-spacing: 0.24em; }
  .lobby-scan {
    position: fixed; inset: 0; pointer-events: none; z-index: 2; opacity: 0.2;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline) 2px, var(--scanline) 3px);
  }
  @media (prefers-reduced-motion: reduce) {
    .lobby *, .lobby-explore { transition: none !important; animation: none !important; }
  }
`;

function AMark({ size = 34 }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden="true"
      style={{
        color: "var(--color-cyan)",
        filter: "drop-shadow(0 0 8px rgba(0,229,255,0.4))",
      }}
    >
      <line
        x1="108"
        y1="408"
        x2="256"
        y2="104"
        stroke="currentColor"
        strokeWidth="36"
        strokeLinecap="round"
      />
      <line
        x1="404"
        y1="408"
        x2="256"
        y2="104"
        stroke="currentColor"
        strokeWidth="36"
        strokeLinecap="round"
      />
      <path
        d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="76"
        y1="408"
        x2="140"
        y2="408"
        stroke="currentColor"
        strokeWidth="36"
        strokeLinecap="round"
      />
      <line
        x1="372"
        y1="408"
        x2="436"
        y2="408"
        stroke="currentColor"
        strokeWidth="36"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-arcade)",
          fontSize: 8,
          letterSpacing: "0.3em",
          color: "var(--color-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
    </div>
  );
}

// Live-product proof shot. Renders only when the flagship's `live` URL is set AND
// public/scry-preview.png loads — so it never shows a broken link or a missing image.
// While the product is offline (live: null) the whole panel is absent.
const PRODUCT_SHOT = "/scry-preview.png";

function ProductPreview({ liveUrl }) {
  const [loaded, setLoaded] = useState(false);
  if (!liveUrl) return null;
  const host = liveUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return (
    <section style={{ display: loaded ? "block" : "none" }}>
      <SectionLabel>SEE IT LIVE</SectionLabel>
      <a
        className="lobby-card"
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid rgba(0,229,255,0.22)",
          boxShadow: "0 0 30px rgba(0,229,255,0.08)",
          textDecoration: "none",
        }}
      >
        <img
          src={PRODUCT_SHOT}
          alt="Scry — Solana token-safety scanner, live scan result"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
          style={{ display: "block", width: "100%", height: "auto" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            fontSize: 12,
            letterSpacing: "0.04em",
            color: "var(--color-muted)",
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <span>
            Scry — live Solana token-safety scanner, taking real payments
          </span>
          <span style={{ color: "var(--color-cyan)", whiteSpace: "nowrap" }}>
            {host} →
          </span>
        </div>
      </a>
    </section>
  );
}

export default function Lobby({ onEnter }) {
  const flagships = FLAGSHIP_IDS.map((id) =>
    PROJECTS.find((p) => p.id === id),
  ).filter(Boolean);
  // Single switch: the SEE IT LIVE panel follows the flagship's `live` URL.
  const scryLive = flagships.find((p) => p.id === "tokensafe")?.live ?? null;

  return (
    <div
      className="lobby"
      style={{
        height: "100dvh",
        width: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // 'safe center' keeps short content vertically centered but anchors to
        // the top (instead of clipping) once content exceeds the viewport.
        justifyContent: "safe center",
        padding: "clamp(20px, 5vw, 56px) clamp(20px, 5vw, 48px)",
      }}
    >
      <style>{lobbyStyles}</style>
      <div className="lobby-scan" />

      <div
        style={{
          maxWidth: 780,
          width: "100%",
          margin: 0,
          flexShrink: 0,
          position: "relative",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          gap: "clamp(36px, 6vw, 56px)",
        }}
      >
        {/* Header — wordmark + nav */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AMark />
            <span
              style={{
                fontFamily: "var(--font-arcade)",
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "var(--color-cyan)",
                textShadow: "0 0 12px rgba(0,229,255,0.4)",
              }}
            >
              AMPACTOR
            </span>
          </div>
          <nav
            style={{
              display: "flex",
              gap: 18,
              fontSize: 12,
              letterSpacing: "0.08em",
              flexWrap: "wrap",
            }}
          >
            <a
              className="lobby-link"
              href={CONTACT.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              GITHUB
            </a>
            <a
              className="lobby-link"
              href={CONTACT.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              LINKEDIN
            </a>
            <a className="lobby-link" href="/resume.html">
              RÉSUMÉ
            </a>
            <a className="lobby-link" href={`mailto:${CONTACT.email}`}>
              EMAIL
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section>
          <div
            style={{
              fontFamily: "var(--font-arcade)",
              fontSize: 10,
              letterSpacing: "0.28em",
              color: "var(--color-muted)",
              marginBottom: 18,
            }}
          >
            {CONTACT.name}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 6.5vw, 54px)",
              lineHeight: 1.05,
              fontWeight: 400,
              letterSpacing: "0.01em",
              color: "var(--fg-bright)",
              margin: 0,
            }}
          >
            Low-level{" "}
            <span
              style={{
                color: "var(--color-cyan)",
                textShadow: "0 0 20px rgba(0,229,255,0.45)",
              }}
            >
              Rust
            </span>
            . Full-stack web.
          </h1>
          <p
            style={{
              fontSize: "clamp(13px, 2.4vw, 16px)",
              lineHeight: 1.65,
              color: "var(--fg)",
              maxWidth: 580,
              margin: "18px 0 0",
            }}
          >
            {POSITIONING.subhead}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 12,
              letterSpacing: "0.06em",
              color: "var(--color-muted)",
            }}
          >
            <span style={{ color: "var(--ui-signal-ok)", fontSize: 10 }}>
              ●
            </span>
            {POSITIONING.status}
          </div>

          {/* CTA row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <a
              className="lobby-cta"
              href={MAILTO}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 15,
                letterSpacing: "0.06em",
                color: "var(--color-cyan)",
                padding: "13px 24px",
                borderRadius: 6,
                background: "rgba(0,229,255,0.07)",
                border: `1px solid rgba(0,229,255,0.4)`,
                boxShadow: "0 0 16px rgba(0,229,255,0.08)",
              }}
            >
              {"Let's talk →"}
            </a>
            {CONTACT.scheduler && (
              <a
                className="lobby-ghost"
                href={CONTACT.scheduler}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  color: "var(--color-muted)",
                  padding: "12px 18px",
                  borderRadius: 6,
                  border: "1px solid var(--hairline)",
                }}
              >
                Book a call
              </a>
            )}
            <a
              className="lobby-ghost"
              href="/resume.html"
              style={{
                fontSize: 13,
                letterSpacing: "0.04em",
                color: "var(--color-muted)",
                padding: "12px 18px",
                borderRadius: 6,
                border: "1px solid var(--hairline)",
              }}
            >
              Résumé
            </a>
          </div>
        </section>

        {/* Proof */}
        <section>
          <SectionLabel>PROOF</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px 24px",
            }}
          >
            {PROOF.map((item) => (
              <div
                key={item.text}
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <span
                  style={{
                    color: "var(--color-muted)",
                    fontSize: 15,
                    lineHeight: 1.5,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{ fontSize: 14, lineHeight: 1.5, color: "var(--fg)" }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        <ProductPreview liveUrl={scryLive} />

        {/* What I take on */}
        <section>
          <SectionLabel>WHAT I TAKE ON</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              <span style={{ color: "var(--color-cyan)", fontWeight: 600 }}>
                Hard systems —{" "}
              </span>
              <span style={{ color: "var(--fg)" }}>{TAKE_ON.hard}</span>
            </p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              <span style={{ color: "var(--color-amber)", fontWeight: 600 }}>
                Everyday delivery —{" "}
              </span>
              <span style={{ color: "var(--fg)" }}>{TAKE_ON.everyday}</span>
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--color-muted)",
                fontStyle: "italic",
              }}
            >
              {TAKE_ON.note}
            </p>
          </div>
        </section>

        {/* Selected work */}
        <section>
          <SectionLabel>SELECTED WORK</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {flagships.map((p) => {
              // Mute each project's neon identity toward the warm patina so the three
              // cards harmonize instead of clashing (magenta / acid-green / cyan).
              const accent = `color-mix(in srgb, ${p.color} 55%, var(--color-muted))`;
              const href = p.live || p.github;
              const cta = p.live ? "Try it live →" : "View source →";
              return (
                <a
                  key={p.id}
                  className="lobby-card"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: 18,
                    borderRadius: 8,
                    background: `${p.color}08`,
                    border: `1px solid ${p.color}26`,
                    borderTop: `2px solid ${accent}`,
                    boxShadow: `0 0 0 rgba(0,0,0,0)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 30px ${p.color}22`;
                    e.currentTarget.style.borderColor = `${p.color}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
                    e.currentTarget.style.borderColor = `${p.color}26`;
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ color: accent, fontSize: 18 }}>
                      {p.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 16,
                        color: accent,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {p.title}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-arcade)",
                      letterSpacing: "0.12em",
                      color: "var(--color-muted)",
                    }}
                  >
                    {p.subtitle}
                  </div>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "var(--fg)",
                    }}
                  >
                    {p.outcome}
                  </p>
                  <span
                    style={{
                      marginTop: "auto",
                      paddingTop: 8,
                      fontSize: 12,
                      color: accent,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {cta}
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {/* Enter the cabinet */}
        <button
          type="button"
          className="lobby-explore"
          onClick={onEnter}
          style={{
            appearance: "none",
            width: "100%",
            padding: "20px",
            borderRadius: 10,
            border: "1px solid rgba(0,229,255,0.22)",
            background: "rgba(0,229,255,0.02)",
            color: "var(--color-cyan)",
            fontFamily: "var(--font-display)",
            fontSize: 15,
            letterSpacing: "0.18em",
            textAlign: "center",
          }}
        >
          ▸ EXPLORE THE FULL ARCADE
          <span
            style={{
              display: "block",
              marginTop: 8,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--color-muted)",
            }}
          >
            boot sequence · {PROJECTS.length} programs · hidden games
          </span>
        </button>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 11,
            letterSpacing: "0.06em",
            color: "var(--color-comment)",
            borderTop: "1px solid var(--hairline-faint)",
            paddingTop: 18,
          }}
        >
          <span>{CONTACT.location}</span>
          <a className="lobby-link" href={`mailto:${CONTACT.email}`}>
            {CONTACT.email}
          </a>
        </footer>
      </div>
    </div>
  );
}
