import { useEffect, useState } from "react";
import TestPattern from "../TestPattern";
import { MARQUEE_TEXT } from "../../constants";

// What the tube shows while the cabinet stands on the floor: the loop a real
// machine runs when nobody is playing. Three kinds of frame — the test
// pattern, PRESS START, and one cartridge at a time — then round again. It
// captures no keys and makes no sound; the overlay button on the stage is the
// only control. The loop pauses when the tab is hidden, and the parent pauses
// the CSS animations when the cabinet scrolls out of view.

const TEST_PATTERN_MS = 2200;
const PRESS_START_MS = 3200;
const CARTRIDGE_MS = 2600;

// Frame 0: test pattern. Frame 1: PRESS START. Frames 2..n+1: cartridge n-2.
export function frameDuration(frame) {
  if (frame === 0) return TEST_PATTERN_MS;
  if (frame === 1) return PRESS_START_MS;
  return CARTRIDGE_MS;
}

export function nextFrame(frame, cartridgeCount) {
  return (frame + 1) % (2 + cartridgeCount);
}

export default function AttractScreen({ projects, fs, reducedMotion = false }) {
  // Reduced motion holds on PRESS START; nothing cycles or blinks.
  const [frame, setFrame] = useState(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    let timer = null;
    const schedule = (current) => {
      timer = setTimeout(() => {
        const next = nextFrame(current, projects.length);
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
    // The chain reschedules itself from the frame it was started on; restarting
    // it on every frame change would double the timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, projects.length]);

  const cartridge = frame >= 2 ? projects[frame - 2] : null;

  return (
    <div
      data-testid="attract-screen"
      data-frame={frame}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {frame === 0 && <TestPattern fs={fs} hint="" animate={false} />}
        {frame === 1 && (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: fs(22),
                color: "var(--color-amber)",
                letterSpacing: "0.12em",
                textShadow: "0 0 14px rgba(216,166,87,0.45)",
                animation: reducedMotion
                  ? undefined
                  : "blink 1.1s step-end infinite",
                textAlign: "center",
              }}
            >
              PRESS START
            </div>
            <div
              style={{
                fontSize: fs(10),
                color: "var(--color-muted)",
                letterSpacing: "0.2em",
              }}
            >
              1 PLAYER · ALL CARTRIDGES LOADED
            </div>
          </div>
        )}
        {cartridge && (
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
            <div
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: fs(8),
                color: "rgba(0,229,255,0.45)",
                letterSpacing: "0.3em",
              }}
            >
              NOW SHOWING
            </div>
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
            <div
              style={{
                fontSize: fs(12),
                color: "var(--fg)",
                letterSpacing: "0.12em",
              }}
            >
              {cartridge.tagline || cartridge.subtitle}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 10,
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
          style={{
            fontSize: fs(8),
            color: "var(--color-comment)",
            letterSpacing: "0.1em",
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
