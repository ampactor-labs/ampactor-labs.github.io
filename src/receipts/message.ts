// Commit bodies arrive hard-wrapped at 72 columns, the way git wants them
// written. Shown in a narrower box they would wrap twice. Prose paragraphs
// are joined back into flowing text; anything that looks deliberate (a list,
// an indented block, a trailer line) keeps its line breaks.

export interface MessageBlock {
  kind: "paragraph" | "pre";
  text: string;
}

const DELIBERATE = /^(\s{2,}|\t|[-*•]\s|\d+[.)]\s|[A-Za-z-]+:\s\S|>|\||#|`)/;

export function reflowMessage(body: string): MessageBlock[] {
  const paragraphs = body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+$/g, ""))
    .filter((p) => p.trim().length > 0);
  return paragraphs.map((p) => {
    const lines = p.split("\n");
    const prose =
      lines.every((line) => line.length <= 100 && !DELIBERATE.test(line)) &&
      lines.length > 0;
    return prose
      ? { kind: "paragraph", text: lines.map((l) => l.trim()).join(" ") }
      : { kind: "pre", text: p };
  });
}
