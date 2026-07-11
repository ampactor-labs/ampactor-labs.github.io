import { useRef, useEffect, useCallback, useState } from "react";
import useTunnelGameAudio from "./useTunnelGameAudio";
import {
  LB_MAX,
  LETTERS,
  loadLeaderboard,
  saveLeaderboard,
  qualifies,
  insertScore,
  dispChar,
  fetchGlobalLeaderboard,
  qualifiesGlobal,
  buildScoreIssueUrl,
} from "./tunnelLeaderboard";
import {
  FIRST_BOSS_AT,
  BOSS_DEPTH,
  WARNING_MS,
  ENTER_MS,
  DYING_MS,
  ENRAGE_RATE,
  makeBoss,
  bossSize,
  bossEnraged,
  bossFireInterval,
  bossKillBonus,
  nextBossScore,
  bossLabel,
  bossVolley,
} from "./tunnelBoss";

const AMBER = "#d8a657";

// Debug hook: ?boss=<score> summons the first ANOMALY early. Used for
// balance tuning and the headless E2E run; harmless in normal play.
const DEBUG_BOSS_AT = (() => {
  try {
    const v = new URLSearchParams(window.location.search).get("boss");
    return v ? Math.max(1, parseInt(v, 10) || 1) : null;
  } catch {
    return null;
  }
})();

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
  const lastPhaseRef = useRef("countdown");

  // HTML-overlay mirrors of game state (refs are the source of truth; these
  // exist only so the overlay re-renders when the phase changes / on entry).
  const [uiPhase, setUiPhase] = useState("countdown");
  const [entry, setEntry] = useState(null); // { score, rank } when typing initials
  const [globalOffer, setGlobalOffer] = useState(null); // { initials, score, rank } — global submit panel

  // Global top-10 (public/tunnel-leaderboard.json). Fetched once; null while
  // loading or offline, in which case everything falls back to the local board.
  const globalBoardRef = useRef(null);

  // Refs that always point at the latest closures, so the mount effect can run
  // exactly ONCE and never tear the game down on a parent re-render. This is
  // what keeps the countdown from "glitching" (resetting) mid-count.
  const gameLoopRef = useRef(null);
  const onExitRef = useRef(onExit);
  const endRunRef = useRef(null);
  onExitRef.current = onExit;

  /* ── init game state ── */
  const initState = useCallback(() => {
    const leaderboard = loadLeaderboard();
    const globalBoard = globalBoardRef.current;
    // The "reigning champion" line shows the score to beat — global champ
    // when known and higher, otherwise the local best.
    const champ = [globalBoard?.[0], leaderboard[0]]
      .filter(Boolean)
      .sort((a, b) => b.s - a.s)[0];
    return {
      phase: "countdown", // countdown | playing | paused | gameover
      countdownLeft: 3,
      countdownTimer: 0,
      countdownBeeped: false,
      player: { x: 0, invincibleUntil: 0, trail: [] },
      projectiles: [],
      obstacles: [],
      particles: [],
      score: 0,
      lives: 3,
      combo: 1.0,
      comboTimer: 0,
      leaderboard,
      globalBoard,
      displayBoard: null, // { title, rows } chosen at game over
      boss: null, // live ANOMALY state (see tunnelBoss.js)
      bossesDown: 0,
      nextBossAt: DEBUG_BOSS_AT ?? FIRST_BOSS_AT,
      hiScore: champ?.s || 0,
      hiInitials: champ?.i || "",
      newEntry: null, // reference to the freshly-inserted leaderboard row
      entering: false, // true while the initials modal is open
      offering: false, // true while the global-submit panel is open
      gameoverAt: 0,
      spawnInterval: 1200,
      spawnTimer: 0,
      baseSpeed: 1.5,
      elapsed: 0,
      difficultyTick: 0,
      lastFireTime: 0,
      shakeUntil: 0,
      shakeIntensity: 0,
    };
  }, []);

  /* ── end the current run (death, or manual quit via ESC/B/✕) ── */
  const endRun = useCallback(
    (gs) => {
      if (!gs || gs.phase === "gameover") return;
      audio.playGameOver();
      if (tunnelRef?.current) tunnelRef.current.setSpeed(0.00008);
      gs.phase = "gameover";
      gs.gameoverAt = gs.elapsed;
      keysRef.current.left =
        keysRef.current.right =
        keysRef.current.fire =
          false;
      const localQ = qualifies(gs.leaderboard, gs.score);
      const globalQ = qualifiesGlobal(gs.globalBoard, gs.score);
      // Show the board this run is headed for; plain global (or local) view
      // otherwise. The pending row is merged in at initials submit.
      if (globalQ || (!localQ && gs.globalBoard)) {
        gs.displayBoard = { title: "- GLOBAL TOP 10 -", rows: gs.globalBoard };
      } else {
        gs.displayBoard = {
          title: gs.globalBoard ? "- LOCAL HIGH SCORES -" : "- HIGH SCORES -",
          rows: gs.leaderboard,
        };
      }
      if (localQ || globalQ) {
        const board = globalQ ? gs.globalBoard : gs.leaderboard;
        const rank = board.filter((e) => e.s > gs.score).length + 1;
        gs.entering = true;
        setEntry({ score: gs.score, rank, global: globalQ });
      } else {
        gs.entering = false;
      }
    },
    [audio, tunnelRef],
  );
  endRunRef.current = endRun;

  /* ── commit the typed initials into the board ── */
  const handleSubmitInitials = useCallback(
    (initials) => {
      const gs = stateRef.current;
      if (!gs || !gs.entering) return; // guard against a double-submit
      if (qualifies(gs.leaderboard, gs.score)) {
        const { list, row } = insertScore(gs.leaderboard, initials, gs.score);
        gs.leaderboard = list;
        saveLeaderboard(gs.leaderboard);
        gs.newEntry = row;
        gs.displayBoard = {
          title: gs.globalBoard ? "- LOCAL HIGH SCORES -" : "- HIGH SCORES -",
          rows: gs.leaderboard,
        };
      }
      // Global qualification wins the display: show the run merged into the
      // global list (pending until the GitHub issue lands) and open the offer.
      if (qualifiesGlobal(gs.globalBoard, gs.score)) {
        const { list, row } = insertScore(gs.globalBoard, initials, gs.score);
        gs.displayBoard = { title: "- GLOBAL TOP 10 -", rows: list };
        gs.newEntry = row;
        gs.offering = true;
        setGlobalOffer({
          initials,
          score: gs.score,
          rank: list.indexOf(row) + 1,
        });
      }
      const champ = [gs.globalBoard?.[0], gs.leaderboard[0]]
        .filter(Boolean)
        .sort((a, b) => b.s - a.s)[0];
      if (champ) {
        gs.hiScore = champ.s;
        gs.hiInitials = champ.i;
      }
      gs.entering = false;
      gs.gameoverAt = gs.elapsed; // restart the "press any key" read buffer
      setEntry(null);
      audio.playGo();
    },
    [audio],
  );

  /* ── close the global-submit panel ── */
  const dismissGlobalOffer = useCallback(() => {
    const gs = stateRef.current;
    if (gs) {
      gs.offering = false;
      gs.gameoverAt = gs.elapsed;
    }
    setGlobalOffer(null);
  }, []);

  /* ── load the global board once; fold it into live state when it lands ── */
  useEffect(() => {
    let alive = true;
    fetchGlobalLeaderboard().then((board) => {
      if (!alive || !board) return;
      globalBoardRef.current = board;
      const gs = stateRef.current;
      if (!gs) return;
      gs.globalBoard = board;
      if (board[0] && board[0].s > gs.hiScore) {
        gs.hiScore = board[0].s;
        gs.hiInitials = board[0].i;
      }
      // Already on a plain game-over board (no fresh entry being shown)?
      // Upgrade the view to the global list.
      if (
        gs.phase === "gameover" &&
        !gs.entering &&
        !gs.offering &&
        !gs.newEntry
      ) {
        gs.displayBoard = { title: "- GLOBAL TOP 10 -", rows: board };
      }
    });
    return () => {
      alive = false;
    };
  }, []);

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

    // Sine-wave crossbar, matched to the SVG mark: two full periods rising
    // first, seated at y+0.172 (the logo's bar sits below center), amplitude
    // 0.094, stroke 0.56× the beams (20/36 in the source mark).
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (-0.344 + t * 0.688) * s;
      const y = (0.172 - Math.sin(t * Math.PI * 4) * 0.094) * s;
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

      // Keep the HTML overlay's phase mirror current (fires only on change).
      if (gs.phase !== lastPhaseRef.current) {
        lastPhaseRef.current = gs.phase;
        setUiPhase(gs.phase);
      }

      const cx = w / 2;
      const cy = h / 2;
      const mobile = isMobileRef.current;

      // ── PAUSED ── (freeze time + the battlefield; show a pause card)
      if (gs.phase === "paused") {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(8,10,14,0.6)";
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#00E5FF";
        ctx.shadowBlur = 18;
        ctx.shadowColor = "rgba(0,229,255,0.7)";
        ctx.font = `${mobile ? 22 : 34}px 'Press Start 2P', monospace`;
        ctx.fillText("PAUSED", cx, cy - (mobile ? 14 : 20));
        ctx.shadowBlur = 0;
        ctx.font = `${mobile ? 7 : 10}px 'Press Start 2P', monospace`;
        ctx.fillStyle = "rgba(143,160,179,0.8)";
        ctx.fillText("P / TAP TO RESUME", cx, cy + (mobile ? 16 : 24));
        ctx.fillStyle = "rgba(143,160,179,0.5)";
        ctx.fillText("ESC / B TO END", cx, cy + (mobile ? 34 : 48));
        return;
      }

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
        if (!gs.countdownBeeped) {
          audio.playCountdown();
          gs.countdownBeeped = true;
        }
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
        ctx.font = `${mobile ? 48 : 72}px 'Press Start 2P', monospace`;
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
        const shipY = h - (mobile ? 60 : 80);
        drawShip(ctx, cx, shipY, mobile ? 28 : 40);

        // Controls narration
        drawControlsLegend(ctx, cx, h, mobile);

        ctx.restore();
        return;
      }

      // ── GAME OVER ──
      if (gs.phase === "gameover") {
        // Still draw lingering explosion particles
        updateAndDrawParticles(ctx, gs, dt);
        drawGameOver(ctx, gs, w, h, mobile);
        ctx.restore();
        return;
      }

      // ── PLAYING ──
      const input = {
        left: keysRef.current.left || touchRef.current.left,
        right: keysRef.current.right || touchRef.current.right,
        fire: keysRef.current.fire || touchRef.current.fire,
      };

      const shipSpeed = (mobile ? 0.4 : 0.5) * dt;
      if (input.left) gs.player.x -= shipSpeed;
      if (input.right) gs.player.x += shipSpeed;
      gs.player.x = Math.max(-w / 2 + 30, Math.min(w / 2 - 30, gs.player.x));

      const shipX = cx + gs.player.x;
      const shipY = h - (mobile ? 60 : 80);
      const shipSize = mobile ? 28 : 40;

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

      // Spawn obstacles — the ambient spawner yields while ANOMALY holds the
      // tunnel; every threat during a boss comes from its volleys.
      if (!gs.boss) {
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
      }

      // Difficulty ramp
      gs.difficultyTick += dt;
      if (gs.difficultyTick >= 10000) {
        gs.difficultyTick -= 10000;
        // The spawn floor sinks with every ANOMALY killed — the ramp never
        // fully flattens on a long run.
        const spawnFloor = Math.max(220, 350 - 40 * gs.bossesDown);
        gs.spawnInterval = Math.max(spawnFloor, gs.spawnInterval - 30);
        gs.baseSpeed += 0.08;
        gs.combo += 0.1;
        gs.comboTimer = gs.elapsed;
        audio.playCombo();
      }

      // ── BOSS: ANOMALY ──
      if (!gs.boss && gs.score >= gs.nextBossAt) {
        gs.boss = makeBoss(gs.bossesDown + 1);
        audio.playBossAlert();
        // Tunnel surges while ANOMALY holds it (normal in-game speed 0.0008)
        if (tunnelRef?.current) tunnelRef.current.setSpeed(0.0016);
      }
      if (gs.boss) {
        const b = gs.boss;
        b.timer += dt;
        if (b.phase === "warning") {
          if (b.timer >= WARNING_MS) {
            b.phase = "enter";
            b.timer = 0;
          }
        } else if (b.phase === "enter") {
          b.depth = 0.05 + (BOSS_DEPTH - 0.05) * Math.min(1, b.timer / ENTER_MS);
          if (b.timer >= ENTER_MS) {
            b.phase = "fight";
            b.timer = 0;
            b.lastFire = gs.elapsed;
          }
        } else if (b.phase === "fight") {
          b.x = Math.sin(gs.elapsed * 0.0007 + b.wobblePhase) * w * 0.22;
          // Below 30% hp it enrages: faster volleys until it dies.
          const interval =
            bossFireInterval(b.level) * (bossEnraged(b) ? ENRAGE_RATE : 1);
          if (gs.elapsed - b.lastFire >= interval) {
            b.lastFire = gs.elapsed;
            gs.obstacles.push(
              ...bossVolley(b.volleyIdx++, b.x, gs.player.x, w, b.level),
            );
            audio.playLaser();
          }
          // Projectiles vs the boss body
          const bScale = depthScale(b.depth);
          const bScreenX = cx + b.x * bScale;
          const bScreenY = cy + (shipY - cy) * b.depth;
          const hitW = 0.6 * bossSize(b.level, mobile) * bScale;
          for (let j = gs.projectiles.length - 1; j >= 0; j--) {
            const p = gs.projectiles[j];
            if (Math.abs(p.depth - b.depth) < 0.06) {
              const pScreenX = cx + p.x * depthScale(p.depth);
              if (Math.abs(pScreenX - bScreenX) < hitW) {
                gs.projectiles.splice(j, 1);
                b.hp--;
                b.hitFlash = gs.elapsed;
                gs.score += Math.round(5 * gs.combo);
                spawnExplosion(gs, pScreenX, bScreenY, "#ff2266", 4);
                audio.playExplosion();
                if (b.hp <= 0) {
                  b.phase = "dying";
                  b.timer = 0;
                  audio.playBossDown();
                }
              }
            }
          }
        } else if (b.phase === "dying") {
          if (b.timer >= DYING_MS) {
            const bScale = depthScale(b.depth);
            spawnTextExplosion(
              gs,
              cx + b.x * bScale,
              cy + (shipY - cy) * b.depth,
              "SEGFAULT",
              "#ff2266",
            );
            gs.score += bossKillBonus(b.level);
            gs.bossesDown++;
            gs.combo += 0.5;
            gs.comboTimer = gs.elapsed;
            gs.nextBossAt = nextBossScore(gs.score, b.level);
            // Every kill leaves the tunnel permanently meaner.
            gs.baseSpeed += 0.15;
            gs.shakeUntil = gs.elapsed + 500;
            gs.shakeIntensity = 10;
            gs.boss = null;
            if (tunnelRef?.current) tunnelRef.current.setSpeed(0.0008);
          }
        }
      }

      // Update obstacles
      const playerHitboxW = shipSize * 0.6;

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

        // Check if obstacle reached player plane — exactly once per obstacle.
        // A miss pays the dodge bonus here (the old code cleared `alive`
        // unconditionally, so the bonus below 1.15 was unreachable) and the
        // obstacle stays drawn while it flies past.
        if (o.depth >= 1.0 && o.alive && !o.crossed) {
          o.crossed = true;
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
            o.alive = false;

            if (gs.lives <= 0) {
              endRun(gs);
            }
          } else {
            gs.score += Math.round((o.points || 100) * gs.combo * 0.5);
            audio.playDodge();
          }
        }

        // Past the player — retire it
        if (o.depth > 1.15) {
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

      // Draw ANOMALY (deepest layer — obstacles and shots overdraw it)
      if (gs.boss) {
        drawBoss(ctx, gs.boss, cx, cy, shipY, w, gs.elapsed, mobile);
      }

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
          (o.big ? 52 : 38) * scale * (mobile ? 0.8 : 1),
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
      ctx.font = `${mobile ? 8 : 12}px 'Press Start 2P', monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Score
      ctx.fillStyle = "#00E5FF";
      ctx.fillText(`SCORE: ${String(gs.score).padStart(6, "0")}`, 16, 16);

      // ANOMALY health bar (fight + dying); flashes orange while enraged
      if (gs.boss && (gs.boss.phase === "fight" || gs.boss.phase === "dying")) {
        const b = gs.boss;
        const enraged = bossEnraged(b);
        const barColor =
          enraged && Math.floor(gs.elapsed / 150) % 2 === 0
            ? "#ff6600"
            : "#ff2266";
        const barW = mobile ? 150 : 240;
        const barH = mobile ? 5 : 7;
        const barY = mobile ? 42 : 52;
        ctx.textAlign = "center";
        ctx.font = `${mobile ? 7 : 9}px 'Press Start 2P', monospace`;
        ctx.fillStyle = barColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255,34,102,0.7)";
        ctx.fillText(
          enraged ? `${bossLabel(b.level)} !!` : bossLabel(b.level),
          cx,
          barY - (mobile ? 12 : 16),
        );
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,34,102,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - barW / 2, barY, barW, barH);
        const hpFrac = Math.max(0, b.hp / b.maxHp);
        if (hpFrac > 0) {
          ctx.fillStyle = barColor;
          ctx.shadowBlur = 6;
          ctx.shadowColor = "rgba(255,34,102,0.8)";
          ctx.fillRect(
            cx - barW / 2 + 1,
            barY + 1,
            (barW - 2) * hpFrac,
            barH - 2,
          );
          ctx.shadowBlur = 0;
        }
        ctx.textAlign = "left";
      }

      // Hi score (with the reigning champion's initials)
      ctx.textAlign = "right";
      ctx.fillStyle = "#778899";
      const hiText = `HI: ${String(gs.hiScore).padStart(6, "0")}${
        gs.hiInitials ? " " + gs.hiInitials : ""
      }`;
      ctx.fillText(hiText, w - 16, 16);

      // Combo
      if (gs.combo > 1.0) {
        ctx.textAlign = "center";
        ctx.fillStyle = AMBER;
        const comboText = `COMBO x${gs.combo.toFixed(1)}`;
        ctx.fillText(comboText, cx, 16);
      }

      // Lives (small ship icons)
      ctx.textAlign = "left";
      for (let i = 0; i < gs.lives; i++) {
        drawShip(ctx, 24 + i * 28, h - 24, 10, 0.7, false);
      }

      // Persistent controls hint (desktop — phones get on-screen buttons)
      if (!mobile) {
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.font = `8px 'Press Start 2P', monospace`;
        ctx.fillStyle = "rgba(143,160,179,0.28)";
        ctx.fillText(
          "◄ ► MOVE  ·  SPACE FIRE  ·  ESC/B END  ·  P PAUSE",
          cx,
          h - 8,
        );
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
    [audio, drawShip, endRun, tunnelRef],
  );
  gameLoopRef.current = gameLoop;

  /* ── mount / unmount (runs ONCE; the loop & handlers call latest via refs) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let lastTime = performance.now();

    stateRef.current = initState();

    // Speed up tunnel
    if (tunnelRef?.current) tunnelRef.current.setSpeed(0.0008);

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
      const elapsed = now - lastTime;
      // Cap the game to ~60fps on phones. Motion is dt-based so speed is
      // unchanged; this just stops a 120Hz panel from running the
      // shadowBlur-heavy render twice as often as it needs to. Desktop is
      // left uncapped.
      const minInterval = isMobileRef.current ? 15 : 0;
      if (elapsed >= minInterval) {
        lastTime = now;
        gameLoopRef.current?.(
          ctx,
          canvas.offsetWidth,
          canvas.offsetHeight,
          Math.min(elapsed, 50),
        );
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    // Keyboard — branches on the live phase from stateRef
    const onKeyDown = (e) => {
      const gs = stateRef.current;
      // Initials modal / global-submit panel own the keyboard while open
      if (!gs || gs.entering || gs.offering) return;
      const k = e.key;

      if (gs.phase === "countdown") {
        if (k === "Escape" || k === "b" || k === "B") onExitRef.current?.();
        return;
      }

      if (gs.phase === "gameover") {
        if (gs.elapsed - (gs.gameoverAt || 0) > 800) onExitRef.current?.();
        return;
      }

      if (gs.phase === "paused") {
        if (k === "Escape" || k === "b" || k === "B") endRunRef.current?.(gs);
        else if (k === "p" || k === "P" || k === "Enter" || k === " ") {
          e.preventDefault();
          gs.phase = "playing";
        }
        return;
      }

      // playing
      if (k === "ArrowLeft" || k === "a" || k === "A")
        keysRef.current.left = true;
      if (k === "ArrowRight" || k === "d" || k === "D")
        keysRef.current.right = true;
      if (k === " " || k === "ArrowUp") {
        e.preventDefault();
        keysRef.current.fire = true;
      }
      if (k === "Escape" || k === "b" || k === "B") {
        endRunRef.current?.(gs);
      } else if (k === "p" || k === "P") {
        gs.phase = "paused";
        keysRef.current.left =
          keysRef.current.right =
          keysRef.current.fire =
            false;
      }
    };
    const onKeyUp = (e) => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A")
        keysRef.current.left = false;
      if (k === "ArrowRight" || k === "d" || k === "D")
        keysRef.current.right = false;
      if (k === " " || k === "ArrowUp") keysRef.current.fire = false;
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
  }, [initState, tunnelRef]);

  /* ── touch controls (dual-thumb: left half = slide to steer, right half = fire) ── */
  const touchOriginRef = useRef(null); // tracks where left-side touch started

  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      const gs = stateRef.current;
      if (!gs || gs.entering || gs.offering) return;

      if (gs.phase === "paused") {
        gs.phase = "playing";
        return;
      }
      if (gs.phase === "gameover") {
        if (gs.elapsed - (gs.gameoverAt || 0) > 800) onExit?.();
        return;
      }
      if (gs.phase !== "playing") return; // ignore steering during countdown

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
    },
    [onExit],
  );

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const origin = touchOriginRef.current;
    if (!origin) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier === origin.id) {
        const dx = touch.clientX - origin.startX;
        const deadzone = 10;
        touchRef.current.left = dx < -deadzone;
        touchRef.current.right = dx > deadzone;
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

  // ✕ END / ❚❚ PAUSE overlay button presses
  const handlePauseButton = useCallback(() => {
    const gs = stateRef.current;
    if (!gs) return;
    if (gs.phase === "playing") {
      gs.phase = "paused";
      keysRef.current.left =
        keysRef.current.right =
        keysRef.current.fire =
          false;
    } else if (gs.phase === "paused") {
      gs.phase = "playing";
    }
  }, []);

  const handleEndButton = useCallback(() => {
    const gs = stateRef.current;
    if (!gs) return;
    if (gs.phase === "playing" || gs.phase === "paused")
      endRunRef.current?.(gs);
    else onExitRef.current?.();
  }, []);

  const showControls =
    !entry &&
    (uiPhase === "countdown" || uiPhase === "playing" || uiPhase === "paused");

  return (
    <>
      {/* canvas + touch steering layer */}
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
        {/* Mobile touch zone hints - fade after 4s */}
        {isMobileRef.current && uiPhase === "countdown" && (
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

      {/* PAUSE / END overlay buttons (also serve as control narration) */}
      {showControls && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: 16,
            display: "flex",
            gap: 8,
            padding: 12,
            paddingTop: "calc(env(safe-area-inset-top) + 12px)",
            pointerEvents: "none",
          }}
        >
          <OverlayButton
            label={uiPhase === "paused" ? "▶ RESUME" : "❚❚ PAUSE"}
            color="#00E5FF"
            onPress={handlePauseButton}
          />
          <OverlayButton
            label="✕ END"
            color="#ff5a6a"
            onPress={handleEndButton}
          />
        </div>
      )}

      {/* Galaga-style initials entry */}
      {entry && (
        <InitialsEntry
          score={entry.score}
          rank={entry.rank}
          global={entry.global}
          color={AMBER}
          onSubmit={handleSubmitInitials}
        />
      )}

      {/* Global top-10 submission — hands the run to a prefilled GitHub issue */}
      {globalOffer && (
        <GlobalSubmitPanel offer={globalOffer} onDismiss={dismissGlobalOffer} />
      )}
    </>
  );
}

/* ── overlay button (touch + mouse, never bubbles into steering) ── */
function OverlayButton({ label, color, onPress }) {
  return (
    <button
      type="button"
      aria-label={label.replace(/[^A-Za-z ]/g, "").trim()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
      style={{
        pointerEvents: "auto",
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        letterSpacing: "0.06em",
        padding: "8px 10px",
        borderRadius: 6,
        background: "rgba(10,14,20,0.62)",
        border: `1.5px solid ${color}59`,
        color,
        cursor: "pointer",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        backdropFilter: "blur(2px)",
      }}
    >
      {label}
    </button>
  );
}

/* ── global submit panel — the score travels as a prefilled GitHub issue ── */
function GlobalSubmitPanel({ offer, onDismiss }) {
  const mobile = window.innerWidth <= 600;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: mobile ? 84 : 110,
        transform: "translateX(-50%)",
        zIndex: 20,
        width: mobile ? "calc(100% - 32px)" : 470,
        maxWidth: 470,
        background: "rgba(10,12,10,0.94)",
        border: `1.5px solid ${AMBER}88`,
        borderRadius: 8,
        boxShadow: `0 0 24px ${AMBER}33`,
        padding: mobile ? "14px 14px" : "16px 20px",
        textAlign: "center",
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      <div
        style={{
          fontSize: mobile ? 10 : 12,
          color: AMBER,
          letterSpacing: "0.08em",
          textShadow: `0 0 12px ${AMBER}66`,
        }}
      >
        GLOBAL RANK #{offer.rank}
      </div>
      <div
        style={{
          fontSize: mobile ? 6 : 7,
          color: "#8fa0b3",
          lineHeight: 2,
          marginTop: 8,
          letterSpacing: "0.06em",
        }}
      >
        PUT IT ON THE PUBLIC BOARD — A GITHUB ISSUE CARRIES THE SCORE, A BOT
        COMMITS IT TO THE REPO
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <a
          href={buildScoreIssueUrl(offer.initials, offer.score)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: mobile ? 8 : 9,
            fontFamily: "inherit",
            color: "#1a1410",
            background: AMBER,
            borderRadius: 5,
            padding: "10px 12px",
            textDecoration: "none",
            letterSpacing: "0.06em",
            boxShadow: `0 0 14px ${AMBER}66`,
          }}
        >
          SUBMIT VIA GITHUB
        </a>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            fontSize: mobile ? 8 : 9,
            fontFamily: "inherit",
            color: "#8fa0b3",
            background: "transparent",
            border: "1.5px solid rgba(143,160,179,0.4)",
            borderRadius: 5,
            padding: "10px 12px",
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          DISMISS
        </button>
      </div>
    </div>
  );
}

/* ── Galaga-style initials entry modal (HTML; keyboard + tap) ── */
function InitialsEntry({ score, rank, global, color, onSubmit }) {
  const [chars, setChars] = useState([0, 0, 0]);
  const [slot, setSlot] = useState(0);
  const charsRef = useRef(chars);
  const slotRef = useRef(slot);
  charsRef.current = chars;
  slotRef.current = slot;
  const mobile = window.innerWidth <= 600;

  const moveSlot = (d) => setSlot((s) => Math.min(2, Math.max(0, s + d)));
  const cycleAt = (i, dir) => {
    setSlot(i);
    setChars((c) => {
      const n = [...c];
      n[i] = (n[i] + dir + LETTERS.length) % LETTERS.length;
      return n;
    });
  };
  const setLetterAt = (i, idx) =>
    setChars((c) => {
      const n = [...c];
      n[i] = idx;
      return n;
    });
  const submit = () =>
    onSubmit(charsRef.current.map((i) => LETTERS[i]).join(""));

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (k === "ArrowLeft") {
        e.preventDefault();
        moveSlot(-1);
      } else if (k === "ArrowRight") {
        e.preventDefault();
        moveSlot(1);
      } else if (k === "ArrowUp") {
        e.preventDefault();
        cycleAt(slotRef.current, 1);
      } else if (k === "ArrowDown") {
        e.preventDefault();
        cycleAt(slotRef.current, -1);
      } else if (k === "Enter") {
        e.preventDefault();
        submit();
      } else if (k === "Backspace") {
        e.preventDefault();
        moveSlot(-1);
      } else if (k === " ") {
        e.preventDefault();
        if (slotRef.current === 2) submit();
        else moveSlot(1);
      } else if (k.length === 1) {
        const idx = LETTERS.indexOf(k.toUpperCase());
        if (idx >= 0) {
          setLetterAt(slotRef.current, idx);
          if (slotRef.current < 2) moveSlot(1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const press = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const chev = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: mobile ? 14 : 16,
    width: mobile ? 44 : 52,
    height: mobile ? 34 : 38,
    borderRadius: 6,
    background: "rgba(216,166,87,0.08)",
    border: `1.5px solid ${color}55`,
    color,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: mobile ? 12 : 16,
        padding: 20,
        textAlign: "center",
        background: "rgba(6,8,12,0.85)",
        backdropFilter: "blur(3px)",
        touchAction: "manipulation",
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      <div
        style={{
          color,
          fontSize: mobile ? 14 : 18,
          letterSpacing: "0.08em",
          textShadow: `0 0 16px ${color}`,
        }}
      >
        {global ? "GLOBAL TOP 10" : "NEW HIGH SCORE"}
      </div>
      <div style={{ color: "#00E5FF", fontSize: mobile ? 10 : 13 }}>
        SCORE {String(score).padStart(6, "0")}
      </div>
      <div style={{ color: "#778899", fontSize: mobile ? 8 : 10 }}>
        {global ? "GLOBAL RANK" : "RANK"} #{rank}
      </div>

      <div style={{ display: "flex", gap: mobile ? 12 : 18, marginTop: 4 }}>
        {chars.map((ci, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              aria-label={`slot ${i + 1} next letter`}
              onPointerDown={press(() => cycleAt(i, 1))}
              style={chev}
            >
              {"▲"}
            </button>
            <button
              type="button"
              aria-label={`select slot ${i + 1}`}
              onPointerDown={press(() => setSlot(i))}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: mobile ? 30 : 42,
                width: mobile ? 52 : 66,
                height: mobile ? 60 : 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                color: i === slot ? "#1a1410" : color,
                background: i === slot ? color : "rgba(216,166,87,0.06)",
                border: `2px solid ${color}${i === slot ? "" : "44"}`,
                boxShadow: i === slot ? `0 0 18px ${color}88` : "none",
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                transition: "background 0.12s ease, color 0.12s ease",
              }}
            >
              {dispChar(ci)}
            </button>
            <button
              type="button"
              aria-label={`slot ${i + 1} previous letter`}
              onPointerDown={press(() => cycleAt(i, -1))}
              style={chev}
            >
              {"▼"}
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="confirm initials"
        onPointerDown={press(submit)}
        style={{
          marginTop: mobile ? 6 : 10,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: mobile ? 11 : 13,
          letterSpacing: "0.1em",
          padding: mobile ? "12px 22px" : "14px 30px",
          borderRadius: 8,
          background: color,
          border: "none",
          color: "#1a1410",
          cursor: "pointer",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          boxShadow: `0 0 20px ${color}88`,
        }}
      >
        ENTER {"▶"}
      </button>

      <div
        style={{
          color: "rgba(143,160,179,0.55)",
          fontSize: mobile ? 6 : 8,
          letterSpacing: "0.08em",
          marginTop: 2,
          lineHeight: 1.6,
        }}
      >
        {mobile
          ? "TAP ▲▼ TO PICK · ENTER TO SAVE"
          : "◄ ► SLOT · ▲ ▼ LETTER · TYPE A–Z · ⏎ SAVE"}
      </div>
    </div>
  );
}

/* ── helpers (outside component for perf) ──────────────── */

function drawControlsLegend(ctx, cx, h, mobile) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${mobile ? 7 : 10}px 'Press Start 2P', monospace`;
  const y = mobile ? h * 0.7 : h * 0.66;
  ctx.fillStyle = "rgba(143,160,179,0.72)";
  ctx.fillText(
    mobile ? "SLIDE: MOVE   TAP: FIRE" : "◄ ►  MOVE       SPACE / ▲  FIRE",
    cx,
    y,
  );
  ctx.fillStyle = "rgba(143,160,179,0.45)";
  ctx.fillText(
    mobile ? "✕ END    ❚❚ PAUSE" : "ESC / B  END       P  PAUSE",
    cx,
    y + (mobile ? 15 : 20),
  );
  ctx.restore();
}

