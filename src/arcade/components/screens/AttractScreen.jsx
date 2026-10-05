import { useEffect, useState } from "react";
import { CONTACT, WORDS } from "../../../data/profile";
import { summary } from "../../../data/receiptsSummary";
import { int } from "../../../lib/format";

// The loop a real machine runs when nobody is playing, and this site's front
// door: the title card, a few cartridges, the high score table, then round
// again. Any input starts the machine; the d-pad steps the loop. It captures
// no keys itself; the cabinet's state machine does, so the loop and the panel
// cannot disagree.

const TITLE_MS = 6000;
const CARTRIDGE_MS = 2600;
const SCORES_MS = 6000;
// How many cartridges one pass of the loop shows; the next pass shows the
// next few, so every cartridge gets its turn on the marquee.
export const FEATURED = 4;

export const FRAMES = ["title", "show", "show", "show", "show", "scores"];

export function frameDuration(frame) {
  const kind = FRAMES[frame];
  if (kind === "title") return TITLE_MS;
  if (kind === "scores") return SCORES_MS;
  return CARTRIDGE_MS;
}

export function nextFrame(frame) {
  return (frame + 1) % FRAMES.length;
}

const label = (fs, color = "rgba(0,229,255,0.45)") => ({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: fs(8),
  color,
  letterSpacing: "0.3em",
});

function TitleCard({ fs, hidden, nameSize }) {
  // The identity stays in the document on every frame, so the page always
  // has its heading; it is only shown on the title card, and it glitches in
  // each time the card comes up, like the other frames.
  return (
    <div
      className={hidden ? "visually-hidden" : "glitch-enter"}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "0 16px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: "'Press Start 2P', monospace",
          fontWeight: 400,
          fontSize: nameSize,
          lineHeight: 1.5,
          color: "#00E5FF",
          letterSpacing: "0.06em",
          textShadow:
            "0 0 8px rgba(0,229,255,0.55), 0 0 28px rgba(0,229,255,0.22)",
        }}
      >
        {CONTACT.name}
      </h1>
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: fs(15),
          color: "var(--color-amber)",
          letterSpacing: "0.24em",
          textShadow: "0 0 10px rgba(216,166,87,0.35)",
        }}
      >
        {CONTACT.role}
      </div>
      {/* The operator's own lines, as written. */}
      <div
        style={{
          marginTop: 10,
          fontSize: fs(11),
          color: "var(--fg)",
          letterSpacing: "0.08em",
          lineHeight: 1.9,
        }}
      >
        {WORDS.title.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function NowShowing({ cartridge, fs }) {
  return (
    <div
      key={cartridge.id}
      className="glitch-enter"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div style={label(fs)}>NOW SHOWING</div>
      <div
        style={{
          fontSize: fs(44),
          lineHeight: 1,
          color: cartridge.color,
          textShadow: `0 0 18px ${cartridge.color}66`,
        }}
      >
        {cartridge.icon}
      </div>
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: fs(28),
          color: cartridge.color,
          letterSpacing: "0.06em",
          textShadow: `0 0 12px ${cartridge.color}55`,
        }}
      >
        {cartridge.title}
      </div>
      <div style={{ fontSize: fs(12), color: "var(--fg)", letterSpacing: "0.12em" }}>
        {cartridge.tagline || cartridge.subtitle}
      </div>
    </div>
  );
}

export function topScores(n = 5) {
  return [...summary.byRepo].sort((a, b) => b.commits - a.commits).slice(0, n);
}

