import { describe, it, expect } from "vitest";
import { crtStyles } from "../styles/crtStyles";
import { BLINK_MS, DEATH_BLINK_ALPHA } from "../tunnelBoss";

// The flash budget (docs/DESIGN-SYSTEM.md, Motion): nothing on the tube
// changes its brightness more than three times a second. A square-wave blink
// flips twice a period, so a looping one needs a period of a third of a
// second or more, and the game's blinks hold each state for a sixth.
describe("the flash budget", () => {
  it("no looping square-wave animation on the tube flips faster than three times a second", () => {
    const loops = [
      ...crtStyles.matchAll(
        /animation:\s*([a-zA-Z]+)\s+([\d.]+)s[^;}]*step[^;}]*infinite/g,
      ),
    ];
    expect(loops.length, "the boot cursor still blinks").toBeGreaterThan(0);
    for (const [, name, seconds] of loops)
      expect(Number(seconds), name).toBeGreaterThanOrEqual(1 / 3);
  });

  it("the game's blinks hold each state for a sixth of a second, with a narrow swing", () => {
    expect(BLINK_MS).toBeGreaterThanOrEqual(1000 / 6);
    const [dim, bright] = DEATH_BLINK_ALPHA;
    expect(bright - dim).toBeLessThanOrEqual(0.4);
  });

  it("every verb on the tube is listed for reduced motion", () => {
    const block = crtStyles.match(
      /prefers-reduced-motion: reduce\) \{([\s\S]*?)\n {2}\}/,
    )[1];
    for (const cls of [
      "dash-in",
      "tube-sweep",
      "tier-1-enter",
      "coin-announce",
      "coin-slot.lit",
      "attract-start",
      "marquee-track",
    ])
      expect(block, cls).toContain(`.${cls}`);
  });
});