/* ── ANOMALY renderer: the player's A-mark, inverted and corrupted ── */
function drawBoss(ctx, b, cx, cy, shipY, w, elapsed, mobile) {
  // Warning phase: no body yet, just the klaxon text.
  if (b.phase === "warning") {
    if (Math.floor(elapsed / 180) % 2 === 0) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${mobile ? 11 : 16}px 'Press Start 2P', monospace`;
      ctx.fillStyle = "#ff2266";
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255,34,102,0.8)";
      ctx.fillText("SIGNAL ANOMALY DETECTED", cx, cy - (mobile ? 60 : 90));
      ctx.restore();
    }
    return;
  }

  const scale = depthScale(b.depth);
  const bx = cx + b.x * scale;
  const by = cy + (shipY - cy) * b.depth;
  const s = bossSize(b.level, mobile) * scale * 0.31;

  let alpha = 1;
  if (b.phase === "enter") alpha = Math.min(1, b.timer / ENTER_MS);
  if (b.phase === "dying") {
    const fade = 1 - b.timer / DYING_MS;
    alpha = (Math.floor(elapsed / 60) % 2 === 0 ? 0.25 : 0.9) * fade;
  }

  const agitated =
    b.phase === "dying" || bossEnraged(b) || elapsed - b.hitFlash < 120;
  const jx = agitated ? (Math.random() - 0.5) * 6 : 0;
  const jy = agitated ? (Math.random() - 0.5) * 6 : 0;

  const trace = (sz) => {
    for (const l of LOGO_LINES) {
      ctx.beginPath();
      ctx.moveTo(l.x1 * sz, l.y1 * sz);
      ctx.lineTo(l.x2 * sz, l.y2 * sz);
      ctx.stroke();
    }
    // Crossbar at the mark's true seat and weight (see drawShip)
    const beamWidth = ctx.lineWidth;
    ctx.lineWidth = beamWidth * 0.56;
    ctx.beginPath();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (-0.344 + t * 0.688) * sz;
      const y = (0.172 - Math.sin(t * Math.PI * 4) * 0.094) * sz;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = beamWidth;
  };

  ctx.save();
  ctx.translate(bx + jx, by + jy);
  ctx.rotate(Math.PI); // the mark turned against you
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Chromatic ghosts (echo of the cabinet logo's fringe)
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = "#d3869b";
  ctx.save();
  ctx.translate(-3, 0);
  trace(s);
  ctx.restore();
  ctx.strokeStyle = "rgba(0,80,255,0.9)";
  ctx.save();
  ctx.translate(3, 0);
  trace(s);
  ctx.restore();

  // Body
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ff2266";
  ctx.lineWidth = 3.5;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(255,34,102,0.7)";
  trace(s);

  ctx.restore();
}

function drawGameOver(ctx, gs, w, h, mobile) {
  const cx = w / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const top = mobile ? 18 : 30;
  const goY = top + (mobile ? 16 : 26);

  // GAME OVER
  ctx.font = `${mobile ? 20 : 34}px 'Press Start 2P', monospace`;
  ctx.shadowBlur = 22;
  ctx.shadowColor = "rgba(255,34,34,0.8)";
  ctx.strokeStyle = "#ff2222";
  ctx.lineWidth = 2;
  ctx.strokeText("GAME OVER", cx, goY);
  ctx.fillStyle = "rgba(255,34,34,0.2)";
  ctx.fillText("GAME OVER", cx, goY);
  ctx.shadowBlur = 0;

  // Final score
  ctx.font = `${mobile ? 10 : 14}px 'Press Start 2P', monospace`;
  ctx.fillStyle = "#00E5FF";
  ctx.fillText(
    `SCORE ${String(gs.score).padStart(6, "0")}`,
    cx,
    goY + (mobile ? 22 : 34),
  );

  // Leaderboard — the board chosen at game over (global when fetched, local
  // otherwise); fall back to local for safety.
  const board = gs.displayBoard || {
    title: "- HIGH SCORES -",
    rows: gs.leaderboard,
  };
  const lbHeaderY = goY + (mobile ? 44 : 66);
  ctx.font = `${mobile ? 8 : 11}px 'Press Start 2P', monospace`;
  ctx.fillStyle = AMBER;
  ctx.fillText(board.title, cx, lbHeaderY);

  const rowH = mobile ? 15 : 20;
  const startY = lbHeaderY + (mobile ? 17 : 24);
  const bottomLimit = h - (mobile ? 24 : 36);
  const fit = Math.floor((bottomLimit - startY) / rowH);
  const maxRows = Math.max(0, Math.min(board.rows.length, fit, LB_MAX));

  const bandW = mobile ? Math.min(w - 48, 220) : 300;
  const bx = cx - bandW / 2;
  ctx.font = `${mobile ? 8 : 11}px 'Press Start 2P', monospace`;
  if (board.rows.length === 0) {
    ctx.fillStyle = "#8fa0b3";
    ctx.fillText("NO SCORES YET - BE FIRST", cx, startY);
  }
  for (let i = 0; i < maxRows; i++) {
    const e = board.rows[i];
    const y = startY + i * rowH;
    const isNew = e === gs.newEntry;
    ctx.fillStyle = isNew ? AMBER : "#8fa0b3";
    ctx.textAlign = "left";
    ctx.fillText(String(i + 1).padStart(2, " "), bx, y);
    ctx.textAlign = "center";
    ctx.fillText(e.i, cx, y);
    ctx.textAlign = "right";
    ctx.fillText(String(e.s).padStart(6, "0"), bx + bandW, y);
    if (isNew) {
      ctx.textAlign = "left";
      ctx.fillText("◀", bx + bandW + (mobile ? 8 : 12), y);
    }
  }

  // Press any key (only after a short read buffer; suppressed while typing)
  ctx.textAlign = "center";
  if (
    !gs.entering &&
    gs.elapsed - (gs.gameoverAt || 0) > 800 &&
    Math.floor(gs.elapsed / 600) % 2 === 0
  ) {
    ctx.font = `${mobile ? 6 : 10}px 'Press Start 2P', monospace`;
    ctx.fillStyle = "#667";
    ctx.fillText("PRESS ANY KEY / TAP TO RETURN", cx, h - (mobile ? 14 : 24));
  }
}

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

const MAX_PARTICLES = 240;

function updateAndDrawParticles(ctx, gs, dt) {
  // Defensive cap: many simultaneous text-explosions could otherwise spike the
  // array. Drop the oldest excess (barely visible) to keep memory bounded.
  if (gs.particles.length > MAX_PARTICLES) {
    gs.particles.splice(0, gs.particles.length - MAX_PARTICLES);
  }
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
