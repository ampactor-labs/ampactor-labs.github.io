import { describe, it, expect } from "vitest";
import {
  checkReadme,
  leadParagraph,
  operatorNoteOf,
  statusOf,
  summaryOf,
} from "../sync-readmes.mjs";

// A README formatted at 80 columns, the way most of the repositories are.
const WRAPPED = `# example

[![CI](https://example.com/ci.svg)](https://example.com/ci)

A command-line tool that sorts numbers quickly. It is written in Rust and
published on crates.io. Two more sentences fit here.

**Status: working.** The API may change. The ARM path is not tested in CI,
and is verified by flashing it by hand.

Live: https://example.com/

## Quick start

\`\`\`sh
cargo run
\`\`\`

## Testing

\`cargo test\` runs 12 tests.

## Limitations

Large random inputs lose to the alternative, and the README says so. This
paragraph stands on its own.

- SSE4.2 is not implemented.

## License

MIT.
`;

describe("statusOf", () => {
  it("reads a caveat that wraps onto the next line", () => {
    expect(statusOf(WRAPPED)).toEqual({
      label: "working",
      caveat:
        "The API may change. The ARM path is not tested in CI, and is verified by flashing it by hand.",
    });
  });

  it("stops at a blank line, a heading or a list", () => {
    expect(statusOf("**Status: shipping.** Live.\n## Next\n").caveat).toBe(
      "Live.",
    );
    expect(statusOf("**Status: prototype.** Core works.\n- todo\n").caveat).toBe(
      "Core works.",
    );
    expect(statusOf("**Status: paused** - still runs.\n\nMore.").caveat).toBe(
      "still runs.",
    );
  });

  it("returns null without a status line", () => {
    expect(statusOf("# x\n\nA tool.\n")).toBeNull();
  });
});

describe("lead and card", () => {
  it("joins the wrapped lead and skips badges and the status line", () => {
    expect(leadParagraph(WRAPPED)).toBe(
      "A command-line tool that sorts numbers quickly. It is written in Rust and published on crates.io. Two more sentences fit here.",
    );
    expect(summaryOf(WRAPPED)).toBe(
      "A command-line tool that sorts numbers quickly.",
    );
  });

  it("takes the first paragraph of Limitations, joined across lines", () => {
    expect(operatorNoteOf(WRAPPED)).toBe(
      "Large random inputs lose to the alternative, and the README says so. This paragraph stands on its own.",
    );
  });
});

describe("checkReadme", () => {
  it("accepts a README that meets the standard", () => {
    const { errors, renames, meetsStandard } = checkReadme(WRAPPED);
    expect(errors).toEqual([]);
    expect(renames).toEqual([]);
    expect(meetsStandard).toBe(true);
  });

  it("names the old section names as renames and em dashes as errors", () => {
    const old = WRAPPED.replace("## Limitations", "## Weak spots").replace(
      "quickly.",
      "quickly — really.",
    );
    const { errors, renames, meetsStandard } = checkReadme(old);
    expect(renames).toEqual(['section "Weak spots": rename to "Limitations"']);
    expect(errors).toContain("1 em dash");
    expect(meetsStandard).toBe(false);
  });
});
