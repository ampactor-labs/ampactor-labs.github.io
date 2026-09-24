import { useRef, useCallback, useEffect } from "react";

export default function useAmbientHum() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  // Run `fn(ctx, t0)` against a LIVE audio clock. The old code scheduled notes
  // immediately after calling resume() (which is async): while the context was
  // still suspended, ctx.currentTime stayed frozen, so the gain envelope could
  // fully elapse before the clock ever advanced — the note never sounded. That
  // is the "sometimes not at all". Gating on ctx.state (and deferring to
  // resume() when suspended) guarantees t0 is a real, advancing timestamp.
  const withClock = useCallback(
    (fn) => {
      let ctx;
      try {
        ctx = getCtx();
      } catch {
        return;
      }
      const run = () => {
        try {
          fn(ctx, ctx.currentTime);
        } catch {
          /* context closed mid-flight */
        }
      };
      if (ctx.state === "running") run();
      else ctx.resume().then(run).catch(() => {});
    },
    [getCtx],
  );

  // Schedule a set of tones on the Web Audio clock. setTimeout staggering was
  // the other bug: under canvas + React load those timers fired late or were
  // dropped entirely — that is the "firing way too late". Audio-clock offsets
  // (osc.start(t0 + at)) are sample-accurate and immune to main-thread jank.
  const scheduleNotes = useCallback(
    (notes) =>
      withClock((ctx, t0) => {
        for (const n of notes) {
          const start = t0 + (n.at ?? 0);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = n.type ?? "square";
          if (n.sweepTo != null) {
            osc.frequency.setValueAtTime(n.freq, start);
            osc.frequency.linearRampToValueAtTime(n.sweepTo, start + n.dur);
          } else {
            osc.frequency.value = n.freq;
          }
          gain.gain.setValueAtTime(n.peak, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + n.dur);
        }
      }),
    [withClock],
  );

  const playBlip = useCallback(
    () => scheduleNotes([{ freq: 960, dur: 0.022, peak: 0.012 }]),
    [scheduleNotes],
  );

  const playEnter = useCallback(
    () =>
      // Two ascending tones: 440 → 660 Hz, crisp select sound
      scheduleNotes([
        { freq: 440, at: 0, dur: 0.06, peak: 0.05 },
        { freq: 660, at: 0.055, dur: 0.06, peak: 0.05 },
      ]),
    [scheduleNotes],
  );

  const playBack = useCallback(
    () =>
      // Two descending tones: 550 → 330 Hz
      scheduleNotes([
        { freq: 550, at: 0, dur: 0.055, peak: 0.04 },
        { freq: 330, at: 0.05, dur: 0.055, peak: 0.04 },
      ]),
    [scheduleNotes],
  );

  const playInsertSting = useCallback(
    (tier) => {
      if (tier === 1) {
        // Three ascending sine tones: 600 → 800 → 1000 Hz staggered 100ms
        scheduleNotes([
          { freq: 600, type: "sine", at: 0, dur: 0.12, peak: 0.06 },
          { freq: 800, type: "sine", at: 0.1, dur: 0.12, peak: 0.06 },
          { freq: 1000, type: "sine", at: 0.2, dur: 0.12, peak: 0.06 },
        ]);
      } else if (tier === 2) {
        // White noise burst + low sine thump
        withClock((ctx, t0) => {
          const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource();
          const noiseGain = ctx.createGain();
          src.buffer = buf;
          noiseGain.gain.setValueAtTime(0.08, t0);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
          src.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          src.start(t0);
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 90;
          g.gain.setValueAtTime(0.1, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + 0.15);
        });
      } else if (tier === 3) {
        // Dramatic sawtooth power chord: 220 + 330 + 440 Hz swept up 20%
        scheduleNotes([
          { freq: 220, type: "sawtooth", dur: 0.5, peak: 0.05, sweepTo: 264 },
          { freq: 330, type: "sawtooth", dur: 0.5, peak: 0.05, sweepTo: 396 },
          { freq: 440, type: "sawtooth", dur: 0.5, peak: 0.05, sweepTo: 528 },
        ]);
      }
    },
    [scheduleNotes, withClock],
  );

  // Prime the context on the first user gesture so the very first nav blip is
  // instant. A fresh AudioContext starts suspended; creating + resuming it
  // lazily inside the first playBlip added audible latency or dropped that blip
  // outright. One warm-up gesture is enough — afterwards the clock is live and
  // the resume-guard above covers any later mobile re-suspend.
  useEffect(() => {
    const warm = () => {
      try {
        const ctx = getCtx();
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
      } catch {
        /* AudioContext unavailable */
      }
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
  }, [getCtx]);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return {
    humming: false,
    toggleHum: () => {},
    initHum: () => {},
    playBlip,
    playEnter,
    playBack,
    playInsertSting,
  };
}
