import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const PROJECTS = [
  { id: "sonido", title: "SONIDO", subtitle: "EMBEDDED DSP ENGINE", lang: "Rust", color: "#00ffaa", icon: "\u266b", github: "https://github.com/ampactor-labs/sonido", desc: "Kernel-based audio effects library targeting Daisy Seed / Hothouse hardware. Embassy-based BSP, zero-alloc DSP math, preset morphing, cross-platform deployment. The shape of sound.", tags: ["embedded", "dsp", "stm32h7", "no_std"] },
  { id: "solguard", title: "ST-SOLGUARD", subtitle: "TOKEN SAFETY SCANNER", lang: "Rust", color: "#ff6644", icon: "\u25c8", github: "https://github.com/ampactor-labs/st-solguard", desc: "Pay-per-request Solana token safety analysis via x402. Scans for rugs, honeypots, and concentration risks.", tags: ["solana", "x402", "defi", "security"] },
  { id: "x402-rs", title: "X402-RS", subtitle: "PAYMENTS OVER HTTP", lang: "Rust", color: "#44aaff", icon: "\u27d0", github: "https://github.com/ampactor-labs/x402-rs", desc: "x402 payment protocol in Rust. Verify, settle, and monitor payments over HTTP 402 flows. The internet's missing payment layer.", tags: ["x402", "http", "payments", "protocol"] },
  { id: "st-audit", title: "ST-AUDIT", subtitle: "SMART CONTRACT AUDITOR", lang: "Rust", color: "#ffaa00", icon: "\u2b21", github: "https://github.com/ampactor-labs/st-audit", desc: "Automated smart contract audit tooling. Pattern matching against known vulnerability classes. Structural analysis, not string matching.", tags: ["audit", "solana", "security", "analysis"] },
  { id: "x402", title: "X402", subtitle: "PAYMENT PROTOCOL", lang: "TypeScript", color: "#aa66ff", icon: "\u25c9", github: "https://github.com/ampactor-labs/x402", desc: "Payments protocol for the internet built on HTTP. Fork of the Coinbase reference implementation.", tags: ["coinbase", "http402", "web3", "protocol"] },
  { id: "selekta", title: "CELEZDIAL SELEKTA", subtitle: "AUDIO INTERFACE", lang: "JavaScript", color: "#ff44aa", icon: "\u2726", github: "https://github.com/ampactor-labs/celezdial-selekta", desc: "Interactive audio selection and mixing interface. Celestial dial energy. Select your frequency.", tags: ["audio", "interactive", "web", "creative"] },
  { id: "narrative", title: "ST-NARRATIVE", subtitle: "STORY ENGINE", lang: "HTML", color: "#66ffcc", icon: "\u25c7", github: "https://github.com/ampactor-labs/st-narrative", desc: "Narrative presentation layer for SuperTeam submissions. Telling the story behind the code.", tags: ["narrative", "presentation", "superteam"] },
];

const HIDDEN_PROJECTS = [
  { id: "coherence", title: "COHERENCE FIELD", subtitle: "CONSERVATION LAWS", lang: "\u2014", color: "#00ddbb", icon: "\u25ce", github: null, desc: "Self-sustaining distributed coherence. Phase-coupled particles, no central authority. Toggle the four constraints and watch the pattern live or die.", tags: ["don't fear", "don't protect", "don't consume", "don't neglect"], hidden: true, interactive: "coherence" },
  { id: "resonance", title: "SYS/RESONANCE", subtitle: "SUBTRACTIVE SYNTH", lang: "WebAudio", color: "#ffcc00", icon: "\u223f", github: null, desc: "Playable single-voice subtractive synthesizer. Oscillator \u2192 Filter \u2192 Amp \u2192 Delay. Keyboard-mapped. The signal chain, alive in the browser.", tags: ["oscillator", "filter", "envelope", "delay"], hidden: true, interactive: "synth" },
];

const crtStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=JetBrains+Mono:wght@300;400;600&family=Silkscreen:wght@400;700&display=swap');
  @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.8} 94%{opacity:1} 96%{opacity:0.9} 97%{opacity:1} }
  @keyframes scanmove { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes glitchIn { 0%{transform:translateX(-8px) skewX(-5deg);opacity:0;filter:hue-rotate(90deg)} 30%{transform:translateX(4px) skewX(2deg);opacity:0.7;filter:hue-rotate(-30deg)} 60%{transform:translateX(-2px) skewX(-1deg);opacity:0.9;filter:hue-rotate(10deg)} 100%{transform:none;opacity:1;filter:none} }
  @keyframes glitchFlash { 0%{background:transparent} 10%{background:rgba(0,255,170,0.08)} 20%{background:rgba(255,0,100,0.05)} 30%{background:transparent} 40%{background:rgba(0,100,255,0.06)} 50%,100%{background:transparent} }
  @keyframes marquee { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
  @keyframes coinGlow { 0%,100%{box-shadow:inset 0 0 4px rgba(255,200,0,0.2)} 50%{box-shadow:inset 0 0 8px rgba(255,200,0,0.5),0 0 6px rgba(255,200,0,0.15)} }
  @keyframes hiddenPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
  .crt-screen{animation:flicker 8s infinite}
  .scanline-bar{position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.03);animation:scanmove 4s linear infinite;pointer-events:none;z-index:100}
  .blink-cursor{animation:blink 1s step-end infinite}
  .project-row{transition:all 0.2s ease;cursor:pointer}
  .project-row:hover{background:rgba(255,255,255,0.04)!important;transform:translateX(4px)}
  .btn-cabinet{transition:all 0.15s ease;cursor:pointer;user-select:none}
  .btn-cabinet:hover{transform:scale(1.1);filter:brightness(1.3)}
  .btn-cabinet:active{transform:scale(0.95);filter:brightness(0.8)}
  .hidden-row{animation:hiddenPulse 3s ease-in-out infinite}
  .glitch-enter{animation:glitchIn 0.5s ease-out}
  .coin-slot{animation:coinGlow 2s ease-in-out infinite;cursor:pointer;transition:all 0.2s ease}
  .coin-slot:hover{box-shadow:inset 0 0 12px rgba(255,200,0,0.6),0 0 10px rgba(255,200,0,0.2)!important}
  .coin-slot:active{transform:scale(0.95)}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:rgba(0,0,0,0.3)}
  ::-webkit-scrollbar-thumb{background:rgba(100,255,170,0.2);border-radius:2px}
