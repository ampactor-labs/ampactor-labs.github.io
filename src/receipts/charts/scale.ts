// Axis arithmetic for the hand-rolled SVG charts. Pure and unit tested.

// The step between ticks: a 1, 2, 2.5 or 5 times a power of ten, so the axis
// reads as round numbers whatever the data's magnitude.
export function niceStep(max: number, count: number): number {
  if (!(max > 0) || !(count > 0)) return 1;
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  // A 2.5 step only once it is a whole number (25, 250, …); counts of
  // commits should never be ticked at 2.5.
  const step =
    norm <= 1
      ? 1
      : norm <= 2
        ? 2
        : norm <= 2.5
          ? magnitude >= 10
            ? 2.5
            : 2
          : norm <= 5
            ? 5
            : 10;
  return step * magnitude;
}

// Tick values from zero to the first round number at or above `max`.
export function ticks(max: number, count = 4): number[] {
  const step = niceStep(max, count);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const out: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step)
    out.push(Number(v.toFixed(10)));
  return out;
}

// A bar with rounded data-end corners and a square baseline end.
export function roundedTop(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M${x},${y + h}`,
    `V${y + rr}`,
    `Q${x},${y} ${x + rr},${y}`,
    `H${x + w - rr}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `V${y + h}`,
    "Z",
  ].join(" ");
}

export function roundedBottom(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M${x},${y}`,
    `V${y + h - rr}`,
    `Q${x},${y + h} ${x + rr},${y + h}`,
    `H${x + w - rr}`,
    `Q${x + w},${y + h} ${x + w},${y + h - rr}`,
    `V${y}`,
    "Z",
  ].join(" ");
}

export function roundedRight(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  const rr = Math.max(0, Math.min(r, h / 2, w));
  return [
    `M${x},${y}`,
    `H${x + w - rr}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `Q${x + w},${y + h} ${x + w - rr},${y + h}`,
    `H${x}`,
    "Z",
  ].join(" ");
}
