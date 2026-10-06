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
const GROUNDS = ["void", "room", "tube", "raised", "band"];
const TEXT = [
  "text",
  "muted",
  "faint",
  "mark",
  "voice",
  "voiceLt",
  "ok",
  "halo",
  "quiet",
  "coin",
  "ember",
  "danger",
  "mint",
];
// Pairs under 4.5:1 that the rules forbid (docs/AUDIT-NEON.md section 3):
// the faint tier and danger never sit on the title band. Held below 4.5 so
// the rule is removed the day the numbers no longer need it.
const FORBIDDEN = new Set(["faint/band", "danger/band"]);
// Pairs under 4.5:1 that are debt. Empty since the palette swap.
const BELOW = new Set();

describe("the cabinet's palette", () => {
  it("every text role clears 4.5:1 on every ground it may sit on", () => {
    for (const t of TEXT)
      for (const g of GROUNDS) {
        const ratio = contrast(PALETTE[t], PALETTE[g]);
        const pair = `${t}/${g}`;
        if (FORBIDDEN.has(pair) || BELOW.has(pair))
          expect(ratio, `${pair} is listed`).toBeLessThan(4.5);
        else expect(ratio, pair).toBeGreaterThanOrEqual(4.5);
      }
  });

  it("void ink reads on every lit pill", () => {
    for (const pill of ["voice", "mark", "coin", "mint"])
      expect(contrast(PALETTE.void, PALETTE[pill]), pill).toBeGreaterThanOrEqual(4.5);
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
