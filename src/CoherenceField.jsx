import { useState, useEffect, useRef } from "react";

export default function CoherenceField({ width, height }) {
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
