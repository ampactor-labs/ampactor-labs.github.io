import { describe, it, expect } from "vitest";
import {
  FIRST_BOSS_AT,
  BOSS_DEPTH,
  ENRAGE_HP_FRAC,
  makeBoss,
  bossHp,
  bossSize,
  bossEnraged,
  bossFireInterval,
  bossKillBonus,
  nextBossScore,
  bossLabel,
  bossVolley,
} from "../tunnelBoss";

describe("boss scaling", () => {
  it("starts at a reachable score", () => {
    expect(FIRST_BOSS_AT).toBeGreaterThan(0);
  });

  it("gains hp per level", () => {
    expect(bossHp(2)).toBeGreaterThan(bossHp(1));
  });

  it("fires faster per level but never below the floor", () => {
    expect(bossFireInterval(2)).toBeLessThan(bossFireInterval(1));
    expect(bossFireInterval(50)).toBe(700);
  });

  it("pays a growing kill bonus and pushes the next summon out", () => {
    expect(bossKillBonus(2)).toBeGreaterThan(bossKillBonus(1));
    expect(nextBossScore(5000, 1)).toBeGreaterThan(5000);
  });

  it("labels the first encounter plainly and later ones by level", () => {
    expect(bossLabel(1)).toBe("ANOMALY");
    expect(bossLabel(3)).toBe("ANOMALY LV.3");
  });

  it("grows per level but caps before filling the tunnel", () => {
    expect(bossSize(2, false)).toBeGreaterThan(bossSize(1, false));
    expect(bossSize(99, false)).toBe(bossSize(6, false)); // 1.6× cap
    expect(bossSize(1, true)).toBeLessThan(bossSize(1, false));
  });

  it("enrages below the hp fraction and not above it", () => {
    const b = makeBoss(1, () => 0.5);
    expect(bossEnraged(b)).toBe(false);
    b.hp = Math.floor(b.maxHp * ENRAGE_HP_FRAC);
    expect(bossEnraged(b)).toBe(true);
    b.hp = 0;
    expect(bossEnraged(b)).toBe(false); // dead is dying, not enraged
  });
});

describe("makeBoss", () => {
  it("spawns in the warning phase at full hp", () => {
    const b = makeBoss(2, () => 0.5);
    expect(b.phase).toBe("warning");
    expect(b.hp).toBe(b.maxHp);
    expect(b.hp).toBe(bossHp(2));
    expect(b.level).toBe(2);
  });
});

describe("bossVolley", () => {
  const W = 800;

  it("aims the triple at the player's lane", () => {
    const v = bossVolley(0, 120, -50, W, 1, () => 0.5);
    expect(v.map((o) => o.x)).toEqual([-110, -50, 10]);
    expect(v.every((o) => o.fromBoss && o.alive)).toBe(true);
    expect(v.every((o) => o.depth > BOSS_DEPTH)).toBe(true);
  });

  it("builds a wall with exactly one gap", () => {
    const v = bossVolley(1, 0, 0, W, 1, () => 0.5); // gap at lane 2
    expect(v).toHaveLength(4);
    const lane2X = 0; // center lane of five
    expect(v.some((o) => o.x === lane2X)).toBe(false);
  });

  it("releases the weaving pair from the boss position", () => {
    const v = bossVolley(2, 200, 0, W, 1, () => 0.5);
    expect(v.map((o) => o.originalX)).toEqual([160, 240]);
    expect(v.every((o) => o.wave)).toBe(true);
  });

  it("cycles patterns by volley index", () => {
    const a = bossVolley(3, 0, 77, W, 1, () => 0.5);
    expect(a.map((o) => o.x)).toEqual([17, 77, 137]); // back to the aimed triple
  });

  it("densifies every pattern at higher levels", () => {
    expect(bossVolley(0, 0, 0, W, 3, () => 0.5)).toHaveLength(5); // aimed burst
    expect(bossVolley(1, 0, 0, W, 3, () => 0.5)).toHaveLength(5); // 6 lanes - gap
    expect(bossVolley(2, 0, 0, W, 3, () => 0.5)).toHaveLength(3); // third weaver
  });
});
