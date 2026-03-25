import { useRef, useEffect, useCallback } from "react";
import useTunnelGameAudio from "./useTunnelGameAudio";

/* ── constants ──────────────────────────────────────────── */
const FOV = 200;
const DEPTH_RANGE = 800;
const OBSTACLE_TYPES = [
  { text: "NaN", color: "#ff4444", speed: 1, points: 100 },
  { text: "SEGFAULT", color: "#ff2222", speed: 1.1, points: 200, dodges: true },
  { text: "404", color: "#ff8844", speed: 0.9, points: 150, wave: true },
  { text: "OVERFLOW", color: "#ffaa00", speed: 0.7, points: 300, big: true },
  { text: "null", color: "#ff6666", speed: 1.6, points: 250 },
  { text: "panic!", color: "#ff0044", speed: 1, points: 200, splits: true },
  { text: "E0502", color: "#ff66aa", speed: 0.9, points: 175 },
  { text: "SIGKILL", color: "#ff0000", speed: 2, points: 500 },
  { text: "OOM", color: "#cc0000", speed: 0.6, points: 400, big: true },
  { text: "ERR!", color: "#ff5533", speed: 1.2, points: 120 },
  { text: "REFUSED", color: "#ff7744", speed: 1.1, points: 130 },
  { text: "FATAL", color: "#ff3355", speed: 0.8, points: 280 },
  { text: "undef", color: "#ff5566", speed: 1.3, points: 140 },
  { text: "LEAK", color: "#dd4400", speed: 1.0, points: 160 },
  { text: "HANG", color: "#ff6600", speed: 0.5, points: 220 },
  { text: "RACE", color: "#ff44cc", speed: 1.8, points: 350 },
];

/* ── A-mark logo vertices (normalized to -1..1 from the SVG 0..512 viewBox) ── */
const LOGO_LINES = [
  // left beam
  { x1: -0.578, y1: 0.594, x2: 0, y2: -0.594 },
  // right beam
  { x1: 0.578, y1: 0.594, x2: 0, y2: -0.594 },
  // left foot
  { x1: -0.703, y1: 0.594, x2: -0.453, y2: 0.594 },
  // right foot
  { x1: 0.453, y1: 0.594, x2: 0.703, y2: 0.594 },
];

// Sine wave crossbar sample points (from SVG path, normalized)
const WAVE_PTS = [
  [-0.344, 0.172],
  [-0.219, -0.063],
  [-0.109, -0.063],
  [0, 0.172],
  [0.109, -0.063],
  [0.219, -0.063],
  [0.344, 0.172],
  // extra control-point-derived approx for smoothness
].map(([x, y]) => [(x / 0.344) * 0.344, y * 0.5]);

function depthScale(depth) {
  return FOV / (FOV + (1 - depth) * DEPTH_RANGE);
}

