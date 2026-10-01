import { CONTACT, PITCH } from "../data/profile";

// Ticker copy for the select screen and the attract loop — rendered twice
// back-to-back so the crawl loops seamlessly and text is on screen from t=0.
// After the name and the pitch, one receipt per layer of the stack, top to
// bottom, each one a cartridge.
export const MARQUEE_TEXT = [
  CONTACT.name,
  `${CONTACT.role} SINCE 2017`,
  PITCH,
  "PHONE-FIRST WEB APPS",
  "PAY-PER-CALL API",
  "DETERMINISTIC NETCODE",
  "SELF-HOSTING COMPILER",
  "ZERO-HEAP DSP KERNEL",
  "PEDAL FIRMWARE",
  "AVAILABLE FOR FULL-TIME OR CONTRACT",
  CONTACT.email,
  "github.com/ampactor-labs",
].join(" · ");

// Boot log discipline: every project line is a claim that stays literally
// true (the cartridge and README carry the receipts). Lines are dot-aligned
// at 44 chars, the widest that ships on mobile. BootScreen colors any line
// containing "OK" as a pass. The last word before READY. is the pitch.
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
  PITCH,
  "",
  "READY.",
];
