// The cabinet's type rules (docs/AUDIT-NEON.md, step 7).
//
// Press Start 2P is drawn on an 8 px grid: at 8, 16, 24, 32 or 40 px every
// cell of every glyph lands on whole pixels and the face is crisp; anywhere
// in between it smears, which is what makes a pixel face look cheap.
// pixel() snaps a size to that grid, never below 8. Its tracking is
// --track-pixel (0.125em: 1 px at 8 px, 2 px at 16 px), whole pixels too.
export const pixel = (size) => Math.max(8, Math.round(size / 8) * 8);