/* ── component ──────────────────────────────────────────── */
export default function TunnelGame({ tunnelRef, onExit }) {
  const isMobileRef = useRef(window.innerWidth <= 600);
  const canvasRef = useRef(null);
  const audio = useTunnelGameAudio();
  const stateRef = useRef(null);
  const keysRef = useRef({ left: false, right: false, fire: false });
  const touchRef = useRef({ left: false, right: false, fire: false });
  const animRef = useRef(null);

  /* ── init game state ── */
  const initState = useCallback(
    () => ({
      phase: "countdown", // countdown | playing | gameover
      countdownLeft: 3,
      countdownTimer: 0,
      player: { x: 0, invincibleUntil: 0, trail: [] },
      projectiles: [],
      obstacles: [],
      particles: [],
      score: 0,
      lives: 3,
      combo: 1.0,
      comboTimer: 0,
      hiScore: parseInt(localStorage.getItem("tunnelrun_hiscore") || "0", 10),
      spawnInterval: 1200,
      spawnTimer: 0,
      baseSpeed: 1.5,
      elapsed: 0,
      difficultyTick: 0,
      lastFireTime: 0,
      shakeUntil: 0,
      shakeIntensity: 0,
    }),
    [],
  );

  /* ── draw the A-mark ship ── */
  const drawShip = useCallback((ctx, cx, cy, size, alpha = 1, glow = true) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;
    const s = size;

    // Glow
    if (glow) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(0,229,255,0.6)";
    }
    ctx.strokeStyle = "#00E5FF";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw the A-frame beams and feet
    for (const l of LOGO_LINES) {
      ctx.beginPath();
      ctx.moveTo(l.x1 * s, l.y1 * s);
      ctx.lineTo(l.x2 * s, l.y2 * s);
      ctx.stroke();
    }

    // Draw sine wave crossbar
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    // Simplified sine wave
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (-0.344 + t * 0.688) * s;
      const y = Math.sin(t * Math.PI * 2.5) * 0.12 * s;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }, []);

  /* ── main game loop ── */
  const gameLoop = useCallback(
    (ctx, w, h, dt) => {
      const gs = stateRef.current;
      if (!gs) return;

      const cx = w / 2;
      const cy = h / 2;
      gs.elapsed += dt;

      // Screen shake offset
      let shakeX = 0,
        shakeY = 0;
      if (gs.elapsed < gs.shakeUntil) {
        shakeX = (Math.random() - 0.5) * gs.shakeIntensity;
        shakeY = (Math.random() - 0.5) * gs.shakeIntensity;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // ── COUNTDOWN ──
      if (gs.phase === "countdown") {
        gs.countdownTimer += dt;
        if (gs.countdownTimer >= 1000) {
          gs.countdownTimer -= 1000;
          gs.countdownLeft--;
          if (gs.countdownLeft > 0) {
            audio.playCountdown();
          } else if (gs.countdownLeft === 0) {
            audio.playGo();
          } else {
            gs.phase = "playing";
          }
        }

        // Draw countdown text
        ctx.font = `${isMobileRef.current ? 48 : 72}px 'Press Start 2P', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(0,229,255,0.8)";
        ctx.strokeStyle = "#00E5FF";
        ctx.lineWidth = 2;
        const countText =
          gs.countdownLeft > 0 ? String(gs.countdownLeft) : "COMPILE";
        ctx.strokeText(countText, cx, cy);
        ctx.fillStyle = "rgba(0,229,255,0.15)";
        ctx.fillText(countText, cx, cy);
        ctx.shadowBlur = 0;

        // Draw ship during countdown
        const shipY = h - (isMobileRef.current ? 60 : 80);
        drawShip(ctx, cx, shipY, isMobileRef.current ? 28 : 40);

        ctx.restore();
        return;
      }

      // ── GAME OVER ──
      if (gs.phase === "gameover") {
        // Still draw particles
        updateAndDrawParticles(ctx, gs, dt);

        ctx.font = `${isMobileRef.current ? 18 : 32}px 'Press Start 2P', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(255,34,34,0.8)";
        ctx.strokeStyle = "#ff2222";
        ctx.lineWidth = 2;
        ctx.strokeText("GAME OVER", cx, cy - 50);
        ctx.fillStyle = "rgba(255,34,34,0.2)";
        ctx.fillText("GAME OVER", cx, cy - 50);

        ctx.shadowBlur = 0;
        ctx.font = `${isMobileRef.current ? 8 : 14}px 'Press Start 2P', monospace`;
        ctx.fillStyle = "#00E5FF";
        ctx.fillText(`SCORE: ${gs.score}`, cx, cy + 10);
        ctx.fillStyle = gs.score >= gs.hiScore ? "#FFB800" : "#778899";
        ctx.fillText(
          `HI: ${gs.hiScore}`,
          cx,
          cy + (isMobileRef.current ? 30 : 40),
        );

        if (gs.score >= gs.hiScore) {
          ctx.font = `${isMobileRef.current ? 6 : 10}px 'Press Start 2P', monospace`;
          ctx.fillStyle = "#FFB800";
          ctx.fillText(
            "NEW HIGH SCORE",
            cx,
            cy + (isMobileRef.current ? 50 : 65),
          );
        }

        // Blink "press any key"
        if (Math.floor(gs.elapsed / 600) % 2 === 0) {
          ctx.font = `${isMobileRef.current ? 6 : 10}px 'Press Start 2P', monospace`;
          ctx.fillStyle = "#556";
          ctx.fillText(
            "PRESS ANY KEY TO RETURN",
            cx,
            cy + (isMobileRef.current ? 70 : 100),
          );
        }

        ctx.restore();
        return;
      }

      // ── PLAYING ──
      const input = {
        left: keysRef.current.left || touchRef.current.left,
        right: keysRef.current.right || touchRef.current.right,
        fire: keysRef.current.fire || touchRef.current.fire,
      };

      const shipSpeed = (isMobileRef.current ? 0.4 : 0.5) * dt;
      if (input.left) gs.player.x -= shipSpeed;
      if (input.right) gs.player.x += shipSpeed;
      gs.player.x = Math.max(-w / 2 + 30, Math.min(w / 2 - 30, gs.player.x));

      const shipX = cx + gs.player.x;
      const shipY = h - (isMobileRef.current ? 60 : 80);
      const shipSize = isMobileRef.current ? 28 : 40;

      // Engine trail
      gs.player.trail.unshift({ x: shipX, y: shipY, alpha: 0.4 });
      if (gs.player.trail.length > 4) gs.player.trail.pop();

      // Fire
      if (
        input.fire &&
        gs.elapsed - gs.lastFireTime > 150 &&
        gs.projectiles.length < 5
      ) {
        gs.projectiles.push({ x: gs.player.x, y: shipY, depth: 0.95 });
        gs.lastFireTime = gs.elapsed;
        audio.playLaser();
      }

      // Update projectiles (move toward center / deeper)
      for (let i = gs.projectiles.length - 1; i >= 0; i--) {
        const p = gs.projectiles[i];
        p.depth -= 0.002 * dt;
        // Converge x toward center
        p.x *= 0.997;
        p.y -= 0.3 * dt;
        if (p.depth < 0.05) gs.projectiles.splice(i, 1);
      }

      // Spawn obstacles
      gs.spawnTimer += dt;
      if (gs.spawnTimer >= gs.spawnInterval) {
        gs.spawnTimer = 0;
        const typeIdx = Math.floor(Math.random() * OBSTACLE_TYPES.length);
        // Weight rarer types
        const type = OBSTACLE_TYPES[typeIdx];
        const xSpread = (Math.random() - 0.5) * w * 0.6;
        gs.obstacles.push({
          ...type,
          x: xSpread,
          depth: 0.0,
          alive: true,
          wavePhase: Math.random() * Math.PI * 2,
          originalX: xSpread,
        });
      }

      // Difficulty ramp
      gs.difficultyTick += dt;
      if (gs.difficultyTick >= 10000) {
        gs.difficultyTick -= 10000;
        gs.spawnInterval = Math.max(350, gs.spawnInterval - 30);
        gs.baseSpeed += 0.08;
        gs.combo += 0.1;
        gs.comboTimer = gs.elapsed;
        audio.playCombo();
      }

      // Update obstacles
      const playerHitboxW = shipSize * 0.6;
      const playerHitboxTop = shipY - shipSize * 0.5;

      for (let i = gs.obstacles.length - 1; i >= 0; i--) {
        const o = gs.obstacles[i];
        o.depth += (gs.baseSpeed * (o.speed || 1) * dt) / 4000;

        // Wave behavior
        if (o.wave) {
          o.x = o.originalX + Math.sin(o.depth * 12 + o.wavePhase) * 80;
        }
        // Dodge behavior (after 60s)
        if (o.dodges && gs.elapsed > 60000 && o.depth > 0.7) {
          const dir = gs.player.x > o.x ? -1 : 1;
          o.x += dir * 0.15 * dt;
        }

        const scale = depthScale(o.depth);

        // Check if obstacle reached player plane
        if (o.depth >= 1.0 && o.alive) {
          const obstacleScreenX = cx + o.x * scale;
          const obstacleW = (o.big ? 160 : 100) * scale;

          // Collision check
          const dx = Math.abs(obstacleScreenX - shipX);
          if (
            dx < (playerHitboxW + obstacleW) / 2 &&
            gs.elapsed > gs.player.invincibleUntil
          ) {
            // HIT
            gs.lives--;
            gs.player.invincibleUntil = gs.elapsed + 2000;
            gs.combo = 1.0;
            gs.shakeUntil = gs.elapsed + 300;
            gs.shakeIntensity = 8;
            audio.playHit();
            spawnExplosion(gs, shipX, shipY, "#ff2222", 15);

            if (gs.lives <= 0) {
              gs.phase = "gameover";
              gs.hiScore = Math.max(gs.hiScore, gs.score);
              localStorage.setItem("tunnelrun_hiscore", String(gs.hiScore));
              audio.playGameOver();
              // Slow down tunnel
              if (tunnelRef?.current) tunnelRef.current.setSpeed(0.00008);
            }
          }

          o.alive = false;
        }

        // Dodged (past player)
        if (o.depth > 1.15) {
          if (o.alive) {
            gs.score += Math.round((o.points || 100) * gs.combo * 0.5);
            audio.playDodge();
          }
          gs.obstacles.splice(i, 1);
          continue;
        }

        // Check projectile collisions
        for (let j = gs.projectiles.length - 1; j >= 0; j--) {
          const p = gs.projectiles[j];
          const depthDiff = Math.abs(p.depth - o.depth);
          if (depthDiff < 0.08) {
            const pScale = depthScale(p.depth);
            const pScreenX = cx + p.x * pScale;
            const oScreenX = cx + o.x * scale;
            const hitDist = (o.big ? 80 : 50) * scale;
            if (Math.abs(pScreenX - oScreenX) < hitDist && o.alive) {
              // Destroy obstacle
              o.alive = false;
              gs.projectiles.splice(j, 1);
              gs.score += Math.round((o.points || 100) * gs.combo);
              audio.playExplosion();

              // Spawn text explosion particles
              const oDrawX = cx + o.x * scale;
              const oDrawY = cy + (shipY - cy) * o.depth;
              spawnTextExplosion(gs, oDrawX, oDrawY, o.text, o.color);

              // Splits behavior
              if (o.splits && o.depth < 0.9) {
                for (let s = 0; s < 2; s++) {
                  gs.obstacles.push({
                    text: "FRAGMENT",
                    color: o.color,
                    speed: o.speed * 1.3,
                    points: 50,
                    x: o.x + (s === 0 ? -40 : 40),
                    originalX: o.x + (s === 0 ? -40 : 40),
                    depth: o.depth,
                    alive: true,
                    wavePhase: Math.random() * Math.PI * 2,
                  });
                }
              }
              break;
            }
          }
        }
      }

      // ── DRAW ──

      // Draw obstacles (depth-sorted, farthest first)
      const sortedObs = gs.obstacles
        .filter((o) => o.alive)
        .sort((a, b) => a.depth - b.depth);
      for (const o of sortedObs) {
        if (!o.alive) continue;
        const scale = depthScale(o.depth);
        const oScreenX = cx + o.x * scale;
        const oScreenY = cy + (shipY - cy) * o.depth;
        const fontSize = Math.max(
          8,
          (o.big ? 52 : 38) * scale * (isMobileRef.current ? 0.8 : 1),
        );

        ctx.save();
        ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = 0.3 + o.depth * 0.7;
        ctx.shadowBlur = 6 + o.depth * 12;
        ctx.shadowColor = o.color;
        ctx.strokeStyle = o.color;
        ctx.lineWidth = 0.8 + o.depth * 0.8;
        ctx.strokeText(o.text, oScreenX, oScreenY);
        // Faint fill for readability at larger sizes
        if (o.depth > 0.25) {
          ctx.fillStyle = o.color + "30";
          ctx.fillText(o.text, oScreenX, oScreenY);
        }
        ctx.restore();
      }

      // Draw projectiles
      for (const p of gs.projectiles) {
        const scale = depthScale(p.depth);
        const pScreenX = cx + p.x * scale;
        const pScreenY = cy + (shipY - cy) * p.depth;
        const len = 12 * scale;

        ctx.save();
        ctx.strokeStyle = "#00FFD0";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0,255,208,0.8)";
        ctx.lineWidth = 2 * scale;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(pScreenX, pScreenY);
        ctx.lineTo(pScreenX, pScreenY - len);
        ctx.stroke();
        ctx.restore();
      }

      // Draw particles
      updateAndDrawParticles(ctx, gs, dt);

      // Draw engine trail
      for (let i = 1; i < gs.player.trail.length; i++) {
        const t = gs.player.trail[i];
        const trailSize = shipSize * (1 - i * 0.2);
        const alpha = t.alpha * (1 - i / gs.player.trail.length);
        drawShip(ctx, t.x, t.y + i * 4, trailSize * 0.6, alpha * 0.15, false);
      }

      // Draw player ship
      const invincible = gs.elapsed < gs.player.invincibleUntil;
      const shipAlpha = invincible
        ? Math.floor(gs.elapsed / 80) % 2 === 0
          ? 0.3
          : 0.9
        : 1;
      drawShip(ctx, shipX, shipY, shipSize, shipAlpha);

      // Engine exhaust particles
      if (Math.random() < 0.4) {
        gs.particles.push({
          x: shipX + (Math.random() - 0.5) * 8,
          y: shipY + shipSize * 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.1 + Math.random() * 0.15,
          alpha: 0.5,
          life: 400,
          maxLife: 400,
          char: null,
          color: "#00E5FF",
          size: 1 + Math.random() * 2,
        });
      }

      // ── HUD ──
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.font = `${isMobileRef.current ? 8 : 12}px 'Press Start 2P', monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Score
      ctx.fillStyle = "#00E5FF";
      ctx.fillText(`SCORE: ${String(gs.score).padStart(6, "0")}`, 16, 16);

      // Hi score
      ctx.textAlign = "right";
      ctx.fillStyle = "#778899";
      ctx.fillText(`HI: ${String(gs.hiScore).padStart(6, "0")}`, w - 16, 16);

      // Combo
      if (gs.combo > 1.0) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFB800";
        const comboText = `COMBO x${gs.combo.toFixed(1)}`;
        ctx.fillText(comboText, cx, 16);
      }

      // Lives (small ship icons)
      ctx.textAlign = "left";
      for (let i = 0; i < gs.lives; i++) {
        drawShip(ctx, 24 + i * 28, h - 24, 10, 0.7, false);
      }

      // Scanline overlay (single pattern fill instead of per-line rects)
      ctx.globalAlpha = 0.03;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      for (let y = 0; y < h; y += 3) {
        ctx.rect(0, y, w, 1);
      }
      ctx.fill();

      ctx.restore();
      ctx.restore(); // Pop shake transform
    },
    [audio, drawShip, tunnelRef],
  );

  /* ── mount / unmount ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTime = performance.now();

    stateRef.current = initState();

    // Speed up tunnel
    if (tunnelRef?.current) tunnelRef.current.setSpeed(0.0008);

    // Play first countdown beep
    audio.playCountdown();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      isMobileRef.current = window.innerWidth <= 600;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (now) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      gameLoop(ctx, canvas.offsetWidth, canvas.offsetHeight, dt);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    // Keyboard
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        keysRef.current.fire = true;
      }
      // Game over → exit on any key
      if (
        stateRef.current?.phase === "gameover" &&
        stateRef.current.elapsed > stateRef.current.shakeUntil + 1000
      ) {
        onExit?.();
      }
    };
    const onKeyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d")
        keysRef.current.right = false;
      if (e.key === " " || e.key === "ArrowUp") keysRef.current.fire = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (tunnelRef?.current) tunnelRef.current.setSpeed(0.00008);
    };
  }, [gameLoop, initState, tunnelRef, audio, onExit]);

  /* ── touch controls (dual-thumb: left half = slide to steer, right half = fire) ── */
  const touchOriginRef = useRef(null); // tracks where left-side touch started

  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      const half = window.innerWidth / 2;
      for (const touch of e.changedTouches) {
        if (touch.clientX < half) {
          // Left half — record anchor for relative slide steering
          touchOriginRef.current = {
            id: touch.identifier,
            startX: touch.clientX,
            lastX: touch.clientX,
          };
        } else {
          // Right half — fire
          touchRef.current.fire = true;
        }
      }
      // Game over exit
      if (stateRef.current?.phase === "gameover") onExit?.();
    },
    [onExit],
  );

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const origin = touchOriginRef.current;
    if (!origin) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier === origin.id) {
        const dx = touch.clientX - origin.lastX;
        const deadzone = 2;
        touchRef.current.left = dx < -deadzone;
        touchRef.current.right = dx > deadzone;
        origin.lastX = touch.clientX;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    const origin = touchOriginRef.current;
    // Check if the left-side touch was released
    if (origin) {
      const stillDown = Array.from(e.touches).some(
        (t) => t.identifier === origin.id,
      );
      if (!stillDown) {
        touchOriginRef.current = null;
        touchRef.current.left = false;
        touchRef.current.right = false;
      }
    }
    // Check if all right-side touches released
    const half = window.innerWidth / 2;
    const rightStillDown = Array.from(e.touches).some((t) => t.clientX >= half);
    if (!rightStillDown) touchRef.current.fire = false;
  }, []);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {/* Mobile touch zone hints - fade after 3s */}
      {isMobileRef.current && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-around",
            pointerEvents: "none",
            opacity: 0.4,
            animation: "fadeHints 4s ease-out forwards",
          }}
        >
          <span
            style={{
              color: "#00E5FF",
              fontSize: 10,
              fontFamily: "'Press Start 2P'",
            }}
          >
            {"< SLIDE TO STEER >"}
          </span>
          <span
            style={{
              color: "#00FFD0",
              fontSize: 10,
              fontFamily: "'Press Start 2P'",
            }}
          >
            TAP TO FIRE
          </span>
        </div>
      )}
    </div>
  );
}

/* ── helpers (outside component for perf) ──────────────── */

function spawnExplosion(gs, x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = 0.1 + Math.random() * 0.3;
    gs.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      life: 500 + Math.random() * 300,
      maxLife: 800,
      char: null,
      color,
      size: 1.5 + Math.random() * 2.5,
    });
  }
}

function spawnTextExplosion(gs, x, y, text, color) {
  const chars = text.split("");
  const len = Math.min(chars.length, 20); // cap for performance
  for (let i = 0; i < len; i++) {
    const angle = (Math.PI * 2 * i) / len + Math.random() * 0.5;
    const speed = 0.08 + Math.random() * 0.25;
    gs.particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      life: 600 + Math.random() * 400,
      maxLife: 1000,
      char: chars[i],
      color,
      size: 8 + Math.random() * 4,
      rotation: (Math.random() - 0.5) * 0.01,
      rot: Math.random() * Math.PI * 2,
    });
  }
}

function updateAndDrawParticles(ctx, gs, dt) {
  for (let i = gs.particles.length - 1; i >= 0; i--) {
    const p = gs.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
    if (p.rotation) p.rot += p.rotation * dt;

    if (p.life <= 0) {
      gs.particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    if (p.char) {
      // Text character particle
      ctx.translate(p.x, p.y);
      if (p.rot) ctx.rotate(p.rot);
      ctx.font = `${p.size}px 'Press Start 2P', monospace`;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.char, 0, 0);
    } else {
      // Dot particle
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
