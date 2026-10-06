import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { PALETTE, TUNNEL, alpha } from "./palette";

const RING_COUNT = 12;
const DUST_COUNT = 30;
const FOV = 200;
const DEPTH_RANGE = 800;
const TWO_PI = Math.PI * 2;
const MAX_DPR = 1; // Background effect — no need for retina resolution

// Each ring's stroke and the glow pass behind it, near to far (palette.js).
const COLORS = TUNNEL.rings.map((stroke) => ({
  stroke,
  glow: alpha(stroke, 0.4),
}));

const DUST_COLORS = TUNNEL.dust;

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

// The inner name is what React DevTools shows for the component.
// eslint-disable-next-line no-shadow
const TunnelCanvas = forwardRef(function TunnelCanvas(
  { speed = 0.00008 },
  ref,
) {
  const isMobileRef = useRef(
    typeof window !== "undefined" && window.innerWidth <= 600,
  );
  const canvasRef = useRef(null);
  const stateRef = useRef({
    tunnelDepth: 0,
    sweepAngle: 0,
    elapsed: 0,
    dust: initDust(),
    speed,
    revealRadius: 0,
    animId: null,
  });

  useImperativeHandle(ref, () => ({
    setSpeed(s) {
      stateRef.current.speed = s;
    },
    getSpeed() {
      return stateRef.current.speed;
    },
    setRevealRadius(r) {
      stateRef.current.revealRadius = r;
    },
    getRevealRadius() {
      return stateRef.current.revealRadius;
    },
    getState() {
      const st = stateRef.current;
      return { tunnelDepth: st.tunnelDepth, elapsed: st.elapsed };
    },
  }));

  useEffect(() => {
    stateRef.current.speed = speed;
  }, [speed]);

  const draw = useCallback((ctx, w, h, dt) => {
    const st = stateRef.current;

    // Nothing to draw — revealRadius=0 keeps canvas blank
    if (st.revealRadius <= 0) {
      ctx.clearRect(0, 0, w, h);
      return;
    }

    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    st.tunnelDepth += st.speed * dt;
    st.elapsed += dt;
    st.sweepAngle += (TWO_PI / 18000) * dt;

    const baseRadius = Math.max(w, h) * 0.7;

    // Clip all drawing to the reveal circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, st.revealRadius, 0, TWO_PI);
    ctx.clip();

    // Pre-compute all ring data once
    const rings = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const nearness = (i / RING_COUNT + st.tunnelDepth) % 1.0;
      const scale = FOV / (FOV + (1 - nearness) * DEPTH_RANGE);
      const dir = i % 2 === 0 ? 1 : -1;
      const rotation = dir * (st.elapsed / (50000 + i * 7000)) * TWO_PI;
      const colorIdx = Math.min(
        Math.floor((1 - nearness) * RING_COUNT),
        COLORS.length - 1,
      );
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
      ctx.strokeStyle = r.color.glow;
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
      ctx.globalAlpha = ((r.nearness - 0.6) / 0.4) * 0.12;
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
    ctx.strokeStyle = PALETTE.mark;
    ctx.globalAlpha = 0.035;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(st.sweepAngle) * Math.max(w, h) * 0.6,
      cy + Math.sin(st.sweepAngle) * Math.max(w, h) * 0.6,
    );
    ctx.stroke();

    // Dust particles
    const dust = st.dust;
    for (let i = 0; i < dust.length; i++) {
      const p = dust[i];
      p.y -= p.speed * dt;
      p.x += p.drift * dt;
      if (p.y < -0.02) {
        p.y = 1.02;
        p.x = Math.random();
      }
      if (p.x < -0.02 || p.x > 1.02) p.x = Math.random();
      ctx.fillStyle = DUST_COLORS[p.colorIdx];
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size, 0, TWO_PI);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
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
      isMobileRef.current = window.innerWidth <= 600;
    };
    resize();
    window.addEventListener("resize", resize);

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      draw(ctx, canvas.offsetWidth, canvas.offsetHeight, 0);
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    // Cap the redraw to ~30fps on phones. The ambient motion is slow enough that
    // halving the canvas work is invisible, but it's noticeably smoother on weak GPUs.
    const loop = (now) => {
      const elapsed = now - lastTime;
      if (elapsed >= (isMobileRef.current ? 33 : 0)) {
        lastTime = now;
        draw(
          ctx,
          canvas.offsetWidth,
          canvas.offsetHeight,
          Math.min(elapsed, 50),
        );
      }
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
