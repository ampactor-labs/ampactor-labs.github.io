import { useState, useRef, useCallback } from "react";

export default function useAmbientHum() {
  const [humming, setHumming] = useState(false);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);

  const initHum = useCallback(() => {
    if (ctxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.012;

    // LFO for subtle amplitude modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 3;
    lfoGain.gain.value = 0.003;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();

    // CRT electrical hum harmonics: 60Hz fundamental + overtones
    const oscs = [60, 120, 240].map((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      // Each harmonic progressively quieter
      gain.gain.value = 1 / (i + 1);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      return { osc, gain };
    });

    master.connect(ctx.destination);
    ctxRef.current = ctx;
    nodesRef.current = { master, lfo, lfoGain, oscs };
    setHumming(true);
  }, []);

  const toggleHum = useCallback(() => {
    if (!ctxRef.current) {
      initHum();
      return;
    }
    const master = nodesRef.current.master;
    if (humming) {
      master.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.1);
      setHumming(false);
    } else {
      master.gain.setTargetAtTime(0.012, ctxRef.current.currentTime, 0.1);
      setHumming(true);
    }
  }, [humming, initHum]);

  const playBlip = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 800;
    gain.gain.value = 0.02;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }, []);

  return { humming, toggleHum, initHum, playBlip };
}