function HighScores({ fs }) {
  const rows = topScores(5);
  return (
    <div
      className="glitch-enter"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "0 12px",
      }}
    >
      <div style={{ ...label(fs, "var(--color-amber)"), textShadow: "0 0 10px rgba(216,166,87,0.35)" }}>
        HIGH SCORES
      </div>
      <div style={{ fontSize: fs(9), color: "var(--color-muted)", letterSpacing: "0.14em" }}>
        {int(summary.totals.commits)} COMMITS · {summary.totals.repos} REPOSITORIES
      </div>
      <table
        style={{
          borderCollapse: "collapse",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: fs(13),
          letterSpacing: "0.1em",
          marginTop: 6,
        }}
      >
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.repo} style={{ color: i === 0 ? "var(--color-amber)" : "var(--fg)" }}>
              <td style={{ padding: "3px 10px 3px 0", color: "var(--color-muted)" }}>
                {String(i + 1).padStart(2, "0")}
              </td>
              <td style={{ padding: "3px 18px 3px 0", textTransform: "uppercase" }}>{r.repo}</td>
              <td style={{ padding: "3px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {int(r.commits)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: fs(8), color: "var(--color-comment)", letterSpacing: "0.14em", marginTop: 4 }}>
        CO-OP · {int(summary.totals.withClaude)} WITH CLAUDE
      </div>
    </div>
  );
}

export default function AttractScreen({
  projects,
  fs,
  onStart,
  nudge = { n: 0, dir: 1 },
  reducedMotion = false,
  screenWidth = 360,
}) {
  // The name fills the tube the way a title does: one line on a desktop tube,
  // two on a phone, never smaller than the rest of the card.
  const nameSize = Math.round(Math.min(38, Math.max(fs(20), screenWidth / 16)));
  // Reduced motion holds on the title card; nothing cycles or blinks.
  const [frame, setFrame] = useState(0);
  // Which cartridges this pass of the loop shows.
  const [offset, setOffset] = useState(0);
  // Someone reading: a pointer over the tube (a finger on it, on a phone) or
  // focus inside it holds the loop on the frame they are reading, and it
  // carries on, from the top of that frame, when they leave.
  const [pointerIn, setPointerIn] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const held = pointerIn || focusIn;

  // One timer per frame: a nudge, a released hold or a tab coming back all
  // give the frame on screen its full time.
  useEffect(() => {
    if (reducedMotion || held) return;
    let timer = null;
    const arm = () => {
      timer = setTimeout(() => {
        const next = nextFrame(frame);
        if (next === 0) setOffset((o) => (o + FEATURED) % Math.max(1, projects.length));
        setFrame(next);
      }, frameDuration(frame));
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        timer = null;
      } else if (timer === null) {
        arm();
      }
    };
    if (!document.hidden) arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, held, frame, projects.length]);

  // The d-pad steps the loop, either way round. The cabinet counts presses;
  // each new one steps once, as the loop renders, and the count the loop
  // mounts with (presses from an earlier visit to the title card) is not one.
  const [seenNudge, setSeenNudge] = useState(nudge.n);
  if (nudge.n !== seenNudge) {
    setSeenNudge(nudge.n);
    setFrame((f) => (f + nudge.dir + FRAMES.length) % FRAMES.length);
  }

  const kind = FRAMES[frame];
  const cartridge =
    kind === "show" && projects.length
      ? projects[(offset + (frame - FRAMES.indexOf("show"))) % projects.length]
      : null;

  return (
    <div
      data-testid="attract-screen"
      data-frame={kind}
      onPointerEnter={() => setPointerIn(true)}
      onPointerLeave={() => setPointerIn(false)}
      onFocus={() => setFocusIn(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusIn(false);
      }}
      style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}
    >
      {/* A press anywhere on the tube starts the machine. */}
      <div
        style={{ flex: 1, minHeight: 0, position: "relative", cursor: "pointer" }}
        onClick={() => onStart?.()}
      >
        <TitleCard fs={fs} hidden={kind !== "title"} nameSize={nameSize} />
        {cartridge && <NowShowing cartridge={cartridge} fs={fs} />}
        {kind === "scores" && <HighScores fs={fs} />}
      </div>
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          padding: "12px 0 14px",
        }}
      >
        <button
          type="button"
          className="attract-start"
          onClick={() => onStart?.()}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: fs(14),
            color: "var(--color-amber)",
            letterSpacing: "0.14em",
            textShadow: "0 0 14px rgba(216,166,87,0.45)",
            animation: reducedMotion ? undefined : "startBlink 1.1s step-end infinite",
            background: "transparent",
            border: 0,
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          PRESS START
        </button>
      </div>
    </div>
  );
}
