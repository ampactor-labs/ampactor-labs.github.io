import { useEffect, useState } from "react";
import { MARQUEE_TEXT } from "../../constants";
import { CONTACT, MAILTO } from "../../../data/profile";
import { summary } from "../../../data/receiptsSummary";
import { int } from "../../../lib/format";

// The loop a real machine runs when nobody is playing, and this site's front
// door: the operator's title card, HOW TO PLAY, a few cartridges, the high
// score table, then round again. Any input starts the machine; the d-pad
// steps the loop. It captures no keys itself; the cabinet's state machine
// does, so the loop and the panel cannot disagree.

const TITLE_MS = 7000;
const HOWTO_MS = 7000;
const CARTRIDGE_MS = 2600;
const SCORES_MS = 6000;
// How many cartridges one pass of the loop shows; the next pass shows the
// next few, so every cartridge gets its turn on the marquee.
export const FEATURED = 4;

export const FRAMES = ["title", "howto", "show", "show", "show", "show", "scores"];

export function frameDuration(frame) {
  const kind = FRAMES[frame];
  if (kind === "title") return TITLE_MS;
  if (kind === "howto") return HOWTO_MS;
  if (kind === "scores") return SCORES_MS;
  return CARTRIDGE_MS;
}

export function nextFrame(frame) {
  return (frame + 1) % FRAMES.length;
}

// The three habits, in the length a passing eye reads.
export const HOW_TO_PLAY = [
  {
    glyph: "▸",
    title: "END TO END",
    line: "Design to deployment, alone: interface, backend, tests, CI, docs.",
  },
  {
    glyph: "◈",
    title: "DOCUMENTED LIMITS",
    line: "Every README says what does not work yet. Benchmarks include the losses.",
  },
  {
    glyph: "∿",
    title: "WORKING WITH AI",
    line: "Claude Code daily, every diff reviewed by me. The commit log shows which.",
  },
];

const label = (fs, color = "rgba(0,229,255,0.45)") => ({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: fs(8),
  color,
  letterSpacing: "0.3em",
});

function TitleCard({ fs, hidden, nameSize }) {
  // The identity stays in the document on every frame, so the page always
  // has its heading; it is only shown on the title card.
  return (
    <div
      className={hidden ? "visually-hidden" : undefined}
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
      <div style={label(fs)}>OPERATOR</div>
      <h1
        style={{
          margin: "4px 0 0",
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
      <div
        aria-hidden="true"
        style={{
          width: 120,
          height: 1,
          margin: "6px 0",
          background:
            "linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent)",
        }}
      />
      <div
        style={{
          fontSize: fs(9),
          color: "var(--color-muted)",
          letterSpacing: "0.14em",
          lineHeight: 2,
        }}
      >
        WEB APPS · APIS · COMPILERS · AUDIO · GAMES
        <br />
        FULL-STACK SINCE 2017 · SALT LAKE CITY
      </div>
      <div
        style={{
          fontSize: fs(9),
          color: "var(--color-verdigris)",
          letterSpacing: "0.14em",
          lineHeight: 1.9,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            marginRight: 8,
            verticalAlign: "middle",
            borderRadius: "50%",
            background: "var(--color-verdigris)",
            boxShadow: "0 0 8px var(--color-verdigris)",
          }}
        />
        AVAILABLE · FULL-TIME OR CONTRACT · REMOTE OK
      </div>
      <a
        href={MAILTO}
        style={{
          fontSize: fs(11),
          color: "var(--fg)",
          letterSpacing: "0.08em",
          textDecoration: "none",
          borderBottom: "1px solid rgba(212,190,152,0.35)",
          paddingBottom: 2,
        }}
      >
        {CONTACT.email}
      </a>
    </div>
  );
}

function HowToPlayCard({ fs }) {
  return (
    <div
      className="glitch-enter"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 16,
        padding: "0 8px",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div style={{ ...label(fs), textAlign: "center", marginBottom: 6 }}>
        HOW TO PLAY
      </div>
      {HOW_TO_PLAY.map((m) => (
        <div
          key={m.title}
          style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
        >
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(15),
              color: "var(--color-amber)",
              border: "1px solid rgba(216,166,87,0.35)",
              borderRadius: 5,
              background: "rgba(216,166,87,0.07)",
            }}
          >
            {m.glyph}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: fs(8),
                color: "var(--color-amber)",
                letterSpacing: "0.12em",
                marginBottom: 6,
              }}
            >
              {m.title}
            </div>
            <div
              style={{
                fontSize: fs(11),
                color: "var(--fg)",
                lineHeight: 1.55,
                letterSpacing: "0.03em",
              }}
            >
              {m.line}
            </div>
          </div>
        </div>
      ))}
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

  useEffect(() => {
    if (reducedMotion) return;
    let timer = null;
    const schedule = (current) => {
      timer = setTimeout(() => {
        const next = nextFrame(current);
        if (next === 0) setOffset((o) => (o + FEATURED) % Math.max(1, projects.length));
        setFrame(next);
        schedule(next);
      }, frameDuration(current));
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        timer = null;
      } else if (timer === null) {
        schedule(frame);
      }
    };
    if (!document.hidden) schedule(frame);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // The chain reschedules itself from the frame it was started on; a nudge
    // restarts it from the new frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, projects.length, nudge.n]);

  // The d-pad steps the loop, either way round.
  useEffect(() => {
    if (nudge.n === 0) return;
    setFrame((f) => (f + nudge.dir + FRAMES.length) % FRAMES.length);
  }, [nudge]);

  const kind = FRAMES[frame];
  const cartridge =
    kind === "show" && projects.length
      ? projects[(offset + (frame - FRAMES.indexOf("show"))) % projects.length]
      : null;

  // A press anywhere on the tube starts the machine; a link keeps its click.
  const onTubeClick = (e) => {
    if (e.target instanceof HTMLElement && e.target.closest("a")) return;
    onStart?.();
  };

  return (
    <div
      data-testid="attract-screen"
      data-frame={kind}
      style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}
    >
      <div
        style={{ flex: 1, minHeight: 0, position: "relative", cursor: "pointer" }}
        onClick={onTubeClick}
      >
        <TitleCard fs={fs} hidden={kind !== "title"} nameSize={nameSize} />
        {kind === "howto" && <HowToPlayCard fs={fs} />}
        {cartridge && <NowShowing cartridge={cartridge} fs={fs} />}
        {kind === "scores" && <HighScores fs={fs} />}
      </div>
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: "12px 0 6px",
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
        <div
          style={{
            fontSize: fs(8),
            color: "var(--color-muted)",
            letterSpacing: "0.2em",
            textAlign: "center",
            lineHeight: 2,
          }}
        >
          1 PLAYER · {projects.length} CARTRIDGES LOADED
          <br />
          <span style={{ color: "var(--color-comment)" }}>
            © 2018–{new Date().getFullYear()} AMPACTOR LABS · SALT LAKE CITY
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: 6,
          paddingTop: 8,
          borderTop: "1px solid rgba(0,229,255,0.06)",
          overflow: "hidden",
          height: 24,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          className="marquee-track"
          style={{ fontSize: fs(8), color: "var(--color-comment)", letterSpacing: "0.1em" }}
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
