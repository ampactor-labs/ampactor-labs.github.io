import { useRef, useCallback, useEffect } from "react";

export default function useTunnelGameAudio() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (freq, type, dur, vol = 0.03) => {
      let ctx;
      try {
        ctx = getCtx();
      } catch {
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    [getCtx],
  );

  const playLaser = useCallback(() => {
    let ctx;
    try {
      ctx = getCtx();
    } catch {
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    gain.gain.value = 0.04;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }, [getCtx]);

  const playExplosion = useCallback(() => {
    let ctx;
    try {
      ctx = getCtx();
    } catch {
      return;
    }
    // White noise burst
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.03;
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.06);
    // Low sine thump
    tone(220, "sine", 0.04, 0.03);
  }, [getCtx, tone]);

  const playHit = useCallback(() => {
    let ctx;
    try {
      ctx = getCtx();
    } catch {
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 110;
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [getCtx]);

  const playDodge = useCallback(() => tone(1200, "sine", 0.02, 0.015), [tone]);

  const playCombo = useCallback(() => {
    tone(660, "sine", 0.04, 0.03);
    setTimeout(() => tone(880, "sine", 0.04, 0.03), 40);
  }, [tone]);

  const playGameOver = useCallback(() => {
    [440, 330, 220, 110].forEach((f, i) => {
      setTimeout(() => tone(f, "sawtooth", 0.15, 0.04), i * 150);
    });
  }, [tone]);

  const playCountdown = useCallback(() => tone(660, "square", 0.1, 0.03), [tone]);
  const playGo = useCallback(() => tone(1320, "square", 0.15, 0.04), [tone]);

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return {
    playLaser,
    playExplosion,
    playHit,
    playDodge,
    playCombo,
    playGameOver,
    playCountdown,
    playGo,
  };
}