`;

function CoherenceField({ width, height }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [violations, setViolations] = useState({ fear: false, protect: false, consume: false, neglect: false });
  const vRef = useRef(violations);
  useEffect(() => { vRef.current = violations; }, [violations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    const N = 45;
    const particles = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({ x: Math.random() * width, y: Math.random() * height, vx: Math.cos(a) * 0.4, vy: Math.sin(a) * 0.4, phase: Math.random() * Math.PI * 2, freq: 0.02 + Math.random() * 0.01, baseFreq: 0.02 + Math.random() * 0.01, energy: 0.5 + Math.random() * 0.5, r: 2.5 + Math.random() * 1.5, baseR: 2.5 + Math.random() * 1.5, alive: true, consumed: false, wallTimer: 0 });
    }
    let t = 0;
    const tick = () => {
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.fillStyle = "rgba(8,8,12,0.18)"; ctx.fillRect(0, 0, width, height);
      const v = vRef.current; t++;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]; if (!p.alive) continue; p.phase += p.freq;
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]; if (!q.alive) continue;
          const dx = q.x - p.x, dy = q.y - p.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1 || dist > 80) continue;
          const nx = dx / dist, ny = dy / dist;
          if (dist < 20) { const f = (20 - dist) / 20 * 0.4; p.vx -= nx * f; p.vy -= ny * f; q.vx += nx * f; q.vy += ny * f; }
          if (dist < 50 && !v.fear) { const pd = q.phase - p.phase, c = 0.3 * (1 - dist / 50); p.phase += Math.sin(pd) * c * 0.1; q.phase -= Math.sin(pd) * c * 0.1; p.freq += (q.freq - p.freq) * c * 0.01; q.freq -= (q.freq - p.freq) * c * 0.01; }
          if (v.fear) { p.freq = p.baseFreq; q.freq = q.baseFreq; p.vx *= 0.95; p.vy *= 0.95; }
          if (!v.protect && dist > 20) { p.vx += nx * 0.002; p.vy += ny * 0.002; q.vx -= nx * 0.002; q.vy -= ny * 0.002; }
          if (v.protect && dist > 20) { p.wallTimer = Math.min(p.wallTimer + 0.01, 1); p.vx -= nx * 0.015 * p.wallTimer; p.vy -= ny * 0.015 * p.wallTimer; q.vx += nx * 0.015 * p.wallTimer; q.vy += ny * 0.015 * p.wallTimer; } else { p.wallTimer *= 0.99; }
          if (v.consume && dist < 30) { if (p.r > q.r) { p.r += 0.004; q.r -= 0.007; q.energy -= 0.002; if (q.r < 0.8) { q.alive = false; q.consumed = true; } } else { q.r += 0.004; p.r -= 0.007; p.energy -= 0.002; if (p.r < 0.8) { p.alive = false; p.consumed = true; } } }
          if (!v.consume) { p.r += (p.baseR - p.r) * 0.01; q.r += (q.baseR - q.r) * 0.01; }
          const alpha = (1 - dist / 80) * 0.25 * p.energy * q.energy;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `hsla(${170 + Math.sin(p.phase + q.phase) * 30},60%,55%,${alpha})`; ctx.lineWidth = alpha * 2.5; ctx.stroke();
        }
        if (v.neglect) { p.energy -= 0.0006; p.freq += (Math.random() - 0.5) * 0.002; if (p.energy < 0.05) p.alive = false; } else { p.energy += (1 - p.energy) * 0.005; }
        p.vx *= 0.97; p.vy *= 0.97; p.vx += (Math.random() - 0.5) * 0.06; p.vy += (Math.random() - 0.5) * 0.06;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 10) p.vx += 0.2; if (p.x > width - 10) p.vx -= 0.2; if (p.y < 10) p.vy += 0.2; if (p.y > height - 10) p.vy -= 0.2;
        const g = Math.sin(p.phase) * 0.5 + 0.5, hue = 170 + Math.sin(p.phase) * 40;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        grad.addColorStop(0, `hsla(${hue},60%,${45 + g * 25}%,${p.energy * (0.4 + g * 0.3)})`);
        grad.addColorStop(1, `hsla(${hue},60%,${45 + g * 25}%,0)`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.7 + g * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},65%,${50 + g * 25}%,${p.energy * (0.6 + g * 0.4)})`; ctx.fill();
      }
      if (!v.consume && t % 50 === 0) { const d = particles.find(p => !p.alive && p.consumed); if (d) Object.assign(d, { x: Math.random() * width, y: Math.random() * height, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, freq: d.baseFreq, energy: 0.5, r: d.baseR, alive: true, consumed: false, wallTimer: 0 }); }
      if (!v.neglect && t % 35 === 0) { const d = particles.find(p => !p.alive && !p.consumed); if (d) Object.assign(d, { x: Math.random() * width, y: Math.random() * height, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, freq: d.baseFreq, energy: 0.5, r: d.baseR, alive: true, consumed: false, wallTimer: 0 }); }
      ctx.restore(); animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height]);

  const toggle = (k) => setViolations(p => ({ ...p, [k]: !p[k] }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      <canvas ref={canvasRef} style={{ width, height, borderRadius: 6, border: "1px solid rgba(0,220,180,0.1)" }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {["fear", "protect", "consume", "neglect"].map(k => {
          const on = violations[k];
          return (<button key={k} onClick={() => toggle(k)} style={{ background: on ? "rgba(220,70,50,0.15)" : "rgba(0,220,180,0.06)", border: `1px solid ${on ? "rgba(220,70,50,0.3)" : "rgba(0,220,180,0.12)"}`, borderRadius: 4, padding: "5px 12px", cursor: "pointer", color: on ? "#dc4632" : "#5a8a7a", fontSize: 9, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>{k.toUpperCase()}{on ? " \u00d7" : ""}</button>);
        })}
      </div>
      {Object.values(violations).some(Boolean) && <div style={{ fontSize: 8, color: "rgba(220,70,50,0.5)", letterSpacing: "0.15em" }}>PATTERN DEGRADING</div>}
    </div>
  );
}

const NOTE_MAP = { a: 261.63, w: 277.18, s: 293.66, e: 311.13, d: 329.63, f: 349.23, t: 369.99, g: 392.00, y: 415.30, h: 440.00, u: 466.16, j: 493.88, k: 523.25, o: 554.37, l: 587.33 };

function Knob({ label, value, min, max, step, onChange, color = "#ffcc00" }) {
  const pct = (value - min) / (max - min);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: `conic-gradient(${color} ${pct * 270}deg, #1a1a2a ${pct * 270}deg)`, border: "2px solid #2a2a3a", position: "relative", boxShadow: `0 0 ${pct * 8}px ${color}33` }}>
        <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: "#12121c", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 2, height: 7, background: color, transform: `rotate(${-135 + pct * 270}deg)`, transformOrigin: "bottom center", borderRadius: 1 }} />
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: 40, height: 3, accentColor: color, opacity: 0.5 }} />
      <div style={{ fontSize: 7, color: "#445", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function SynthEngine({ width }) {
  const audioCtxRef = useRef(null);
  const [active, setActive] = useState(false);
  const [params, setParams] = useState({ waveform: "sawtooth", cutoff: 2200, resonance: 8, attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.5, delayTime: 0.35, delayFeed: 0.3 });
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const voicesRef = useRef({});
  const filterRef = useRef(null);
  const delayRef = useRef(null);
  const feedbackRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; }, [params]);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = params.cutoff; filter.Q.value = params.resonance;
    const delay = ctx.createDelay(2); delay.delayTime.value = params.delayTime;
    const feedback = ctx.createGain(); feedback.gain.value = params.delayFeed;
    const master = ctx.createGain(); master.gain.value = 0.3;
    const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
    filter.connect(master); filter.connect(delay); delay.connect(feedback); feedback.connect(delay); feedback.connect(master);
    master.connect(analyser); analyser.connect(ctx.destination);
    audioCtxRef.current = ctx; filterRef.current = filter; delayRef.current = delay; feedbackRef.current = feedback; analyserRef.current = analyser;
    setActive(true); return ctx;
  }, []);

  const noteOn = useCallback((freq) => {
    const ctx = initAudio(); if (voicesRef.current[freq]) return;
    const p = paramsRef.current;
    const osc = ctx.createOscillator(); osc.type = p.waveform; osc.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.6, ctx.currentTime + p.attack);
    env.gain.linearRampToValueAtTime(p.sustain * 0.6, ctx.currentTime + p.attack + p.decay);
    osc.connect(env); env.connect(filterRef.current); osc.start();
    voicesRef.current[freq] = { osc, env };
  }, [initAudio]);

  const noteOff = useCallback((freq) => {
    const voice = voicesRef.current[freq]; if (!voice) return;
    const ctx = audioCtxRef.current, now = ctx.currentTime, p = paramsRef.current;
    voice.env.gain.cancelScheduledValues(now);
    voice.env.gain.setValueAtTime(voice.env.gain.value, now);
    voice.env.gain.linearRampToValueAtTime(0, now + p.release);
    voice.osc.stop(now + p.release + 0.05);
    delete voicesRef.current[freq];
  }, []);

  useEffect(() => {
    const down = (e) => { if (e.repeat) return; const freq = NOTE_MAP[e.key.toLowerCase()]; if (freq) { noteOn(freq); setPressedKeys(p => new Set([...p, e.key.toLowerCase()])); } };
    const up = (e) => { const freq = NOTE_MAP[e.key.toLowerCase()]; if (freq) { noteOff(freq); setPressedKeys(p => { const s = new Set(p); s.delete(e.key.toLowerCase()); return s; }); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [noteOn, noteOff]);

  useEffect(() => {
    if (filterRef.current) { filterRef.current.frequency.value = params.cutoff; filterRef.current.Q.value = params.resonance; }
    if (delayRef.current) delayRef.current.delayTime.value = params.delayTime;
    if (feedbackRef.current) feedbackRef.current.gain.value = params.delayFeed;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1, w = width, h = 70;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.fillStyle = "rgba(8,8,12,0.4)"; ctx.fillRect(0, 0, w, h);
      if (analyserRef.current) {
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(buf);
        ctx.beginPath(); const sw = w / buf.length; let x = 0;
        for (let i = 0; i < buf.length; i++) { const y = buf[i] / 128.0 * h / 2; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); x += sw; }
        ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 1.5; ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 6; ctx.stroke();
      } else { ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.strokeStyle = "rgba(255,200,0,0.2)"; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.restore(); animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [width]);

  const WHITES = [{ key: "a", n: "C" }, { key: "s", n: "D" }, { key: "d", n: "E" }, { key: "f", n: "F" }, { key: "g", n: "G" }, { key: "h", n: "A" }, { key: "j", n: "B" }, { key: "k", n: "C5" }, { key: "l", n: "D5" }];
  const BLACKS = [{ key: "w", after: 0 }, { key: "e", after: 1 }, { key: "t", after: 3 }, { key: "y", after: 4 }, { key: "u", after: 5 }, { key: "o", after: 7 }];
  const keyW = Math.min(32, (width - 20) / 9);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <canvas ref={canvasRef} style={{ width, height: 70, borderRadius: 4, border: "1px solid rgba(255,200,0,0.1)" }} />
      <div style={{ display: "flex", gap: 3 }}>
        {["sawtooth", "square", "sine", "triangle"].map(w => (
          <button key={w} onClick={() => { initAudio(); setParams(p => ({ ...p, waveform: w })); }} style={{ background: params.waveform === w ? "rgba(255,200,0,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${params.waveform === w ? "rgba(255,200,0,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 3, padding: "4px 7px", cursor: "pointer", color: params.waveform === w ? "#ffcc00" : "#556", fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}>
            {w === "sawtooth" ? "SAW" : w === "square" ? "SQR" : w === "sine" ? "SIN" : "TRI"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        <Knob label="CUTOFF" value={params.cutoff} min={80} max={8000} step={10} onChange={(v) => setParams(p => ({ ...p, cutoff: v }))} />
        <Knob label="RES" value={params.resonance} min={0.1} max={25} step={0.1} onChange={(v) => setParams(p => ({ ...p, resonance: v }))} />
        <Knob label="ATK" value={params.attack} min={0.01} max={1} step={0.01} onChange={(v) => setParams(p => ({ ...p, attack: v }))} color="#44aaff" />
        <Knob label="DEC" value={params.decay} min={0.01} max={1} step={0.01} onChange={(v) => setParams(p => ({ ...p, decay: v }))} color="#44aaff" />
        <Knob label="SUS" value={params.sustain} min={0} max={1} step={0.01} onChange={(v) => setParams(p => ({ ...p, sustain: v }))} color="#44aaff" />
        <Knob label="REL" value={params.release} min={0.01} max={2} step={0.01} onChange={(v) => setParams(p => ({ ...p, release: v }))} color="#44aaff" />
        <Knob label="DLY" value={params.delayTime} min={0.05} max={1} step={0.01} onChange={(v) => setParams(p => ({ ...p, delayTime: v }))} color="#ff6644" />
        <Knob label="FDBK" value={params.delayFeed} min={0} max={0.85} step={0.01} onChange={(v) => setParams(p => ({ ...p, delayFeed: v }))} color="#ff6644" />
      </div>
      <div style={{ display: "flex", justifyContent: "center", position: "relative", height: 58, marginTop: 2 }}>
        {WHITES.map((k, i) => {
          const pressed = pressedKeys.has(k.key);
          return (<div key={k.key} role="button" aria-label={`Note ${k.n}`} aria-pressed={pressed}
            onMouseDown={() => { noteOn(NOTE_MAP[k.key]); setPressedKeys(p => new Set([...p, k.key])); }}
            onMouseUp={() => { noteOff(NOTE_MAP[k.key]); setPressedKeys(p => { const s = new Set(p); s.delete(k.key); return s; }); }}
            onMouseLeave={() => { if (pressedKeys.has(k.key)) { noteOff(NOTE_MAP[k.key]); setPressedKeys(p => { const s = new Set(p); s.delete(k.key); return s; }); } }}
            onTouchStart={(e) => { e.preventDefault(); noteOn(NOTE_MAP[k.key]); setPressedKeys(p => new Set([...p, k.key])); }}
            onTouchEnd={(e) => { e.preventDefault(); noteOff(NOTE_MAP[k.key]); setPressedKeys(p => { const s = new Set(p); s.delete(k.key); return s; }); }}
            style={{ width: keyW, height: 52, background: pressed ? "rgba(255,200,0,0.3)" : "linear-gradient(180deg, #2a2a3a, #1a1a2a)", border: `1px solid ${pressed ? "#ffcc00" : "#333348"}`, borderRadius: "0 0 4px 4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 3, cursor: "pointer", boxShadow: pressed ? "0 0 8px rgba(255,200,0,0.3)" : "0 2px 4px rgba(0,0,0,0.3)", transition: "all 0.05s ease", touchAction: "none" }}>
            <div style={{ fontSize: 7, color: pressed ? "#ffcc00" : "#445", fontFamily: "'JetBrains Mono', monospace" }}>{k.key.toUpperCase()}</div>
          </div>);
        })}
        {BLACKS.map(k => {
          const pressed = pressedKeys.has(k.key);
          return (<div key={k.key} role="button" aria-label={`Sharp note ${k.key.toUpperCase()}`} aria-pressed={pressed}
            onMouseDown={(e) => { e.stopPropagation(); noteOn(NOTE_MAP[k.key]); setPressedKeys(p => new Set([...p, k.key])); }}
            onMouseUp={() => { noteOff(NOTE_MAP[k.key]); setPressedKeys(p => { const s = new Set(p); s.delete(k.key); return s; }); }}
            onMouseLeave={() => { if (pressedKeys.has(k.key)) { noteOff(NOTE_MAP[k.key]); setPressedKeys(p => { const s = new Set(p); s.delete(k.key); return s; }); } }}
            onTouchStart={(e) => { e.preventDefault(); noteOn(NOTE_MAP[k.key]); setPressedKeys(p => new Set([...p, k.key])); }}
            onTouchEnd={(e) => { e.preventDefault(); noteOff(NOTE_MAP[k.key]); setPressedKeys(p => { const s = new Set(p); s.delete(k.key); return s; }); }}
            style={{ position: "absolute", left: (k.after + 1) * keyW - keyW * 0.3, top: 0, width: keyW * 0.6, height: 32, background: pressed ? "rgba(255,200,0,0.4)" : "#111118", border: `1px solid ${pressed ? "#ffcc00" : "#222232"}`, borderRadius: "0 0 3px 3px", zIndex: 2, cursor: "pointer", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2, boxShadow: pressed ? "0 0 6px rgba(255,200,0,0.3)" : "0 2px 4px rgba(0,0,0,0.5)", transition: "all 0.05s ease", touchAction: "none" }}>
            <div style={{ fontSize: 6, color: pressed ? "#ffcc00" : "#334" }}>{k.key.toUpperCase()}</div>
          </div>);
        })}
      </div>
      {!active && <div style={{ fontSize: 9, color: "#556", letterSpacing: "0.08em", textAlign: "center" }}>press a key or tap a note to initialize audio</div>}
    </div>
  );
}

export default function ArcadePortfolio() {
  const [screen, setScreen] = useState("boot");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [detailProject, setDetailProject] = useState(null);
  const [bootLine, setBootLine] = useState(0);
  const [coinInserted, setCoinInserted] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [dims, setDims] = useState({ w: 360, h: 500 });
  const screenRef = useRef(null);

  const allProjects = useMemo(() => coinInserted ? [...PROJECTS, ...HIDDEN_PROJECTS] : PROJECTS, [coinInserted]);

  const BOOT_LINES = ["AMPACTOR BIOS v4.2.0", "Initializing kernel graph...", "Loading DSP subsystem.......... OK", "Calibrating resonance field.... OK", "Mounting /dev/creativity....... OK", "Linking x402 payment layer..... OK", "Phase coupling established..... OK", "", "ALL SYSTEMS NOMINAL", "", "INSERT COIN TO CONTINUE"];

  useEffect(() => {
    if (screen !== "boot") return;
    const interval = setInterval(() => { setBootLine(prev => { if (prev >= BOOT_LINES.length - 1) { clearInterval(interval); return prev; } return prev + 1; }); }, 280);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    const measure = () => { if (screenRef.current) { const r = screenRef.current.getBoundingClientRect(); setDims({ w: r.width - 40, h: r.height - 32 }); } };
    measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (screen === "boot" && bootLine >= BOOT_LINES.length - 1) { setScreen("select"); return; }
      if (screen === "select") {
        if (e.key === "ArrowUp") setSelectedIdx(i => (i - 1 + allProjects.length) % allProjects.length);
        else if (e.key === "ArrowDown") setSelectedIdx(i => (i + 1) % allProjects.length);
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetailProject(allProjects[selectedIdx]); setScreen("detail"); }
      }
      if (screen === "detail" && !allProjects[selectedIdx]?.interactive?.includes("synth")) {
        if (e.key === "Escape" || e.key === "Backspace") { setScreen("select"); setDetailProject(null); }
      }
      if (screen === "detail" && allProjects[selectedIdx]?.interactive === "synth" && e.key === "Escape") { setScreen("select"); setDetailProject(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, selectedIdx, bootLine, allProjects]);

  const insertCoin = () => {
    if (coinInserted) return;
    setGlitching(true); setCoinInserted(true);
    setTimeout(() => setGlitching(false), 600);
  };

  const openProject = (idx) => { setSelectedIdx(idx); setDetailProject(allProjects[idx]); setScreen("detail"); };
  const goBack = () => { setScreen("select"); setDetailProject(null); };

  return (
    <div style={{ width: "100%", height: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{crtStyles}</style>
      <div ref={screenRef} className="crt-screen" style={{ flex: 1, margin: "10px 10px 0", borderRadius: "12px 12px 0 0", border: "3px solid #1a1a2a", borderBottom: "none", background: "radial-gradient(ellipse at center, #0d0d18 0%, #06060a 80%)", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 80px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,170,0.03)" }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)", pointerEvents: "none", zIndex: 90 }} />
        <div className="scanline-bar" />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none", zIndex: 80 }} />
        {glitching && <div style={{ position: "absolute", inset: 0, animation: "glitchFlash 0.6s ease", pointerEvents: "none", zIndex: 95 }} />}
        <div style={{ position: "relative", zIndex: 50, height: "100%", padding: "16px 20px", overflow: "hidden" }}>
          {screen === "boot" && <BootScreen lines={BOOT_LINES} currentLine={bootLine} onSkip={() => setScreen("select")} />}
          {screen === "select" && <SelectScreen projects={allProjects} selectedIdx={selectedIdx} onSelect={openProject} onHover={setSelectedIdx} coinInserted={coinInserted} />}
          {screen === "detail" && detailProject && <DetailScreen project={detailProject} onBack={goBack} screenWidth={dims.w} screenHeight={dims.h} />}
        </div>
      </div>

      {/* CABINET */}
      <div style={{ margin: "0 10px 10px", background: "linear-gradient(180deg, #1a1a2a 0%, #12121c 100%)", borderRadius: "0 0 16px 16px", border: "3px solid #1a1a2a", borderTop: "1px solid #222238", padding: "14px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div className="btn-cabinet" role="button" aria-label="Navigate up" tabIndex={0} onClick={() => { if (screen === "select") setSelectedIdx(i => (i - 1 + allProjects.length) % allProjects.length); if (screen === "boot" && bootLine >= BOOT_LINES.length - 1) setScreen("select"); }} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25b2"}</div>
          <div style={{ display: "flex", gap: 2 }}>
            <div className="btn-cabinet" role="button" aria-label="Go back" tabIndex={0} onClick={goBack} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25c4"}</div>
            <div style={{ width: 30, height: 30, background: "#222232", borderRadius: 4, border: "1px solid #2a2a3a" }} />
            <div className="btn-cabinet" role="button" aria-label="Navigate right" tabIndex={0} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25ba"}</div>
          </div>
          <div className="btn-cabinet" role="button" aria-label="Navigate down" tabIndex={0} onClick={() => { if (screen === "select") setSelectedIdx(i => (i + 1) % allProjects.length); }} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25bc"}</div>
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#00ffaa", letterSpacing: "0.2em", textShadow: "0 0 8px rgba(0,255,170,0.4)", marginBottom: 3 }}>AMPACTOR</div>
            <div style={{ fontSize: 7, color: "#445", letterSpacing: "0.15em" }}>SALT LAKE CITY \u00b7 EST. 2018</div>
          </div>
          <div className="coin-slot" role="button" aria-label={coinInserted ? "Bonus loaded" : "Insert coin"} tabIndex={0} onClick={insertCoin} title="Insert coin" style={{ width: 48, height: 14, background: coinInserted ? "rgba(255,200,0,0.1)" : "#111118", borderRadius: 7, border: `2px solid ${coinInserted ? "rgba(255,200,0,0.3)" : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ width: 28, height: 3, background: coinInserted ? "rgba(255,200,0,0.4)" : "#222232", borderRadius: 2, boxShadow: coinInserted ? "0 0 4px rgba(255,200,0,0.3)" : "inset 0 1px 2px rgba(0,0,0,0.5)" }} />
          </div>
          <div style={{ fontSize: 6, color: coinInserted ? "rgba(255,200,0,0.4)" : "#333", letterSpacing: "0.15em", transition: "color 0.3s ease" }}>{coinInserted ? "BONUS LOADED" : "INSERT COIN"}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="btn-cabinet" role="button" aria-label="Back" tabIndex={0} onClick={goBack} style={{ width: 38, height: 38, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #553333, #331111)", border: "2px solid #664444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#ff6644", fontFamily: "'Press Start 2P', monospace", boxShadow: "0 2px 8px rgba(255,100,68,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>B</div>
          <div className="btn-cabinet" role="button" aria-label="Select" tabIndex={0} onClick={() => { if (screen === "boot" && bootLine >= BOOT_LINES.length - 1) setScreen("select"); if (screen === "select") openProject(selectedIdx); }} style={{ width: 38, height: 38, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #225544, #113322)", border: "2px solid #338866", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#00ffaa", fontFamily: "'Press Start 2P', monospace", boxShadow: "0 2px 8px rgba(0,255,170,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>A</div>
        </div>
      </div>
    </div>
  );
}

function BootScreen({ lines, currentLine, onSkip }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 12, lineHeight: 2 }}>
        {lines.slice(0, currentLine + 1).map((line, i) => (
          <div key={i} style={{ color: i === 0 ? "#00ffaa" : line === "ALL SYSTEMS NOMINAL" ? "#00ffaa" : line === "INSERT COIN TO CONTINUE" ? "#ffaa00" : line.includes("OK") ? "#44aa66" : "#667788", animation: i === currentLine ? "slideUp 0.2s ease" : undefined, fontFamily: line === "INSERT COIN TO CONTINUE" ? "'Press Start 2P', monospace" : undefined, fontSize: line === "INSERT COIN TO CONTINUE" ? 10 : undefined, textAlign: line === "INSERT COIN TO CONTINUE" ? "center" : undefined, marginTop: line === "INSERT COIN TO CONTINUE" ? 8 : undefined }}>
            {line}{i === currentLine && line !== "" && <span className="blink-cursor" style={{ color: "#00ffaa" }}> {"\u2588"}</span>}
          </div>
        ))}
      </div>
      {currentLine >= lines.length - 1 && <div style={{ textAlign: "center", marginTop: 14, fontSize: 9, color: "#445", cursor: "pointer" }} onClick={onSkip}>[ press any key or tap A ]</div>}
    </div>
  );
}

function SelectScreen({ projects, selectedIdx, onSelect, onHover, coinInserted }) {
  const listRef = useRef(null);
  useEffect(() => { if (listRef.current?.children[selectedIdx]) listRef.current.children[selectedIdx].scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [selectedIdx]);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(0,255,170,0.1)" }}>
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: "#00ffaa", textShadow: "0 0 12px rgba(0,255,170,0.4)", letterSpacing: "0.1em" }}>SELECT PROGRAM</div>
          <div style={{ fontSize: 9, color: "#445", marginTop: 5, letterSpacing: "0.05em" }}>{projects.length} CARTRIDGE{projects.length !== 1 ? "S" : ""} LOADED</div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: "#334", textAlign: "right", lineHeight: 1.8 }}>{"\u25b2\u25bc"} NAV<br/>{"\u24b6"} SELECT</div>
      </div>
      <div ref={listRef} role="listbox" aria-label="Project list" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {projects.map((p, i) => {
          const active = i === selectedIdx, isH = p.hidden;
          return (
            <div key={p.id} role="option" aria-selected={active} aria-label={`${p.title} — ${p.subtitle}`} className={`project-row${isH ? " hidden-row glitch-enter" : ""}`} onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 6, background: active ? (isH ? "rgba(255,200,0,0.04)" : "rgba(0,255,170,0.05)") : "transparent", border: active ? `1px solid ${isH ? "rgba(255,200,0,0.15)" : "rgba(0,255,170,0.15)"}` : "1px solid transparent", position: "relative", borderLeft: isH ? `2px dashed ${p.color}33` : undefined }}>
              <div style={{ width: 3, height: "70%", background: active ? p.color : "transparent", borderRadius: 2, position: "absolute", left: isH ? -1 : 2, boxShadow: active ? `0 0 6px ${p.color}` : "none", transition: "all 0.2s ease" }} />
              <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: p.color, background: `${p.color}11`, borderRadius: 5, border: `1px solid ${p.color}22`, textShadow: active ? `0 0 8px ${p.color}` : "none", flexShrink: 0 }}>{p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: 12, color: active ? p.color : "#8899aa", textShadow: active ? `0 0 8px ${p.color}44` : "none", transition: "color 0.2s ease" }}>{p.title}</span>
                  <span style={{ fontSize: 8, color: "#334", padding: "1px 5px", background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>{p.lang}</span>
                </div>
                <div style={{ fontSize: 8, color: "#3a4a5a", marginTop: 1, letterSpacing: "0.08em" }}>{p.subtitle}</div>
              </div>
              {active && <div style={{ color: p.color, fontSize: 14, flexShrink: 0, opacity: 0.6 }}>{"\u203a"}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(0,255,170,0.06)", overflow: "hidden", height: 16, position: "relative" }}>
        <div style={{ position: "absolute", whiteSpace: "nowrap", fontSize: 8, color: "#2a3a4a", letterSpacing: "0.1em", animation: "marquee 25s linear infinite" }}>
          MORGAN ESPITIA {"\u00b7"} FULL-STACK + DSP + EMBEDDED {"\u00b7"} RUST {"\u00b7"} REACT {"\u00b7"} TYPESCRIPT {"\u00b7"} PYTHON {"\u00b7"} AUDIO ENGINEERING {"\u00b7"} SOLANA {"\u00b7"} x402 {"\u00b7"} SLC UT {"\u00b7\u00a0\u00a0\u00a0"}MORGAN ESPITIA {"\u00b7"} FULL-STACK + DSP + EMBEDDED {"\u00b7"} RUST {"\u00b7"} REACT {"\u00b7"} TYPESCRIPT {"\u00b7"} PYTHON {"\u00b7"} AUDIO ENGINEERING {"\u00b7"} SOLANA {"\u00b7"} x402 {"\u00b7"} SLC UT
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ project: p, onBack, screenWidth, screenHeight }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);
  const iw = Math.min(screenWidth, 400), ih = Math.min(screenHeight - 220, 240);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(10px)", transition: "all 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${p.color}22` }}>
        <div className="btn-cabinet" role="button" aria-label="Back to project list" tabIndex={0} onClick={onBack} style={{ fontSize: 12, color: "#556", padding: "3px 7px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{"\u25c4"}</div>
        <div style={{ fontSize: 24, color: p.color, textShadow: `0 0 12px ${p.color}44` }}>{p.icon}</div>
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: p.color, textShadow: `0 0 10px ${p.color}44`, letterSpacing: "0.05em" }}>{p.title}</div>
          <div style={{ fontSize: 9, color: "#445", letterSpacing: "0.1em", marginTop: 3 }}>{p.subtitle}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: "#8899aa", marginBottom: 14, maxWidth: 520 }}>{p.desc}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {p.tags.map(tag => (<span key={tag} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 3, background: `${p.color}0a`, border: `1px solid ${p.color}20`, color: `${p.color}aa`, letterSpacing: "0.05em" }}>{tag}</span>))}
        </div>
        {p.interactive === "coherence" && <CoherenceField width={iw} height={ih} />}
        {p.interactive === "synth" && <SynthEngine width={iw} />}
        {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", marginTop: 14, background: `${p.color}11`, border: `1px solid ${p.color}33`, borderRadius: 6, color: p.color, textDecoration: "none", fontSize: 10, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }} onMouseEnter={(e) => { e.currentTarget.style.background = `${p.color}22`; e.currentTarget.style.boxShadow = `0 0 16px ${p.color}22`; }} onMouseLeave={(e) => { e.currentTarget.style.background = `${p.color}11`; e.currentTarget.style.boxShadow = "none"; }}>VIEW SOURCE {"\u2192"}</a>}
      </div>
      <div style={{ paddingTop: 10, borderTop: `1px solid ${p.color}11`, fontSize: 8, color: "#334", display: "flex", justifyContent: "space-between" }}>
        <span>[ {"\u24b7"} BACK ]</span>
        <span>{p.github ? p.github.replace("https://github.com/", "") : p.id}</span>
      </div>
    </div>
  );
}
