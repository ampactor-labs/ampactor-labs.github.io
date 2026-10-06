import { useCallback } from "react";
import { getBus, soundOn } from "./audio/bus";

// TUNNEL_RUN's sounds, on the cabinet's bus (audio/bus.js): one context, one
// master, so SOUND OFF on the panel silences the game too. The laser and the
// blasts take a rate, the run's speed against its start, and climb with it.
export default function useTunnelGameAudio() {
  // The bus, awake, or null with SOUND OFF (silence all the way down: no
  // context, no notes) or no Web Audio at all.
  const live = useCallback(() => {
    if (!soundOn()) return null;
    let b;
    try {
      b = getBus();
    } catch {
      return null;
    }
    // Mobile browsers start the context suspended and re-suspend it when the
    // tab is backgrounded; a frozen clock queues every note unheard.
    if (b.ctx.state === "suspended") b.ctx.resume().catch(() => {});
    return b;
  }, []);

  const tone = useCallback(
    (freq, type, dur, vol = 0.03) => {
      const b = live();
      if (!b) return;
      const { ctx } = b;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(b.master);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    [live],
  );

  const playLaser = useCallback(
    (rate = 1) => {
      const b = live();
      if (!b) return;
      const { ctx } = b;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880 * rate, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440 * rate, ctx.currentTime + 0.08);
      gain.gain.value = 0.04;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(b.master);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    },
    [live],
  );

  const playExplosion = useCallback(
    (rate = 1) => {
      const b = live();
      if (!b) return;
      const { ctx } = b;
      // White noise burst, shorter as the run speeds up
      const dur = 0.06 / Math.sqrt(rate);
      const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const burst = ctx.createBufferSource();
      burst.buffer = buf;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.03;
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      burst.connect(noiseGain);
      noiseGain.connect(b.master);
      burst.start();
      burst.stop(ctx.currentTime + dur);
      // Low sine thump, pitched up with the run
      tone(220 * rate, "sine", 0.04, 0.03);
    },
    [live, tone],
  );

  const playHit = useCallback(() => {
    const b = live();
    if (!b) return;
    const { ctx } = b;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 110;
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(b.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [live]);

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

  // Boss klaxon: three low sawtooth pulses (distinct from the descending
  // game-over run). Boss down: a rising square fanfare.
  const playBossAlert = useCallback(() => {
    [0, 1, 2].forEach((i) => {
      setTimeout(() => tone(196, "sawtooth", 0.14, 0.05), i * 190);
    });
  }, [tone]);
  const playBossDown = useCallback(() => {
    [660, 880, 1100, 1320].forEach((f, i) => {
      setTimeout(() => tone(f, "square", 0.1, 0.04), i * 90);
    });
  }, [tone]);

  return {
    playLaser,
    playExplosion,
    playHit,
    playDodge,
    playCombo,
    playGameOver,
    playCountdown,
    playGo,
    playBossAlert,
    playBossDown,
  };
}
