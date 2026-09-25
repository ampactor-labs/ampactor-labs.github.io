import { describe, it, expect } from "vitest";
import { niceStep, roundedRight, roundedTop, ticks } from "../charts/scale";

describe("scale", () => {
  it("picks round steps", () => {
    expect(niceStep(3859, 4)).toBe(1000);
    expect(niceStep(1154, 4)).toBe(500);
    expect(niceStep(17, 4)).toBe(5);
    expect(niceStep(0, 4)).toBe(1);
  });

  it("ticks from zero to the first round number at or above the maximum", () => {
    expect(ticks(3859, 4)).toEqual([0, 1000, 2000, 3000, 4000]);
    expect(ticks(1154, 4)).toEqual([0, 500, 1000, 1500]);
    expect(ticks(9, 4)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(ticks(0)).toEqual([0, 1]);
  });

  it("draws bars that are round at the data end and square at the baseline", () => {
    expect(roundedTop(10, 20, 8, 30, 3)).toBe(
      "M10,50 V23 Q10,20 13,20 H15 Q18,20 18,23 V50 Z",
    );
    // A bar shorter than the radius shrinks the radius rather than inverting.
    expect(roundedTop(0, 0, 8, 1, 3)).toBe("M0,1 V1 Q0,0 1,0 H7 Q8,0 8,1 V1 Z");
    expect(roundedRight(0, 0, 40, 12, 3)).toBe(
      "M0,0 H37 Q40,0 40,3 V9 Q40,12 37,12 H0 Z",
    );
  });
});
