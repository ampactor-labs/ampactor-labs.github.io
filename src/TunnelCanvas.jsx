import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

const RING_COUNT = 12;
const DUST_COUNT = 45;
const FOV = 200;
const DEPTH_RANGE = 800;
const TWO_PI = Math.PI * 2;

// Color palette by depth tier
const COLORS = [
  { stroke: "#00E5FF", shadow: "#00E5FF" },   // cyan (near)
  { stroke: "#00FFD0", shadow: "#00FFD0" },   // teal
  { stroke: "#00E5FF", shadow: "#00E5FF" },   // cyan
  { stroke: "#44aaff", shadow: "#4488FF" },   // blue (mid)
  { stroke: "#4488FF", shadow: "#4488FF" },
  { stroke: "#4466dd", shadow: "#4466dd" },
  { stroke: "#5544cc", shadow: "#5544cc" },   // indigo (far)
  { stroke: "#6644FF", shadow: "#6644FF" },
  { stroke: "#5533bb", shadow: "#5533bb" },
  { stroke: "#4422aa", shadow: "#4422aa" },
  { stroke: "#331199", shadow: "#331199" },
  { stroke: "#221088", shadow: "#221088" },
];

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

const DUST_COLORS = ["#00FFD0", "#00E5FF", "#4488FF", "#6644FF"];

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

  // Expose imperative speed control for intro sequence
  useImperativeHandle(ref, () => ({
    setSpeed(s) { stateRef.current.speed = s; },
    getSpeed() { return stateRef.current.speed; },
  }));

  // Sync prop changes
  useEffect(() => { stateRef.current.speed = speed; }, [speed]);

  const draw = useCallback((ctx, w, h, dt) => {
    const st = stateRef.current;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Advance tunnel and time
    st.tunnelDepth += st.speed * dt;
    st.elapsed += dt;
    st.sweepAngle += (TWO_PI / 18000) * dt; // ~18s full rotation

    // --- Pentagon rings with perspective ---
    // Base radius scales to viewport so tunnel fills the screen
    const baseRadius = Math.max(w, h) * 0.7;

    for (let i = 0; i < RING_COUNT; i++) {
      const z = ((i / RING_COUNT) + st.tunnelDepth) % 1.0; // 0=far, 1=near
      const nearness = z; // 1 = closest
      const scale = FOV / (FOV + (1 - nearness) * DEPTH_RANGE);
      const radius = baseRadius * scale;
      // Slow independent rotation per ring — decoupled from tunnel advance
      const dir = i % 2 === 0 ? 1 : -1;
      const ringPeriod = 50000 + i * 7000; // 50-130s per revolution, like original
      const rotation = dir * (st.elapsed / ringPeriod) * TWO_PI;

      const colorIdx = Math.min(Math.floor((1 - nearness) * RING_COUNT), COLORS.length - 1);
      const color = COLORS[colorIdx];

      const alpha = 0.04 + nearness * 0.25;
      const lineWidth = 0.4 + nearness * 2.2;
      const blur = 4 + nearness * 14;

      const verts = pentagonVertices(cx, cy, radius, rotation);

      ctx.save();
      ctx.strokeStyle = color.stroke;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = blur;
      ctx.shadowColor = color.shadow;

      ctx.beginPath();
      ctx.moveTo(verts[0][0], verts[0][1]);
      for (let v = 1; v < 5; v++) ctx.lineTo(verts[v][0], verts[v][1]);
      ctx.closePath();
      ctx.stroke();

      // Connecting lines to center for nearest rings (Tempest web lanes)
      if (nearness > 0.6) {
        const lineAlpha = (nearness - 0.6) / 0.4 * 0.12;
        ctx.globalAlpha = lineAlpha;
        ctx.lineWidth = 0.6;
        ctx.shadowBlur = 4;
        for (let v = 0; v < 5; v++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(verts[v][0], verts[v][1]);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // --- Radar sweep ---
    ctx.save();
    const sx = cx + Math.cos(st.sweepAngle) * Math.max(w, h) * 0.6;
    const sy = cy + Math.sin(st.sweepAngle) * Math.max(w, h) * 0.6;
    ctx.strokeStyle = "#00E5FF";
    ctx.globalAlpha = 0.035;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#00E5FF";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.restore();

    // --- Dust particles ---
    const dust = st.dust;
    for (let i = 0; i < dust.length; i++) {
      const p = dust[i];
      p.y -= p.speed * dt;
      p.x += p.drift * dt;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      if (p.x < -0.02 || p.x > 1.02) p.x = Math.random();

      ctx.save();
      ctx.fillStyle = DUST_COLORS[p.colorIdx];
      ctx.globalAlpha = p.opacity;
      ctx.shadowBlur = 3;
      ctx.shadowColor = DUST_COLORS[p.colorIdx];
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (now) => {
      const dt = Math.min(now - lastTime, 50); // cap delta to avoid jumps
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
