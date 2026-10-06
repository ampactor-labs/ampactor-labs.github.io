import { useEffect, useRef } from "react";
import { summary } from "../../../data/receiptsSummary";
import { audit } from "../../../data/audit";
import resume from "../../../data/resume.json";
import { WORDS } from "../../../data/profile";
import { QUOTES } from "../../../data/quotes";
import { int, monthLabel } from "../../../lib/format";
import { PALETTE, alpha } from "../../palette";
import Sign from "../Sign";
import { pixel } from "../../type";

// The operator's programs: HOW TO PLAY, HIGH SCORES and CREDITS. Same frame
// as a cartridge (back, title, the link rail the A button walks, a scrolling
// body the d-pad pans), different bodies.

// What the panel does, which is what HOW TO PLAY means on a cabinet.
const CONTROLS = [
  { keys: "\u25b2 \u25bc", does: "WALK THE LIST · SCROLL A READOUT" },
  { keys: "\u25c4 \u25ba", does: "WALK A READOUT'S LINKS · STEP THE TITLE LOOP" },
  { keys: "A", does: "OPEN" },
  { keys: "B", does: "BACK" },
  { keys: "ARROWS · ENTER · ESC", does: "THE SAME, ON A KEYBOARD" },
];

function HowToPlay({ color, fs }) {
  return (
    <>
      <p
        style={{
          margin: "0 0 16px",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: pixel(fs(9)),
          lineHeight: 1.8,
          color,
          letterSpacing: "var(--track-pixel)",
        }}
      >
        {QUOTES.howto}
      </p>
      <Sign text="CONTROLS" fs={fs} />
      <table
        style={{
          borderCollapse: "collapse",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: fs(12),
          letterSpacing: "var(--track-ui)",
        }}
      >
        <tbody>
          {CONTROLS.map((c) => (
            <tr key={c.keys}>
              <th
                scope="row"
                style={{
                  textAlign: "left",
                  fontWeight: 400,
                  color,
                  padding: "7px 18px 7px 0",
                  whiteSpace: "nowrap",
                  verticalAlign: "top",
                }}
              >
                {c.keys}
              </th>
              <td style={{ padding: "7px 0", color: "var(--cab-text)", lineHeight: 1.5 }}>{c.does}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function scoreTable(n = 10) {
  return [...summary.byRepo].sort((a, b) => b.commits - a.commits).slice(0, n);
}

function HighScores({ color, fs }) {
  const rows = scoreTable(10);
  const months = summary.months.slice(-12);
  const max = months.reduce((m, r) => Math.max(m, r.commits), 1);
  const since = summary.totals.first ? monthLabel(summary.totals.first.slice(0, 7), "long") : null;
  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 18px",
          fontSize: fs(9),
          color: "var(--cab-muted)",
          letterSpacing: "var(--track-ui)",
          marginBottom: 14,
        }}
      >
        <span style={{ color }}>{int(summary.totals.commits)} COMMITS</span>
        <span>{summary.totals.repos} PUBLIC REPOSITORIES</span>
        {since && <span>SINCE {since.toUpperCase()}</span>}
        <span>READ FROM GIT AT BUILD</span>
      </div>
      <Sign text="TOP TEN" fs={fs} />
      <table
        style={{
          width: "100%",
          maxWidth: 460,
          borderCollapse: "collapse",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: fs(13),
          letterSpacing: "var(--track-ui)",
        }}
      >
        <thead>
          <tr style={{ fontSize: fs(8), color: "var(--cab-faint)", letterSpacing: "0.2em" }}>
            <th scope="col" style={{ textAlign: "left", fontWeight: 400, padding: "0 0 6px" }}>RANK</th>
            <th scope="col" style={{ textAlign: "left", fontWeight: 400, padding: "0 0 6px" }}>NAME</th>
            <th scope="col" style={{ textAlign: "right", fontWeight: 400, padding: "0 0 6px" }}>SCORE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.repo} style={{ color: i === 0 ? color : "var(--cab-text)" }}>
              <td style={{ padding: "4px 12px 4px 0", color: "var(--cab-muted)", width: "3ch" }}>
                {String(i + 1).padStart(2, "0")}
              </td>
              <td style={{ padding: "4px 12px 4px 0", textTransform: "uppercase" }}>{r.repo}</td>
              <td style={{ padding: "4px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {int(r.commits)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 20 }}>
        <Sign text="LAST TWELVE MONTHS" fs={fs} />
        <div
          role="img"
          aria-label={`Commits per month: ${months.map((m) => `${monthLabel(m.month, "short")} ${m.commits}`).join(", ")}`}
          style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 64, maxWidth: 460 }}
        >
          {months.map((m) => (
            <div
              key={m.month}
              title={`${monthLabel(m.month, "long")}: ${int(m.commits)}`}
              style={{
                flex: 1,
                height: `${Math.max(3, (m.commits / max) * 100)}%`,
                background: `${color}${m.commits === max ? "ff" : "66"}`,
                borderRadius: "2px 2px 0 0",
                boxShadow: m.commits === max ? `0 0 10px ${color}66` : "none",
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: "var(--font-body)", display: "flex", justifyContent: "space-between", maxWidth: 460, fontSize: fs(8), color: "var(--cab-faint)", letterSpacing: "var(--track-ui)", marginTop: 6 }}>
          <span>{months[0] ? monthLabel(months[0].month, "short").toUpperCase() : ""}</span>
          <span>{months.at(-1) ? monthLabel(months.at(-1).month, "short").toUpperCase() : ""}</span>
        </div>
      </div>
      <p style={{ margin: "18px 0 0", fontSize: fs(10), color: "var(--cab-muted)", lineHeight: 1.6, letterSpacing: "var(--track-display)" }}>
        CO-OP MODE: {int(summary.totals.withClaude)} of these commits list Claude as
        author or co-author.
      </p>
    </>
  );
}

// The years as an end-credits roll: newest role first, as a résumé reads,
// then the life before software, then this cabinet, then the operator's
// sign-off.
export function creditLines() {
  const years = (r) => `${r.start}–${r.end ?? "NOW"}`;
  const roles = resume.experience.map((r) => ({
    kind: "role",
    head: r.org.toUpperCase(),
    sub: `${r.role.toUpperCase()} · ${years(r)}${r.note ? ` · ${r.note.toUpperCase()}` : ""}`,
  }));
  return [
    { kind: "title", head: resume.name.toUpperCase(), sub: resume.title.toUpperCase() },
    { kind: "section", head: "THE YEARS" },
    ...roles,
    { kind: "section", head: "BEFORE SOFTWARE" },
    { kind: "line", head: resume.before },
    { kind: "section", head: "THIS CABINET" },
    { kind: "line", head: "REACT 19 · TYPESCRIPT · VITE · GSAP · CANVAS 2D · WEB AUDIO" },
    {
      kind: "line",
      head: `${int(audit.tests.unit)} UNIT TESTS · ${int(audit.tests.browserRuns)} BROWSER TEST RUNS · NO THIRD-PARTY REQUESTS`,
    },
    { kind: "end", head: WORDS.credits },
  ];
}

// Pixels per second the roll climbs; a hand on it pauses it.
const ROLL_SPEED = 26;
const PAUSE_MS = 3500;

function Credits({ color, fs, bodyRef, reducedMotion }) {
  const lines = creditLines();
  const pausedUntil = useRef(0);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || reducedMotion) return;
    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now) => {
      const dt = now - last;
      last = now;
      if (now > pausedUntil.current) {
        carry += (dt / 1000) * ROLL_SPEED;
        const step = Math.floor(carry);
        if (step > 0) {
          carry -= step;
          const max = el.scrollHeight - el.clientHeight;
          if (el.scrollTop < max) el.scrollTop = Math.min(max, el.scrollTop + step);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      pausedUntil.current = performance.now() + PAUSE_MS;
    };
    for (const ev of ["pointerdown", "wheel", "touchstart", "focusin"])
      el.addEventListener(ev, pause, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      for (const ev of ["pointerdown", "wheel", "touchstart", "focusin"])
        el.removeEventListener(ev, pause);
    };
  }, [bodyRef, reducedMotion]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 10,
        // The roll starts from below the tube and ends with the last line
        // resting in the middle of it.
        padding: reducedMotion ? "8px 0 24px" : "60% 0 45%",
      }}
    >
      {lines.map((l, i) => {
        if (l.kind === "section")
          return (
            <div key={i} style={{ ...{ fontFamily: "'Press Start 2P', monospace", fontSize: pixel(fs(7)), color: `${color}99`, letterSpacing: "var(--track-pixel)" }, margin: "26px 0 6px" }}>
              {l.head}
            </div>
          );
        if (l.kind === "title")
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div className="signage" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: pixel(fs(14)), color: PALETTE.mark, letterSpacing: "var(--track-pixel)" }}>
                {l.head}
              </div>
              <div style={{ marginTop: 8, fontSize: fs(10), color: "var(--cab-voice)", letterSpacing: "0.22em" }}>{l.sub}</div>
            </div>
          );
        if (l.kind === "end")
          return (
            <div key={i} className="signage" style={{ marginTop: 30, fontFamily: "'Press Start 2P', monospace", fontSize: pixel(fs(12)), color, letterSpacing: "var(--track-pixel)" }}>
              {l.head}
            </div>
          );
        return (
          <div key={i} style={{ maxWidth: 460 }}>
            <div style={{ fontFamily: l.kind === "role" ? "'Share Tech Mono', monospace" : undefined, fontSize: l.kind === "role" ? fs(15) : fs(11), color: "var(--cab-text)", letterSpacing: l.kind === "role" ? "0.1em" : "0.04em", lineHeight: 1.6 }}>
              {l.head}
            </div>
            {l.sub && (
              <div style={{ marginTop: 3, fontSize: fs(9), color: "var(--cab-muted)", letterSpacing: "var(--track-ui)", lineHeight: 1.6 }}>{l.sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SystemScreen({
  program: p,
  onBack,
  fs,
  bodyRef,
  linkRefs,
  focusedLink = 0,
  reducedMotion = false,
}) {
  const localBody = useRef(null);
  const localLinks = useRef([]);
  const body = bodyRef ?? localBody;
  const links = linkRefs ?? localLinks;
  const rail = p.links ?? [];
  const color = p.color;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }} className="dash-in">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `1px solid ${color}33`,
          flexWrap: "wrap",
        }}
      >
        <div
          className="btn-cabinet"
          role="button"
          aria-label="Back to program list"
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
            color: "var(--cab-text)",
            padding: "3px 7px",
            borderRadius: 4,
            background: alpha(PALETTE.white, 0.03),
            border: `1px solid ${alpha(PALETTE.white, 0.06)}`,
          }}
        >
          {"◄"}
        </div>
        <div style={{ fontSize: fs(20), color }}>{p.icon}</div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <h1
            className="signage"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: pixel(fs(12)),
              fontWeight: 400,
              color,
              letterSpacing: "var(--track-pixel)",
              margin: 0,
            }}
          >
            {p.title}
          </h1>
          <div style={{ fontSize: fs(10), color: "var(--cab-text)", letterSpacing: "var(--track-ui)", marginTop: 3 }}>
            {p.subtitle}
          </div>
        </div>
        {rail.length > 0 && (
          <div className="readout-rail" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0, flexWrap: "wrap" }}>
            {rail.map((link, i) => {
              const primary = link.kind === "live";
              const focused = i === focusedLink;
              const external = /^https?:/.test(link.href);
              return (
                <a
                  className="chip"
                  key={link.href}
                  ref={(el) => {
                    links.current[i] = el;
                  }}
                  href={link.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  aria-current={focused ? "true" : undefined}
                  style={{
                    fontSize: fs(9),
                    letterSpacing: "var(--track-ui)",
                    textDecoration: "none",
                    padding: "5px 10px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    fontWeight: primary ? 700 : 600,
                    color: primary ? "var(--cab-void)" : color,
                    background: primary ? color : `${color}11`,
                    border: primary ? "1px solid transparent" : `1px solid ${color}55`,
                    boxShadow: focused
                      ? `0 0 0 2px var(--cab-void), 0 0 0 4px ${color}, 0 0 18px ${color}99`
                      : primary
                        ? `0 0 14px ${color}66`
                        : "none",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        )}
      </div>
      <div
        ref={body}
        style={{ flex: 1, overflow: "auto", position: "relative", padding: "0 2px" }}
        tabIndex={0}
        role="region"
        aria-label={p.title}
      >
        {p.kind === "howto" && <HowToPlay color={color} fs={fs} />}
        {p.kind === "scores" && <HighScores color={color} fs={fs} />}
        {p.kind === "credits" && (
          <Credits color={color} fs={fs} bodyRef={body} reducedMotion={reducedMotion} />
        )}
      </div>
    </div>
  );
}
