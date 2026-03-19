import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

const RING_COUNT = 12;
const DUST_COUNT = 30;
const FOV = 200;
const DEPTH_RANGE = 800;
const TWO_PI = Math.PI * 2;
const MAX_DPR = 1; // Background effect — no need for retina resolution

const COLORS = [
  { stroke: "#00E5FF", glow: "rgba(0,229,255," },
  { stroke: "#00FFD0", glow: "rgba(0,255,208," },
  { stroke: "#00E5FF", glow: "rgba(0,229,255," },
  { stroke: "#44aaff", glow: "rgba(68,170,255," },
  { stroke: "#4488FF", glow: "rgba(68,136,255," },
  { stroke: "#4466dd", glow: "rgba(68,102,221," },
  { stroke: "#5544cc", glow: "rgba(85,68,204," },
  { stroke: "#6644FF", glow: "rgba(102,68,255," },
  { stroke: "#5533bb", glow: "rgba(85,51,187," },
  { stroke: "#4422aa", glow: "rgba(68,34,170," },
  { stroke: "#331199", glow: "rgba(51,17,153," },
  { stroke: "#221088", glow: "rgba(34,16,136," },
];

const DUST_COLORS = ["#00FFD0", "#00E5FF", "#4488FF", "#6644FF"];

function pentagonVertices(cx, cy, radius, rotation) {
  const verts = [];
  for (let i = 0; i < 5; i++) {
    const a = (TWO_PI * i) / 5 - Math.PI / 2 + rotation;
    verts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
  }
  return verts;
}

function initDust() {
  const particles = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      speed: 0.0003 + Math.random() * 0.001,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.03 + Math.random() * 0.08,
      colorIdx: i % 4,
      drift: (Math.random() - 0.5) * 0.0002,
    });
  }
  return particles;
}

const TunnelCanvas = forwardRef(function TunnelCanvas({ speed = 0.00008 }, ref) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    tunnelDepth: 0,
    sweepAngle: 0,
    elapsed: 0,
    dust: initDust(),
    speed,
    animId: null,
  });

  useImperativeHandle(ref, () => ({
    setSpeed(s) { stateRef.current.speed = s; },
    getSpeed() { return stateRef.current.speed; },
  }));

  useEffect(() => { stateRef.current.speed = speed; }, [speed]);

  const draw = useCallback((ctx, w, h, dt) => {
    const st = stateRef.current;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    st.tunnelDepth += st.speed * dt;
    st.elapsed += dt;
    st.sweepAngle += (TWO_PI / 18000) * dt;

    const baseRadius = Math.max(w, h) * 0.7;

    // Pre-compute all ring data once
    const rings = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const nearness = ((i / RING_COUNT) + st.tunnelDepth) % 1.0;
      const scale = FOV / (FOV + (1 - nearness) * DEPTH_RANGE);
      const dir = i % 2 === 0 ? 1 : -1;
      const rotation = dir * (st.elapsed / (50000 + i * 7000)) * TWO_PI;
      const colorIdx = Math.min(Math.floor((1 - nearness) * RING_COUNT), COLORS.length - 1);
      rings.push({
        nearness,
        radius: baseRadius * scale,
        rotation,
        color: COLORS[colorIdx],
        alpha: 0.04 + nearness * 0.25,
        lineWidth: 0.4 + nearness * 2.2,
        verts: pentagonVertices(cx, cy, baseRadius * scale, rotation),
      });
    }

    // Pass 1: All sharp ring strokes (source-over, no composite switch)
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.globalAlpha = r.alpha;
      ctx.strokeStyle = r.color.stroke;
      ctx.lineWidth = r.lineWidth;
      ctx.beginPath();
      ctx.moveTo(r.verts[0][0], r.verts[0][1]);
      for (let v = 1; v < 5; v++) ctx.lineTo(r.verts[v][0], r.verts[v][1]);
      ctx.closePath();
      ctx.stroke();
    }

    // Pass 2: All glow strokes in one batch (single composite switch)
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      if (r.nearness <= 0.15) continue;
      ctx.globalAlpha = r.alpha * 0.25;
      ctx.strokeStyle = r.color.glow + "0.4)";
      ctx.lineWidth = r.lineWidth + 4 + r.nearness * 6;
      ctx.beginPath();
      ctx.moveTo(r.verts[0][0], r.verts[0][1]);
      for (let v = 1; v < 5; v++) ctx.lineTo(r.verts[v][0], r.verts[v][1]);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    // Pass 3: Connecting lines — batch per ring into one path
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      if (r.nearness <= 0.6) continue;
      ctx.globalAlpha = (r.nearness - 0.6) / 0.4 * 0.12;
      ctx.strokeStyle = r.color.stroke;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let v = 0; v < 5; v++) {
        ctx.moveTo(cx, cy);
        ctx.lineTo(r.verts[v][0], r.verts[v][1]);
      }
      ctx.stroke(); // single stroke call for all 5 lines
    }

    // Radar sweep
    ctx.strokeStyle = "#00E5FF";
    ctx.globalAlpha = 0.035;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(st.sweepAngle) * Math.max(w, h) * 0.6,
      cy + Math.sin(st.sweepAngle) * Math.max(w, h) * 0.6,
    );
    ctx.stroke();

    // Dust particles — batched by color, single path per color group
    const dust = st.dust;
    for (let ci = 0; ci < DUST_COLORS.length; ci++) {
      ctx.fillStyle = DUST_COLORS[ci];
      // Group particles with similar opacity to reduce state changes
      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        if (p.colorIdx !== ci) continue;
        p.y -= p.speed * dt;
        p.x += p.drift * dt;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02 || p.x > 1.02) p.x = Math.random();
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.size, 0, TWO_PI);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (now) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      draw(ctx, canvas.offsetWidth, canvas.offsetHeight, dt);
      stateRef.current.animId = requestAnimationFrame(loop);
    };
    stateRef.current.animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
});

export default TunnelCanvas;
