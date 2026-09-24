// One source for every document head. vite.config.js renders these into each
// HTML entry at dev and build time, so /, /arcade/ and /receipts/ cannot drift
// apart the way three hand-kept <head>s would. Identity comes from profile.js;
// the noscript project list comes from projects.js.
import { CONTACT } from "./profile.js";
import { PROJECTS } from "./projects.js";

export const SITE = {
  origin: "https://ampactor.dev",
  name: "Morgan Espitia",
  jobTitle: "Software Engineer",
  // The one line of range under the name. No title, no industry.
  range: "Compilers, synths, games, and the apps around them. Shipped, with receipts.",
  locality: "Salt Lake City",
  region: "UT",
  fonts:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@300;400;600&family=Press+Start+2P&family=Share+Tech+Mono&display=swap",
  knowsAbout: [
    "TypeScript",
    "React",
    "Node.js",
    "Vite",
    "Rust",
    "WebAssembly",
    "Compiler Construction",
    "Digital Signal Processing",
    "Embedded Systems",
    "Rollback Netcode",
    "Full-Stack Web Development",
    "REST APIs",
    "PostgreSQL",
    "PHP",
    "Audio Engineering",
  ],
};

// Keyed by the entry's path relative to the project root.
export const ENTRIES = {
  "index.html": {
    path: "/",
    title: `${SITE.name} — ${SITE.jobTitle}, ${SITE.locality}`,
    description:
      "Software engineer in Salt Lake City. Compilers, synths, games, and the apps around them: six years employed full-stack, then a studio that ships in the open.",
    image: "/og-cabinet.png",
    person: true,
  },
  "arcade/index.html": {
    path: "/arcade/",
    title: `Arcade — ${SITE.name}`,
    description:
      "The cabinet. Every project as a cartridge, three hidden programs behind the coin slot, and a vector shooter with a global top ten.",
    image: "/og-cabinet.png",
    person: false,
  },
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// JSON-LD sits inside a <script>; the one sequence that could end it early is
// escaped the JSON way, which every parser still reads as the same string.
const jsonForScript = (value) =>
  JSON.stringify(value, null, 2).replace(/<\//g, "<\\/");

function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.name,
    jobTitle: SITE.jobTitle,
    description: SITE.range,
    url: `${SITE.origin}/`,
    email: CONTACT.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.locality,
      addressRegion: SITE.region,
    },
    sameAs: [CONTACT.github, CONTACT.linkedin],
    knowsAbout: SITE.knowsAbout,
  };
}

// Everything a <head> needs beyond charset and viewport. `prepaint` is the
// theme script from src/lib/theme.ts and `bootShim` is src/head/boot-shim.js;
// both are inlined so they run before any stylesheet or module.
export function renderHead(entry, { prepaint, bootShim }) {
  const url = `${SITE.origin}${entry.path}`;
  const image = `${SITE.origin}${entry.image}`;
  const title = escapeHtml(entry.title);
  const description = escapeHtml(entry.description);
  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="color-scheme" content="dark light" />`,
    `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1d2021" />`,
    `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f2e5bc" />`,
  ];
  if (entry.person) {
    lines.push(
      `<script type="application/ld+json">${jsonForScript(personJsonLd())}</script>`,
    );
  }
  lines.push(
    `<script>${prepaint}</script>`,
    `<link rel="stylesheet" href="/tokens.css" />`,
    `<link rel="icon" href="/favicon.ico" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />`,
    `<link rel="apple-touch-icon" href="/logo-192.png" />`,
    `<script>${bootShim}</script>`,
    `<link rel="preconnect" href="https://fonts.googleapis.com" />`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`,
    `<link href="${SITE.fonts}" rel="stylesheet" />`,
  );
  return lines.join("\n    ");
}

// The page as a reader without JavaScript (or a crawler) sees it: the same
// facts, no theatre. Derived from the data so it cannot go stale.
export function renderNoscript(entry) {
  const contact = [
    `${SITE.locality}, ${SITE.region}`,
    `<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>`,
    `<a href="${CONTACT.github}">github.com/ampactor-labs</a>`,
    `<a href="/resume.html">Résumé</a>`,
  ].join(" &middot; ");
  const projects = PROJECTS.map(
    (p) =>
      `<li><strong>${escapeHtml(p.title)}</strong> &mdash; ${escapeHtml(
        p.outcome || p.desc,
      )}${p.live ? ` <a href="${p.live}">Live</a>` : ""}${
        p.github ? ` <a href="${p.github}">Source</a>` : ""
      }</li>`,
  ).join("\n          ");
  const arcadeNote =
    entry.path === "/arcade/"
      ? `<p>The arcade cabinet needs JavaScript. Here is the same work as a list.</p>`
      : "";
  return `<noscript>
      <div style="max-width: 760px; margin: 0 auto; padding: 40px 20px; font: 16px/1.6 system-ui, sans-serif">
        <h1 style="margin: 0 0 6px">${escapeHtml(SITE.name)}</h1>
        <p style="margin: 0 0 18px">${escapeHtml(SITE.range)}</p>
        <p style="margin: 0 0 24px">${contact}</p>
        ${arcadeNote}
        <h2>Work</h2>
        <ul style="padding-left: 20px">
          ${projects}
        </ul>
      </div>
    </noscript>`;
}
