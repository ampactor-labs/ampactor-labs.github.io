// Single source of truth for identity, contact, and positioning copy.
// Consumed by the Lobby and SelectScreen. The static public/resume.html mirrors
// this copy by hand (it cannot import JS) — keep the two in sync when editing.

// Phone kept as split digits so naive source/HTML scrapers can't lift a clean
// tel: number from the bundle. Joined at runtime.
const PHONE_DIGITS = [
  "+",
  "1",
  "4",
  "3",
  "5",
  "2",
  "6",
  "8",
  "2",
  "4",
  "4",
  "6",
];

export const CONTACT = {
  name: "MORGAN ESPITIA",
  role: "SYSTEMS ENGINEER",
  email: "ampactorlabs@gmail.com",
  location: "Salt Lake City, UT",
  github: "https://github.com/ampactor-labs",
  linkedin: "https://www.linkedin.com/in/ampactor-labs/",
  // Set to a Cal.com / Calendly URL to light up the "Book a call" CTA.
  // While null, the lobby falls back to email-only.
  scheduler: null,
  phoneTel: PHONE_DIGITS.join(""),
  phoneDisplay: `+1 (${PHONE_DIGITS.slice(2, 5).join("")}) ${PHONE_DIGITS.slice(
    5,
    8,
  ).join("")}-${PHONE_DIGITS.slice(8).join("")}`,
};

// mailto with a prefilled subject — lowest-friction primary CTA.
export const MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "Project inquiry",
)}`;

export const POSITIONING = {
  headline: "I build the hard layer.",
  subhead:
    "Compilers, real-time DSP, deterministic netcode, and from-scratch ML — in Rust. And the full-stack web, APIs, and dashboards that keep the lights on.",
  status: "Available now — contract, full-time, or fractional",
};

// Proof strip — strongest contract proof first (a live, paying product).
export const PROOF = [
  {
    icon: "◈",
    text: "A live security product taking real payments in production",
  },
  {
    icon: "☀",
    text: "A programming language that compiles itself (bit-identical bootstrap)",
  },
  {
    icon: "♫",
    text: "DSP code that runs identically on a desktop plugin and a bare-metal chip",
  },
  {
    icon: "⚡",
    text: "A sort library 3.1× faster than the Rust standard library",
  },
];

// The tiered net: elite work leads (premium anchor), everyday work stated plainly.
export const TAKE_ON = {
  hard: "Real-time audio & DSP, embedded / bare-metal, compilers & DSLs, performance-critical Rust, on-chain security, AI-agent tooling.",
  everyday:
    "Full-stack web apps, REST/GraphQL APIs, dashboards, integrations, backend services — PHP / TypeScript / Rust. Years of production experience.",
  note: "Same rigor either way. Spec → shipped. Remote — Salt Lake City, UT.",
};

// Flagship projects surfaced as lobby cards (ids from data/projects.js),
// ordered to lead with the live/paying product.
export const FLAGSHIP_IDS = ["tokensafe", "mentl", "sonido"];
