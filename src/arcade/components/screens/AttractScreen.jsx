import { useEffect, useState } from "react";
import { CONTACT } from "../../../data/profile";
import { QUOTES } from "../../../data/quotes";
import { summary } from "../../../data/receiptsSummary";
import { int } from "../../../lib/format";
import { PALETTE, alpha } from "../../palette";
import { pixel } from "../../type";

// The loop a real machine runs when nobody is playing, and this site's front
// door: the title card, a few cartridges, the high score table, the splash
// every cabinet of the period ran, then round again. Any input starts the machine; the d-pad steps the loop. It captures
// no keys itself; the cabinet's state machine does, so the loop and the panel
// cannot disagree.

const TITLE_MS = 6000;
const CARTRIDGE_MS = 2600;
const SCORES_MS = 6000;
const WINNERS_MS = 2500;
// How many cartridges one pass of the loop shows; the next pass shows the
// next few, so every cartridge gets its turn on the marquee.
export const FEATURED = 4;

export const FRAMES = ["title", "show", "show", "show", "show", "scores", "winners"];

export function frameDuration(frame) {
  const kind = FRAMES[frame];
  if (kind === "title") return TITLE_MS;
  if (kind === "scores") return SCORES_MS;
  if (kind === "winners") return WINNERS_MS;
  return CARTRIDGE_MS;
}

export function nextFrame(frame) {
  return (frame + 1) % FRAMES.length;
}

const label = (fs, color = "var(--cab-muted)") => ({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: pixel(fs(8)),
  color,
  letterSpacing: "var(--track-pixel)",
});

function TitleCard({ fs, hidden, nameSize, returning }) {
  // The identity stays in the document on every frame, so the page always
  // has its heading; it is only shown on the title card, and it glitches in
  // each time the card comes up, like the other frames.
  return (
    <div
      className={hidden ? "visually-hidden" : "dash-in"}
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
      {/* The name on the band, flat: the band is its light. */}
      <div className="title-band">
        <h1
          style={{
            margin: 0,
            fontFamily: "'Press Start 2P', monospace",
            fontWeight: 400,
            fontSize: nameSize,
            lineHeight: 1.5,
            color: "var(--cab-text)",
            letterSpacing: "var(--track-pixel)",
            textShadow: "none",
          }}
        >
          {CONTACT.name}
        </h1>
      </div>
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: fs(15),
          color: "var(--cab-ember)",
          letterSpacing: "0.24em",
        }}
      >
        {CONTACT.role}
      </div>
      {/* The machine speaks: a question for a first visitor, a nod to one
          who has been here before (quotes.js). */}
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--font-sans)",
          fontSize: fs(13),
          fontWeight: 500,
          color: "var(--cab-text)",
          letterSpacing: "var(--track-ui)",
          lineHeight: 1.9,
        }}
      >
        {returning ? QUOTES.titleReturn : QUOTES.titleFirst}
      </div>
    </div>
  );
}

function NowShowing({ cartridge, fs }) {
  return (
    <div
      key={cartridge.id}
      className="dash-in"
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
      {/* The cartridge as a card in its own light, its icon in a tile. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "22px 28px",
          borderRadius: 12,
          border: `1px solid ${alpha(cartridge.color, 0.45)}`,
          background: `linear-gradient(180deg, ${alpha(cartridge.color, 0.1)}, ${alpha(cartridge.color, 0.03)})`,
          boxShadow: `0 0 28px ${alpha(cartridge.color, 0.16)}`,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: fs(34),
            lineHeight: 1,
            color: cartridge.color,
            borderRadius: 10,
            background: alpha(cartridge.color, 0.14),
            border: `1px solid ${alpha(cartridge.color, 0.5)}`,
          }}
        >
          {cartridge.icon}
        </div>
        <div
          className="signage"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: fs(28),
            color: cartridge.color,
            letterSpacing: "var(--track-display)",
          }}
        >
          {cartridge.title}
        </div>
        <div style={{ fontSize: fs(12), color: "var(--cab-text)", letterSpacing: "var(--track-ui)" }}>
          {cartridge.tagline || cartridge.subtitle}
        </div>
      </div>
    </div>
  );
}

// The splash that ran between every game's attract frames for a decade,
// set the way the machine sets everything else.
function Winners({ fs }) {
  return (
    <div
      className="dash-in"
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
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: pixel(fs(14)),
          lineHeight: 1.7,
          color: "var(--cab-text)",
          letterSpacing: "var(--track-pixel)",
        }}
      >
        {QUOTES.winners}
      </div>
      <div style={{ ...label(fs, "var(--cab-muted)"), letterSpacing: "0.2em" }}>
        {QUOTES.winnersBy}
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
      className="dash-in"
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
      <div className="signage" style={label(fs, "var(--cab-voice)")}>
        HIGH SCORES
      </div>
      <div className="sunset" aria-hidden="true" style={{ width: "min(280px, 80%)" }} />
      <div style={{ fontSize: fs(9), color: "var(--cab-muted)", letterSpacing: "var(--track-ui)" }}>
        {int(summary.totals.commits)} COMMITS · {summary.totals.repos} REPOSITORIES
      </div>
      <table
        style={{
          borderCollapse: "collapse",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: fs(13),
          letterSpacing: "var(--track-ui)",
          marginTop: 6,
        }}
      >
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.repo}
              style={{
                color: i === 0 ? "var(--cab-voice)" : "var(--cab-text)",
                background: i % 2 === 0 ? alpha(PALETTE.lit, 0.12) : "transparent",
              }}
            >
              <td style={{ padding: "4px 10px 4px 8px", color: "var(--cab-muted)" }}>
                {String(i + 1).padStart(2, "0")}
              </td>
              <td style={{ padding: "4px 18px 4px 0", textTransform: "uppercase" }}>{r.repo}</td>
              <td style={{ padding: "4px 8px 4px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {int(r.commits)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: fs(8), color: "var(--cab-faint)", letterSpacing: "var(--track-ui)", marginTop: 4 }}>
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
  // Whether this browser has seen the machine before (decided at mount, so a
  // first visit keeps its line after the boot marks the visit).
  returning = false,
}) {
  // The name fills the tube the way a title does: one line on a desktop tube,
  // two on a phone, never smaller than the rest of the card.
  const nameSize = pixel(Math.min(38, Math.max(fs(20), screenWidth / 16)));
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
        <TitleCard
          fs={fs}
          hidden={kind !== "title"}
          nameSize={nameSize}
          returning={returning}
        />
        {cartridge && <NowShowing cartridge={cartridge} fs={fs} />}
        {kind === "scores" && <HighScores fs={fs} />}
        {kind === "winners" && <Winners fs={fs} />}
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
          className="attract-start signage"
          onClick={() => onStart?.()}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: pixel(fs(14)),
            color: "var(--cab-voice)",
            letterSpacing: "var(--track-pixel)",
            animation: reducedMotion ? undefined : "breathe 2.4s ease-in-out infinite",
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
