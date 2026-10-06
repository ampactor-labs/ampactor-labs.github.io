// The cabinet's own programs: what a real machine shows beside its games.
// They sit at the end of the select list under OPERATOR. Each has the same
// shape as a cartridge so the list, the router and the d-pad treat them
// alike; `kind` picks the screen (SystemScreen.jsx) and `links` is the rail
// the A button walks, in focus order.
import { PALETTE } from "../arcade/palette.js";

const REPO = "https://github.com/ampactor-labs/ampactor-labs.github.io";

export const SYSTEM_PROGRAMS = [
  {
    id: "how-to-play",
    kind: "howto",
    title: "HOW TO PLAY",
    subtitle: "THE CONTROLS",
    lang: "OPERATOR",
    color: PALETTE.voice,
    icon: "?",
    category: "operator",
    links: [
      { kind: "live", href: "/craft/", label: "▸ HOW THIS CABINET IS BUILT" },
      {
        kind: "github",
        href: `${REPO}/blob/main/docs/README-STANDARD.md`,
        label: "› THE README STANDARD",
      },
    ],
  },
  {
    id: "high-scores",
    kind: "scores",
    title: "HIGH SCORES",
    subtitle: "EVERY PUBLIC COMMIT",
    lang: "OPERATOR",
    color: PALETTE.voice,
    icon: "★",
    category: "operator",
    links: [
      { kind: "live", href: "/receipts/", label: "▸ FULL LEDGER" },
      {
        kind: "github",
        href: "https://github.com/ampactor-labs",
        label: "› GITHUB",
      },
    ],
  },
  {
    id: "credits",
    kind: "credits",
    title: "CREDITS",
    subtitle: "",
    lang: "OPERATOR",
    color: PALETTE.voice,
    icon: "≡",
    category: "operator",
    links: [
      { kind: "live", href: "/resume.html", label: "▸ FULL RÉSUMÉ" },
      { kind: "github", href: REPO, label: "› SOURCE" },
    ],
  },
];

export const isSystemProgram = (p) => Boolean(p && p.kind);
