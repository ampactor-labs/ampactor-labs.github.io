/* ── ANOMALY: the corrupted A-mark boss for TUNNEL_RUN ──────
 * Pure data + math so the encounter is unit-testable apart from the canvas
 * loop: spawn thresholds, HP scaling, fire cadence, and volley patterns.
 * The boss is the player's own A-mark inverted — the game draws it rotated
 * 180° in the error palette, deep in the tunnel, firing bursts of the same
 * obstacle machinery the ambient spawner uses.
 */

export const FIRST_BOSS_AT = 1500; // score that summons the first ANOMALY
export const BOSS_DEPTH = 0.45; // the depth band the boss holds in the fight
export const WARNING_MS = 1400; // "SIGNAL ANOMALY" flash before it enters
export const ENTER_MS = 1200; // slide from tunnel mouth to BOSS_DEPTH
export const DYING_MS = 1100; // glitch-out before the kill is banked
export const BOSS_WORLD_SIZE = 680; // world units; ~210px on screen at depth
export const BOSS_WORLD_SIZE_MOBILE = 480;

export function bossHp(level) {
  return 10 + level * 6; // L1 = 16 hits
}

export function bossFireInterval(level) {
  return Math.max(700, 1500 - level * 120);
}

export function bossKillBonus(level) {
  return 1000 * level;
}

// Next summon threshold after a kill: far enough that the run breathes,
// close enough that a good run meets ANOMALY again.
export function nextBossScore(score, level) {
  return score + 3000 + level * 2500;
}

export function bossLabel(level) {
  return level === 1 ? "ANOMALY" : `ANOMALY LV.${level}`;
}

export function makeBoss(level, rand = Math.random) {
  const hp = bossHp(level);
  return {
    level,
    phase: "warning", // warning | enter | fight | dying
    timer: 0,
    x: 0,
    depth: 0.05,
    hp,
    maxHp: hp,
    lastFire: 0,
    volleyIdx: 0,
    wobblePhase: rand() * Math.PI * 2,
    hitFlash: 0, // gs.elapsed of the last projectile hit (drives the jitter)
  };
}

/* Volley patterns, cycled per shot. Returns descriptors in the same shape
 * the ambient spawner pushes, so collision, scoring, and drawing are shared.
 * They spawn just past the boss so the shots visibly leave its body.
 */
export function bossVolley(volleyIdx, bossX, playerX, w, level, rand = Math.random) {
  const speed = 1.2 + level * 0.1;
  const mk = (x, over = {}) => ({
    text: "FAULT",
    color: "#ff2266",
    speed,
    points: 80,
    x,
    originalX: x,
    depth: BOSS_DEPTH + 0.02,
    alive: true,
    wavePhase: rand() * Math.PI * 2,
    fromBoss: true,
    ...over,
  });
  switch (volleyIdx % 3) {
    case 0:
      // Aimed triple at the player's current lane — dodgeable by moving.
      return [-60, 0, 60].map((off) => mk(playerX + off, { text: "TRAP" }));
    case 1: {
      // Wall across the tunnel with one gap.
      const lanes = 5;
      const gap = Math.floor(rand() * lanes);
      const wall = [];
      for (let i = 0; i < lanes; i++) {
        if (i === gap) continue;
        wall.push(
          mk((i - (lanes - 1) / 2) * (w * 0.18), {
            text: "0xDEAD",
            speed: speed * 0.85,
          }),
        );
      }
      return wall;
    }
    default:
      // Weaving pair released from the boss's own position.
      return [-40, 40].map((off, k) =>
        mk(bossX + off, {
          text: "SIGKILL",
          wave: true,
          wavePhase: k * Math.PI,
          speed: speed * 1.15,
        }),
      );
  }
}
