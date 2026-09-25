import { describe, it, expect } from "vitest";
import {
  bytes,
  compact,
  int,
  monthLabel,
  percent,
  shortDate,
  signed,
} from "../format";

describe("format", () => {
  it("keeps small numbers exact and compacts large ones", () => {
    expect(compact(0)).toBe("0");
    expect(compact(1284)).toBe("1,284");
    expect(compact(9999)).toBe("9,999");
    expect(compact(12_900)).toBe("12.9K");
    expect(compact(2_401_500)).toBe("2.4M");
    expect(compact(Number.NaN)).toBe("—");
  });

  it("formats integers, signed deltas and missing values", () => {
    expect(int(1306867)).toBe("1,306,867");
    expect(int(null)).toBe("—");
    expect(signed(42, "+")).toBe("+42");
    expect(signed(7, "−")).toBe("−7");
    expect(signed(undefined, "+")).toBe("—");
  });

  it("formats percentages with one decimal under ten", () => {
    expect(percent(185, 3859)).toBe("4.8%");
    expect(percent(1, 2)).toBe("50%");
    expect(percent(3, 0)).toBe("0%");
  });

  it("formats dates in the commit's own calendar day", () => {
    expect(shortDate("2026-01-25T00:58:13-07:00")).toBe("Jan 25, 2026");
    expect(shortDate("2026-09-24T08:31:29+00:00")).toBe("Sep 24, 2026");
    expect(shortDate("garbage")).toBe("garbage");
  });

  it("labels months", () => {
    expect(monthLabel("2026-03")).toBe("Mar 2026");
    expect(monthLabel("2026-03", "long")).toBe("March 2026");
    expect(monthLabel("nope")).toBe("nope");
  });

  it("formats byte sizes", () => {
    expect(bytes(512)).toBe("512 B");
    expect(bytes(38 * 1024)).toBe("38 KB");
    expect(bytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});
