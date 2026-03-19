import { useState, useEffect, useRef, useCallback } from "react";

const NOTE_MAP = { a: 261.63, w: 277.18, s: 293.66, e: 311.13, d: 329.63, f: 349.23, t: 369.99, g: 392.00, y: 415.30, h: 440.00, u: 466.16, j: 493.88, k: 523.25, o: 554.37, l: 587.33 };

function Knob({ label, value, min, max, step, onChange, color = "#FFB800" }) {
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

export default function SynthEngine({ width }) {
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
    let buf = null;
    const draw = () => {
      ctx.save(); ctx.scale(dpr, dpr);
      ctx.fillStyle = "rgba(8,8,12,0.4)"; ctx.fillRect(0, 0, w, h);
      if (analyserRef.current) {
        if (!buf) buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(buf);
        ctx.beginPath(); const sw = w / buf.length; let x = 0;
        for (let i = 0; i < buf.length; i++) { const y = buf[i] / 128.0 * h / 2; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); x += sw; }
        ctx.strokeStyle = "#FFB800"; ctx.lineWidth = 1.5; ctx.stroke();
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
          <button key={w} onClick={() => { initAudio(); setParams(p => ({ ...p, waveform: w })); }} style={{ background: params.waveform === w ? "rgba(255,200,0,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${params.waveform === w ? "rgba(255,200,0,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 3, padding: "4px 7px", cursor: "pointer", color: params.waveform === w ? "#FFB800" : "#556", fontSize: 8, fontFamily: "'JetBrains Mono', monospace" }}>
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
            style={{ width: keyW, height: 52, background: pressed ? "rgba(255,200,0,0.3)" : "linear-gradient(180deg, #2a2a3a, #1a1a2a)", border: `1px solid ${pressed ? "#FFB800" : "#333348"}`, borderRadius: "0 0 4px 4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 3, cursor: "pointer", boxShadow: pressed ? "0 0 8px rgba(255,200,0,0.3)" : "0 2px 4px rgba(0,0,0,0.3)", transition: "all 0.05s ease", touchAction: "none" }}>
            <div style={{ fontSize: 7, color: pressed ? "#FFB800" : "#445", fontFamily: "'JetBrains Mono', monospace" }}>{k.key.toUpperCase()}</div>
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
            style={{ position: "absolute", left: (k.after + 1) * keyW - keyW * 0.3, top: 0, width: keyW * 0.6, height: 32, background: pressed ? "rgba(255,200,0,0.4)" : "#111118", border: `1px solid ${pressed ? "#FFB800" : "#222232"}`, borderRadius: "0 0 3px 3px", zIndex: 2, cursor: "pointer", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2, boxShadow: pressed ? "0 0 6px rgba(255,200,0,0.3)" : "0 2px 4px rgba(0,0,0,0.5)", transition: "all 0.05s ease", touchAction: "none" }}>
            <div style={{ fontSize: 6, color: pressed ? "#FFB800" : "#334" }}>{k.key.toUpperCase()}</div>
          </div>);
        })}
      </div>
      {!active && <div style={{ fontSize: 9, color: "#556", letterSpacing: "0.08em", textAlign: "center" }}>press a key or tap a note to initialize audio</div>}
    </div>
  );
}
