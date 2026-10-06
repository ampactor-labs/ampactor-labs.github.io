import { describe, expect, it } from "vitest";
import { HIDDEN_PROJECTS, PROJECTS } from "../projects";
import { bodyAfterHeadline, withReadme } from "../readme";

describe("the readout's body", () => {
  it("leaves out the sentence the headline already says", () => {
    expect(bodyAfterHeadline("One thing. Two things.", "One thing.")).toBe(
      "Two things.",
    );
    expect(bodyAfterHeadline("One thing. Two things.", "Else.")).toBe(
      "One thing. Two things.",
    );
    expect(bodyAfterHeadline("One thing.", "One thing.")).toBe("");
    expect(bodyAfterHeadline("One thing.", undefined)).toBe("One thing.");
  });

  // One fact in one place: no cartridge's readout repeats its headline.
  it("never repeats a cartridge's headline", () => {
    for (const raw of [...PROJECTS, ...HIDDEN_PROJECTS]) {
      const p = withReadme(raw);
      if (!p.outcome) continue;
      const body = bodyAfterHeadline(p.desc, p.outcome) ?? "";
      expect(body.includes(p.outcome.trim()), p.id).toBe(false);
    }
  });
});
