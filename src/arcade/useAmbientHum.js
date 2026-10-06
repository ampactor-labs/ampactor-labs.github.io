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

// The cabinet's sounds, on the shared bus (audio/bus.js). Silent until the
// machine is started: `enabled` is false on the title card, where no context
// exists until START asks for one, and going back there fades the room out.
export default function useAmbientHum({ enabled = true } = {}) {
  const [sound, setSoundState] = useState(soundOn);

  const playBlip = useCallback(
    () =>
      withClock((b, t0) =>
        voice(b, t0, { freq: 960, type: "square", dur: 0.022, peak: 0.012 }),
      ),
    [],
  );

  // Into a cartridge: a resonant filter sweeping up, keyed by its colour.
  const playEnter = useCallback(
    (color) =>
      withClock((b, t0) => {
        const k = keyOf(color);
        voice(b, t0, {
          freq: 110 * (1 + k),
          type: "sawtooth",
          dur: 0.22,
          peak: 0.05,
          cutoff: 300,
          cutoffTo: 2200 + k * 2400,
          q: 9,
          send: 0.25,
        });
        voice(b, t0, {
          freq: 220 * (1 + k),
          type: "square",
          at: 0.02,
          dur: 0.12,
          peak: 0.02,
          cutoff: 1200,
          cutoffTo: 4000,
          q: 4,
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
          dur: 0.2,
          peak: 0.045,
          cutoff: 2600,
          cutoffTo: 260,
          q: 9,
          send: 0.15,
        }),
      ),
    [],
  );

  // START is the one ignition: a 0.9 s swell, then a power chord with the
  // room behind it, and the bed comes up under it.
  const playStart = useCallback(
    () =>
      withClock((b, t0) => {
        for (const [freq, peak] of [
          [55, 0.05],
          [110.4, 0.03],
        ])
          voice(b, t0, {
            freq,
            type: "sawtooth",
            dur: 0.9,
            peak,
            attack: 0.75,
            cutoff: 180,
            cutoffTo: 2400,
            q: 6,
          });
        for (const [freq, peak] of [
          [110, 0.06],
          [165, 0.05],
          [220, 0.045],
        ])
          voice(b, t0, {
            freq,
            type: "sawtooth",
            at: 0.82,
            dur: 1.1,
            peak,
            cutoff: 3200,
            cutoffTo: 600,
            q: 2,
            send: 0.35,
          });
        startBed();
      }),
    [],
  );

  // The coin: a clink, then a chord.
  const playInsertSting = useCallback(
    () =>
      withClock((b, t0) => {
        noise(b, t0, { dur: 0.03, peak: 0.05, freq: 5200, q: 3 });
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
            cutoff: 900,
            cutoffTo: 3600,
            q: 3,
            send: 0.35,
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
      // Back on the title card: the room fades rather than cuts, then the
      // context sleeps. Nothing to do for a visitor who never started.
      if (!hasBus()) return;
      stopBed(1.2);
      const t = setTimeout(suspendBus, 1400);
      return () => clearTimeout(t);
    }
    // In the arcade the first gesture wakes the clock, so the first sound is
    // instant, and brings the bed up for a visitor who came straight to the
    // list and never pressed START.
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
    playStart,
    playInsertSting,
    sound,
    toggleSound,
  };
}
