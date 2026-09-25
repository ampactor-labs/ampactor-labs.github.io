import { describe, it, expect } from "vitest";
import { reflowMessage } from "../message";

describe("reflowMessage", () => {
  it("joins a hard-wrapped paragraph and keeps paragraph breaks", () => {
    const body =
      "The marker voice was Anton turned a few degrees, which read as\na headline that had been knocked.\n\nA scrap or a piece can go in unsigned.";
    expect(reflowMessage(body)).toEqual([
      {
        kind: "paragraph",
        text: "The marker voice was Anton turned a few degrees, which read as a headline that had been knocked.",
      },
      { kind: "paragraph", text: "A scrap or a piece can go in unsigned." },
    ]);
  });

  it("leaves lists, indented blocks and trailers as they are", () => {
    const list = "- one thing\n- another thing";
    const code = "    let x = 1;\n    let y = 2;";
    const trailer = "Co-Authored-By: Claude <noreply@anthropic.com>\nChecked: vitest 207 passed.";
    expect(reflowMessage(`${list}\n\n${code}\n\n${trailer}`)).toEqual([
      { kind: "pre", text: list },
      { kind: "pre", text: code },
      { kind: "pre", text: trailer },
    ]);
  });

  it("drops empty bodies and trailing whitespace", () => {
    expect(reflowMessage("\n\n  \n")).toEqual([]);
    expect(reflowMessage("Just one line.   \n")).toEqual([{ kind: "paragraph", text: "Just one line." }]);
  });
});
