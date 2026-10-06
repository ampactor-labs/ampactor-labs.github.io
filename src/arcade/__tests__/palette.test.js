import { describe, it, expect } from "vitest";
import { PALETTE, CABINET_VARS, cabinetCss, alpha } from "../palette";

// WCAG 2.x relative luminance and contrast ratio.
const channel = (c) =>
  c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [16, 8, 0].map((s) => channel(((n >> s) & 255) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// The grounds text sits on, and every role that is ever text.
const GROUNDS = ["void", "room", "tube"];
const TEXT = [
  "text",
  "muted",
  "faint",
  "mark",
  "voice",
  "ok",
  "halo",
  "quiet",
  "coin",
  "danger",
  "mint",
];
// Pairs under 4.5:1 today, listed so they cannot hide. The palette swap
// (step 2 of docs/AUDIT-NEON.md) empties this list.
const BELOW = new Set(["faint/void", "faint/room", "faint/tube"]);

describe("the cabinet's palette", () => {
  it("every text role clears 4.5:1 on every ground, except the listed debt", () => {
    for (const t of TEXT)
      for (const g of GROUNDS) {
        const ratio = contrast(PALETTE[t], PALETTE[g]);
        if (BELOW.has(`${t}/${g}`))
          expect(ratio, `${t} on ${g} is listed as debt`).toBeLessThan(4.5);
        else expect(ratio, `${t} on ${g}`).toBeGreaterThanOrEqual(4.5);
      }
  });

  it("every value is a six-digit hex", () => {
    for (const [k, v] of Object.entries(PALETTE))
      expect(v, k).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("alpha() turns a token into rgba()", () => {
    expect(alpha(PALETTE.mark, 0.4)).toBe("rgba(0,229,255,0.4)");
    expect(alpha("#fff", 0.5)).toBe("rgba(255,255,255,0.5)");
    expect(alpha(PALETTE.black, 1)).toBe("rgba(0,0,0,1)");
  });

  it("the head's custom properties carry the same values", () => {
    expect(CABINET_VARS["--cab-text"]).toBe(PALETTE.text);
    expect(Object.keys(CABINET_VARS)).toHaveLength(Object.keys(PALETTE).length);
    expect(cabinetCss.startsWith(":root{")).toBe(true);
    expect(cabinetCss).toContain(`--cab-mark:${PALETTE.mark}`);
  });
});
