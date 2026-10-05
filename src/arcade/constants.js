import { PROJECTS } from "../data/projects";
import { WORDS } from "../data/profile";

// The marquee on the select screen: what a cabinet's lit sign does, it
// advertises the games. One cartridge after another, each with its tagline,
// rendered twice back-to-back so the crawl loops seamlessly and text is on
// screen from t=0. Nothing about the operator: the sticker above it has that.
export const MARQUEE_TEXT = PROJECTS.filter((p) => p.tagline)
  .map((p) => `${p.title}: ${p.tagline}`)
  .join(" · ");

// The crawl runs at about 2.8 characters a second whatever its length.
export const MARQUEE_SECONDS = Math.round(MARQUEE_TEXT.length / 2.8);

// Boot log discipline: every project line is a claim that stays literally
// true (the cartridge and README carry the receipts). Lines are dot-aligned
// at 44 chars, the widest that ships on mobile. BootScreen colors any line
// containing "OK" as a pass. The operator signs off before READY.
export const BOOT_LINES = [

  "OPERATOR: MORGAN ESPITIA",
  "",
  "AMPACTOR BIOS v7.7.7",
  "systems ........ distributed ............ OK",
  "mentl .......... compiling .............. OK",
  "sonido ......... processing ............. OK",
  "noodles ........ sequencing ............. OK",
  "2-top .......... synchronizing .......... OK",
  "turbosort ...... benchmarking ........... OK",
  "clob ........... learning ............... OK",
  "tokensafe ...... scanning ............... OK",
  "landed ......... gating ................. OK",
  "easter eggs .... hidden ................. OK",
  "",
  WORDS.boot,
  "",
  "READY.",
];
