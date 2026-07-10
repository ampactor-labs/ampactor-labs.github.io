// Single source of truth for identity, contact, and positioning copy.
// Consumed by SelectScreen. The static public/resume.html mirrors
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
  phoneDisplay: `+1 ${PHONE_DIGITS.slice(2, 5).join("")}-${PHONE_DIGITS.slice(
    5,
    8,
  ).join("")}-${PHONE_DIGITS.slice(8).join("")}`,
};

// mailto with a prefilled subject — lowest-friction primary CTA.
export const MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "Project inquiry",
)}`;
