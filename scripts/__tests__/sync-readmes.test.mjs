import { describe, it, expect } from "vitest";
import {
  checkReadme,
  extract,
  fetchReadme,
  sentencesOf,
  summaryOf,
  writingErrors,
} from "../sync-readmes.mjs";

// A README written to docs/README-STANDARD.md.
const GOOD = `# widget

A command-line tool that renames photos by the date they were taken. It reads
EXIF data and falls back to the file's modification time.

**Status: working.** The rename rules may change before 1.0.

## Quick start

\`\`\`sh
npx widget ./photos
\`\`\`

## How it works

It walks the folder, reads each file's metadata and renames in one pass.

## Testing

\`npm test\` runs 40 unit tests on sample images.

## Limitations

HEIC files without EXIF data keep their names.

## License

MIT
`;

describe("the README standard", () => {
  it("passes a README written to it and takes its first sentence", () => {
    const check = checkReadme(GOOD);
    expect(check.errors).toEqual([]);
    expect(check.renames).toEqual([]);
    expect(check.meetsStandard).toBe(true);
    expect(summaryOf(GOOD)).toBe(
      "A command-line tool that renames photos by the date they were taken.",
    );
    const { desc, operatorNote, missing } = extract(GOOD);
    expect(missing).toEqual([]);
    expect(desc).toMatch(/^A command-line tool/);
    expect(operatorNote).toBe("HEIC files without EXIF data keep their names.");
  });

  it("fails em dashes and filler words, field by field", () => {
    expect(writingErrors("Fast — really fast.")).toEqual(["1 em dash"]);
    expect(writingErrors("A seamless, honest tool.")).toEqual([
      "filler words: seamless, honest",
    ]);
    expect(writingErrors("A plain sentence.")).toEqual([]);
    const check = checkReadme(
      GOOD.replace("in one pass", "in one pass — fast"),
    );
    expect(check.meetsStandard).toBe(false);
    expect(check.errors).toContain("1 em dash");
  });

  it("ignores code blocks when checking the writing", () => {
    const withDash = GOOD.replace("npx widget ./photos", "echo 'a — b'");
    expect(checkReadme(withDash).errors).toEqual([]);
  });

  it("accepts old section names as renames, which still hold the card back", () => {
    const old = GOOD.replace("## Limitations", "## Weak spots").replace(
      "## Testing",
      "## Verification",
    );
    const check = checkReadme(old);
    expect(check.errors).toEqual([]);
    expect(check.renames).toEqual([
      'section "Verification": rename to "Testing"',
      'section "Weak spots": rename to "Limitations"',
    ]);
    expect(check.meetsStandard).toBe(false);
    expect(extract(old).operatorNote).toBe(
      "HEIC files without EXIF data keep their names.",
    );
  });

  it("lets a library's Usage stand in for Quick start", () => {
    const library = GOOD.replace("## Quick start", "## Usage");
    expect(checkReadme(library).errors).toEqual([]);
    const neither = GOOD.replace(/## Quick start[\s\S]*?(?=## How)/, "");
    expect(checkReadme(neither).errors).toContain(
      'no "Quick start" or "Usage" section',
    );
  });

  it("holds the status to one word from the list", () => {
    const twoWords = GOOD.replace(
      "**Status: working.**",
      "**Status: working, API unstable.**",
    );
    expect(checkReadme(twoWords).renames).toEqual([
      'status label "working, API unstable": one word, caveats in the sentence after',
    ]);
    const unknown = GOOD.replace("**Status: working.**", "**Status: beta.**");
    expect(checkReadme(unknown).errors).toContain(
      'status "beta" is not one of shipping, working, prototype, paused, retired',
    );
  });

  it("keeps the lead short enough to be a summary", () => {
    const long = GOOD.replace(
      "It reads\nEXIF data and falls back to the file's modification time.",
      "One. Two. Three. Four.",
    );
    expect(checkReadme(long).errors).toContain(
      "lead is 5 sentences (at most 4)",
    );
    expect(sentencesOf("It costs 2.5 s. Then it stops.")).toEqual([
      "It costs 2.5 s.",
      "Then it stops.",
    ]);
  });

  it("points extra sections into How it works or docs/", () => {
    const extra = GOOD.replace(
      "## Testing",
      "## One bet, read aloud\n\nText.\n\n## Testing",
    );
    const check = checkReadme(extra);
    expect(check.warnings).toContain(
      'extra section "One bet, read aloud": move it under How it works or into docs/',
    );
    expect(check.meetsStandard).toBe(true);
  });
});

describe("fetching a README", () => {
  const ok = (text) => ({ ok: true, status: 200, text: async () => text });
  const missing = { ok: false, status: 404, text: async () => "" };
  const reset = () => {
    throw Object.assign(new Error("fetch failed"), {
      cause: { code: "ECONNRESET" },
    });
  };

  it("retries a dropped connection, then succeeds", async () => {
    let calls = 0;
    const get = async () => (++calls < 3 ? reset() : ok("# repo"));
    expect(await fetchReadme("repo", { get, delayMs: 0 })).toEqual({
      md: "# repo",
    });
    expect(calls).toBe(3);
  });

  it("reports a network that stays down instead of throwing", async () => {
    const result = await fetchReadme("repo", { get: reset, delayMs: 0 });
    expect(result.md).toBeNull();
    expect(result.networkError.cause.code).toBe("ECONNRESET");
  });

  it("falls through a 404 on one branch to the other", async () => {
    const get = async (url) =>
      url.includes("/master/") ? missing : ok("# on main");
    expect(await fetchReadme("repo", { get, delayMs: 0 })).toEqual({
      md: "# on main",
    });
  });

  it("retries a server error like a dropped connection", async () => {
    let calls = 0;
    const get = async () =>
      ++calls === 1 ? { ok: false, status: 503 } : ok("# back");
    expect(await fetchReadme("repo", { get, delayMs: 0 })).toEqual({
      md: "# back",
    });
  });
});
