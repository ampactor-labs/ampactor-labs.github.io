import { useCallback, useEffect, useState } from "react";
import {
  hasBus,
  noise,
  setSound,
  soundOn,
  startBed,
  stopBed,
  suspendBus,
  voice,
  withClock,
} from "./audio/bus";

// A cartridge's colour keys its sweep: the hue sets where the filter lands.
function keyOf(color) {
  const m = /^#?([0-9a-f]{6})$/i.exec(color || "");
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0.5;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h /= 6;
  return h < 0 ? h + 1 : h;
}

// The cabinet's sounds, on the shared bus (audio/bus.js). No context exists
// until the visitor's first gesture, which wakes the clock and brings the room
// up. While `enabled` is false nothing sounds, and turning it off fades the
// room out.
export default function useAmbientHum({ enabled = true } = {}) {
  const [sound, setSoundState] = useState(soundOn);

  // A step through the list: a soft tick, not a buzz.
  const playBlip = useCallback(
    () =>
      withClock((b, t0) =>
        voice(b, t0, { freq: 1175, type: "triangle", dur: 0.03, peak: 0.018 }),
      ),
    [],
  );

  // Into a cartridge: a filter opening upward, keyed by its colour. Rounded:
  // a low resonance that colours without whistling.
  const playEnter = useCallback(
    (color) =>
      withClock((b, t0) => {
        const k = keyOf(color);
        voice(b, t0, {
          freq: 110 * (1 + k),
          type: "sawtooth",
          dur: 0.2,
          peak: 0.035,
          cutoff: 280,
          cutoffTo: 1400 + k * 1200,
          q: 2.5,
          send: 0.2,
        });
        voice(b, t0, {
          freq: 220 * (1 + k),
          type: "triangle",
          at: 0.015,
          dur: 0.12,
          peak: 0.02,
        });
      }),
    [],
  );

  // Out again: the same sweep, falling.
  const playBack = useCallback(
    () =>
      withClock((b, t0) =>
        voice(b, t0, {
          freq: 165,
          type: "sawtooth",
          dur: 0.18,
          peak: 0.03,
          cutoff: 1600,
          cutoffTo: 300,
          q: 2.5,
          send: 0.12,
        }),
      ),
    [],
  );

  // The coin: a clink, then a chord.
  const playInsertSting = useCallback(
    () =>
      withClock((b, t0) => {
        noise(b, t0, { dur: 0.03, peak: 0.03, freq: 4200, q: 2 });
        voice(b, t0, { freq: 2637, type: "sine", dur: 0.12, peak: 0.05 });
        voice(b, t0, { freq: 3951, type: "sine", at: 0.06, dur: 0.16, peak: 0.04, send: 0.3 });
        for (const [freq, peak] of [
          [220, 0.05],
          [277.2, 0.04],
          [329.6, 0.04],
          [440, 0.035],
        ])
          voice(b, t0, {
            freq,
            type: "sawtooth",
            at: 0.22,
            dur: 0.9,
            peak,
            cutoff: 800,
            cutoffTo: 2200,
            q: 1.5,
            send: 0.3,
          });
      }),
    [],
  );

  // SOUND ON / SOUND OFF on the panel, remembered. Off stops the room
  // (bus.js); back on in the arcade, it comes up again.
  const toggleSound = useCallback(() => {
    const next = !soundOn();
    setSound(next);
    setSoundState(next);
    if (next && enabled) startBed();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      // Switched off: the room fades rather than cuts, then the context
      // sleeps. Nothing to do for a visitor who never started.
      if (!hasBus()) return;
      stopBed(1.2);
      const t = setTimeout(suspendBus, 1400);
      return () => clearTimeout(t);
    }
    // The first gesture wakes the clock, so the first sound is instant, and
    // brings the bed up.
    const warm = () => {
      withClock(() => {});
      startBed();
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
      window.removeEventListener("touchstart", warm);
    };
    const opts = { passive: true };
    window.addEventListener("pointerdown", warm, opts);
    window.addEventListener("keydown", warm, opts);
    window.addEventListener("touchstart", warm, opts);
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
      window.removeEventListener("touchstart", warm);
    };
  }, [enabled]);

  // The cabinet leaving the page takes its room with it.
  useEffect(() => () => stopBed(0.2), []);

  return {
    playBlip,
    playEnter,
    playBack,
    playInsertSting,
    sound,
    toggleSound,
  };
}
