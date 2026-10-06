import { describe, it, expect } from "vitest";
import { pixel } from "../type";

describe("pixel()", () => {
  it("snaps a size to Press Start 2P's 8 px grid, never below 8", () => {
    expect([5, 7, 8, 9, 11].map(pixel)).toEqual([8, 8, 8, 8, 8]);
    expect([12, 14, 16, 19].map(pixel)).toEqual([16, 16, 16, 16]);
    expect([20, 24, 27].map(pixel)).toEqual([24, 24, 24]);
    expect(pixel(38)).toBe(40);
  });
});
