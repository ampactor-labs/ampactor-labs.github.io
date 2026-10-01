// Single source of truth for identity, contact, and positioning copy: the
// cabinet's screens, the ticker and the pages' <head> (site.js) read it. The
// résumé has its own source, src/data/resume.json.

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
  role: "SOFTWARE ENGINEER",
  email: "ampactorlabs@gmail.com",
  location: "Salt Lake City, UT",
  github: "https://github.com/ampactor-labs",
  linkedin: "https://www.linkedin.com/in/ampactor-labs/",
  // Set to a Cal.com / Calendly URL to light up the "Book a call" CTA.
  // While null, the lobby falls back to email-only.
  scheduler: null,
  phoneTel: PHONE_DIGITS.join(""),
  phoneDisplay: `+1 ${PHONE_DIGITS.slice(2, 5).join("")}-${PHONE_DIGITS.slice(
    5,
    8,
  ).join("")}-${PHONE_DIGITS.slice(8).join("")}`,
};

// The primary call to action. No prefilled subject: whoever writes knows
// better than a default what the email is about.
export const MAILTO = `mailto:${CONTACT.email}`;

// The pitch: one line, said the same way wherever the site describes its
// author (the boot's last line before READY., the title card, the ticker,
// the pages' descriptions). RANGE is its receipts, from the top of the stack
// to the bottom; every layer is a cartridge.
export const PITCH = "FULL STACK, ALL THE WAY DOWN";
export const RANGE = ["WEB APPS", "APIS", "COMPILERS", "DSP", "FIRMWARE"];
