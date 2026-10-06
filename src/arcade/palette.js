// The cabinet's colours, in one place, by role. Everything the machine paints
// reads from here: the room, the tube, the chrome, the screens, the game's
// chrome and the canvases. Two kinds of colour stay where they are because
// they are content, not chrome: each cartridge's neon (src/data/projects.js)
// and each bug's colour in the game (TunnelGame.jsx).
//
// The values are what the cabinet paints today. `cabinetCss` puts the
// semantic set on :root as --cab-* custom properties from the document head
// (src/data/site.js), so the room is the same colour before any script runs,
// and no theme can flip it: the cabinet is a physical object, and it stays
// dark in a lit room.

export const PALETTE = {
  // Grounds. Text sits only on the first three.
  void: "#0f0e0d", // the tube's bottom, insets, the darkest shadow
  room: "#1d2021", // the room behind the console
  tube: "#2a2826", // the tube's centre
  raised: "#2a2826", // the console, the chassis, cards
  line: "#45403d", // borders, hairlines, the chassis edge; never text

  // Text.
  text: "#d4be98",
  muted: "#a89984",
  faint: "#5a524c", // footers, ranks, the marquee, the skip hint

  // Accents.
  mark: "#00e5ff", // the A-mark, the name, A, the ship, the tunnel
  voice: "#d8a657", // the machine's voice: PRESS START, READY., INSERT COIN, the lit row
  ok: "#7daea3", // OK, status, deployed
  halo: "#89bfad", // the phosphor bloom behind every letter
  quiet: "#6a95a8", // the quiet accent: a status that is not live
  coin: "#ffb800", // the coin and only the coin: the slot, the credit, rank 1
  danger: "#ea6962", // danger text, B's label
  hot: "#ff2266", // strokes and glows: the boss, B's ring, GAME OVER
  mint: "#00ffd0", // lasers, the dust, the game's second voice
  rose: "#d3869b", // the warm side of a chromatic ghost

  // Mixers, only ever through alpha(): catch-lights and shade.
  white: "#ffffff",
  black: "#000000",
};

// The chromatic fringe on the A-mark and the boss: a warm ghost to the left,
// a cool one to the right.
export const FRINGE = { warm: "#db7497", cool: "#0050ff" };

// The panel's plastics: each key as its highlight, body and shadow, and the
// action buttons with their ring.
export const CHROME = {
  dpad: ["#3a3632", "#2e2a27", "#241f1c"],
  centre: ["#1c1e2e", "#121420", "#242636"],
  b: ["#5a2a28", "#3e1a18", "#2c1210", "#5a3a38"],
  a: ["#164458", "#0c2a3a", "#071828", "#1e6888"],
};

// The game's chrome: the HUD, the overlays, the hits. The bugs keep their own.
export const GAME = {
  hud: "#8fa0b3",
  hudDim: "#778899",
  hudFaint: "#666677",
  ink: "#1a1410", // text on a lit pill
  shade: "#080a0e", // the overlays' glass, through alpha()
  hit: "#ff2222",
  end: "#ff5a6a", // the END button
  enraged: "#ff6600", // the boss bar while it is angry
};

// The tunnel behind the console: twelve rings from near to far, and the dust.
export const TUNNEL = {
  rings: [
    PALETTE.mark,
    PALETTE.mint,
    PALETTE.mark,
    "#44aaff",
    "#4488ff",
    "#4466dd",
    "#5544cc",
    "#6644ff",
    "#5533bb",
    "#4422aa",
    "#331199",
    "#221088",
  ],
  dust: [PALETTE.mint, PALETTE.mark, "#4488ff", "#6644ff"],
};

// The synth's two knob colours and the coherence field's three states.
export const SYNTH = { cool: "#44aaff", warm: "#ff6644" };
export const FIELD = { live: "#00dcb4", on: "#dc4632", off: "#5a8a7a" };

// A token as an rgba() string, for glows, fills and hairlines.
export function alpha(hex, a) {
  const h = hex.slice(1);
  const s = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(s, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// The semantic set as custom properties, for the stylesheets and the head.
export const CABINET_VARS = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [`--cab-${k}`, v]),
);

export const cabinetCss = `:root{${Object.entries(CABINET_VARS)
  .map(([k, v]) => `${k}:${v}`)
  .join(";")}}`;
