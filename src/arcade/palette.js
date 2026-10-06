// The cabinet's colours, in one place, by role. Everything the machine paints
// reads from here: the room, the tube, the chrome, the screens, the game's
// chrome and the canvases. Two kinds of colour stay where they are because
// they are content, not chrome: each cartridge's neon (src/data/projects.js)
// and each bug's colour in the game (TunnelGame.jsx).
//
// The set is the one docs/AUDIT-NEON.md section 3 derives: indigo and void
// for the grounds, mist and lilac for the text, magenta as the machine's
// voice, cyan kept as the mark. src/arcade/__tests__/palette.test.js holds
// every text role against every ground to 4.5:1.
//
// `cabinetCss` puts the semantic set on :root as --cab-* custom properties
// from the document head (src/data/site.js), so the room is the same colour
// before any script runs, and no theme can flip it: the cabinet is a
// physical object, and it stays dark in a lit room.

export const PALETTE = {
  // Grounds. Text sits only on void, room, tube, raised and band.
  void: "#0a0716", // the tube's bottom, insets, the darkest shadow
  room: "#15102e", // the room behind the console
  tube: "#15102e", // the tube's centre
  raised: "#221a45", // the console, the chassis, cards
  line: "#3b2b7d", // borders, hairlines, the bezel; never text
  lit: "#6b3fd6", // the lit grid and active fills; never under text
  band: "#2b1a5e", // the title band's dark end
  bandBright: "#4a2ca0", // the band's bright end; only text and the mark on it

  // Text.
  text: "#ece6fb", // primary, never white
  muted: "#b9a6e8",
  faint: "#8f7fb8", // footers, ranks, the marquee, the skip hint; never on the band

  // Accents.
  mark: "#00e5ff", // the A-mark, the name, A, the ship, the tunnel
  voice: "#ff2fd2", // the machine's voice: PRESS START, READY., INSERT COIN, the lit row
  voiceLt: "#ff5ce1", // the voice at 7 to 9 px, where 4.5:1 needs more room
  ok: "#00ffd0", // OK, status, deployed
  halo: "#b388ff", // the bloom behind the letters
  quiet: "#b388ff", // the quiet accent: the operator's programs, a status that is not live
  coin: "#ffb800", // the coin and only the coin: the slot, the credit, rank 1
  ember: "#ff8a5c", // the one warm accent: deployed, COMBO
  danger: "#ff3b7a", // danger text, B's label, GAME OVER
  hot: "#ff2266", // strokes and glows only: the boss, B's ring
  mint: "#00ffd0", // lasers, the dust, the game's second voice
  rose: "#ff5ce1", // the warm side of a chromatic ghost

  // Mixers, only ever through alpha(): catch-lights and shade.
  white: "#ffffff",
  black: "#000000",
};

// The chromatic fringe on the A-mark and the boss: magenta to the left, cyan
// to the right.
export const FRINGE = { warm: PALETTE.voice, cool: PALETTE.mark };

// The game's chrome: the HUD, the overlays, the hits. The bugs keep their own.
export const GAME = {
  hud: PALETTE.muted,
  hudDim: PALETTE.faint,
  hudFaint: PALETTE.faint,
  ink: PALETTE.void, // text on a lit pill
  shade: PALETTE.void, // the overlays' glass, through alpha()
  hit: PALETTE.danger,
  end: PALETTE.danger, // the END button
  enraged: PALETTE.ember, // the boss bar while it is angry
};

// The tunnel behind the console: twelve rings from near to far, and the dust.
export const TUNNEL = {
  rings: [
    PALETTE.mark,
    PALETTE.voice,
    PALETTE.mint,
    PALETTE.quiet,
    "#8a5cff",
    PALETTE.lit,
    "#5a35b8",
    PALETTE.bandBright,
    PALETTE.line,
    PALETTE.band,
    PALETTE.raised,
    PALETTE.room,
  ],
  dust: [PALETTE.mint, PALETTE.mark, PALETTE.voice, PALETTE.quiet],
};

// The synth's two knob colours and the coherence field's three states.
export const SYNTH = { cool: PALETTE.mark, warm: PALETTE.ember };
export const FIELD = { live: PALETTE.mint, on: PALETTE.danger, off: PALETTE.faint };

// A token as an rgba() string, for glows, fills and hairlines.
export function alpha(hex, a) {
  const h = hex.slice(1);
  const s = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(s, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// A card on the tube: the void at 72%, so the lit grid recedes behind
// whatever stands on it (the list's programs, the pills and chips, the
// readout's panels, the cartridge on the title card). onCard(tint) lays a
// colour's tint over it.
export const CARD = alpha(PALETTE.void, 0.72);
export const onCard = (tint) => `linear-gradient(${tint}, ${tint}), ${CARD}`;

// The semantic set as custom properties, for the stylesheets and the head.
export const CABINET_VARS = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [`--cab-${k}`, v]),
);

export const cabinetCss = `:root{${Object.entries(CABINET_VARS)
  .map(([k, v]) => `${k}:${v}`)
  .join(";")}}`;
