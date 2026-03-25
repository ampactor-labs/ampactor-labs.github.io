import { useRef, useCallback, useEffect } from "react";

export default function useAmbientHum() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playBlip = useCallback(() => {
    let ctx;
    try {
      ctx = getCtx();
    } catch {
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 960;
    gain.gain.value = 0.012;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.022);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.022);
  }, [getCtx]);

  const playEnter = useCallback(() => {
    let ctx;
    try {
      ctx = getCtx();
    } catch {
      return;
    }
    // Two ascending tones: 440 → 660 Hz, crisp select sound
    [440, 660].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }, i * 55);
    });
  }, [getCtx]);

  const playBack = useCallback(() => {
    let ctx;
    try {
      ctx = getCtx();
    } catch {
      return;
    }
    // Two descending tones: 550 → 330 Hz
    [550, 330].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.value = 0.04;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.055);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.055);
      }, i * 50);
    });
  }, [getCtx]);

  const playInsertSting = useCallback(
    (tier) => {
      let ctx;
      try {
        ctx = getCtx();
      } catch {
        return;
      }

      if (tier === 1) {
        // Three ascending sine tones: 600 → 800 → 1000 Hz staggered 100ms
        [600, 800, 1000].forEach((freq, i) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.value = 0.06;
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              ctx.currentTime + 0.12,
            );
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
          }, i * 100);
        });
      } else if (tier === 2) {
        // White noise burst + low sine thump
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        const noiseGain = ctx.createGain();
        src.buffer = buf;
        noiseGain.gain.value = 0.08;
        noiseGain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.08,
        );
        src.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        src.start();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 90;
        g.gain.value = 0.1;
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (tier === 3) {
        // Dramatic sawtooth power chord: 220 + 330 + 440 Hz with frequency sweep up
        [220, 330, 440].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.value = freq;
          osc.frequency.linearRampToValueAtTime(
            freq * 1.2,
            ctx.currentTime + 0.4,
          );
          gain.gain.value = 0.05;
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        });
      }
    },
    [getCtx],
  );

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
