// One source for every document head. vite.config.js renders these into each
// HTML entry at dev and build time, so /, /arcade/, /receipts/ and /craft/
// cannot drift apart the way hand-kept <head>s would. Identity comes from
// profile.js; the noscript project list comes from projects.js.
import { CONTACT } from "./profile.js";
import { PROJECTS } from "./projects.js";
import receipts from "./receipts.summary.json" with { type: "json" };
import { PALETTE, cabinetCss } from "../arcade/palette.js";

const n = (v) => Number(v).toLocaleString("en-US");
const monthName = (iso) =>
  new Date(`${String(iso).slice(0, 7)}-15T00:00:00Z`).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  );

export const SITE = {
  origin: "https://ampactor.dev",
  name: "Morgan Espitia",
  jobTitle: "Software Engineer",
  // The lead under the name in the no-JS page, and the Person description.
  range:
    "Full-stack software engineer since 2017, building web apps, APIs, compilers, audio software and games.",
  locality: "Salt Lake City",
  region: "UT",
  // Self-hosted (public/fonts, src/styles/fonts.css). The two that paint
  // first are fetched from the head, before any script has rendered text:
  // Inter for the name and the line of range, Press Start 2P for the signage.
  preloadFonts: [
    "/fonts/inter-latin-wght-normal.woff2",
    "/fonts/press-start-2p-latin-400-normal.woff2",
  ],
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
    title: `${SITE.name} · ${SITE.jobTitle}, ${SITE.locality}`,
    description:
      "Morgan Espitia, software engineer in Salt Lake City. Six years of full-stack work in PHP, Node, React and TypeScript, then independent work: web apps, APIs, a compiler, audio software and games, with source on GitHub. The site is an arcade cabinet: press start.",
    // Rendered from the live title card by scripts/render-og.mjs.
    image: "/og-home.png",
    person: true,
    // The cabinet is the page: dark from the first paint in either theme.
    stage: true,
  },
  "arcade/index.html": {
    path: "/arcade/",
    title: `Arcade · ${SITE.name}`,
    description:
      "The select screen of the cabinet: eighteen projects to read about, plus HOW TO PLAY, HIGH SCORES and the credits.",
    image: "/og-home.png",
    person: false,
    stage: true,
  },
  "receipts/index.html": {
    path: "/receipts/",
    title: `Commits · ${SITE.name}`,
    // The numbers come from the ledger itself (src/data/receipts.summary.json,
    // written by scripts/sync-receipts.mjs at build), so they cannot go stale.
    description: `${n(receipts.totals.commits)} commits across ${receipts.totals.repos} public repositories since ${monthName(receipts.totals.first)}, read from git when the site is built. Filter, sort, chart and export them in the browser.`,
    image: "/og-home.png",
    person: false,
  },
  "craft/index.html": {
    path: "/craft/",
    title: `How this site is built · ${SITE.name}`,
    description:
      "A case study of this site: the arcade cabinet as the whole page, the commit log built from git, performance on a slow phone, and how it is tested. Numbers are measured on the production build.",
    image: "/og-home.png",
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
// both are inlined so they run before any stylesheet or module. A `stage`
// entry (the cabinet) marks <html> so the room is dark from the first paint
// whatever the theme. `tokens` is public/tokens.css, inlined so the palette costs no
// render-blocking request (the file stays for the pages that link it).
export function renderHead(entry, { prepaint, bootShim, tokens }) {
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
    `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${PALETTE.room}" />`,
    `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${entry.stage ? PALETTE.room : "#f2e5bc"}" />`,
  ];
  if (entry.person) {
    lines.push(
      `<script type="application/ld+json">${jsonForScript(personJsonLd())}</script>`,
    );
  }
  lines.push(`<script>${prepaint}</script>`);
  if (entry.stage)
    lines.push(
      `<script>document.documentElement.setAttribute("data-stage","")</script>`,
    );
  lines.push(
    tokens
      ? `<style>${tokens.trim()}</style>`
      : `<link rel="stylesheet" href="/tokens.css" />`,
    // The cabinet's own colours, so the room is right from the first paint.
    `<style>${cabinetCss}</style>`,
    ...SITE.preloadFonts.map(
      (href) =>
        `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`,
    ),
    `<link rel="icon" href="/favicon.ico" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />`,
    `<link rel="apple-touch-icon" href="/logo-192.png" />`,
    `<script>${bootShim}</script>`,
  );
  return lines.join("\n    ");
}

// One <url> per entry plus the static résumé, from the same table, so the
// sitemap and the pages cannot disagree. Emitted by vite.config.js at build.
export function renderSitemap() {
  const paths = [...Object.values(ENTRIES).map((e) => e.path), "/resume.html"];
  const urls = paths
    .map((path) => `  <url><loc>${SITE.origin}${path}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
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
  const arcadeNote = entry.stage
    ? `<p>The arcade cabinet needs JavaScript. Here is the same work as a list.</p>`
    : entry.path === "/receipts/"
      ? `<p>The commit log needs JavaScript to filter and chart. The data it reads is plain JSON at <a href="/receipts/data.json">/receipts/data.json</a>.</p>`
      : entry.path === "/craft/"
        ? `<p>This page needs JavaScript to show its measurements. The source and its full history are on <a href="${CONTACT.github}/ampactor-labs.github.io">GitHub</a>.</p>`
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
