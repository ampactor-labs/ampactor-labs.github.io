import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {
  ENTRIES,
  renderHead,
  renderNoscript,
  renderSitemap,
} from "./src/data/site.js";
import { PREPAINT_SCRIPT } from "./src/lib/theme.ts";
import { COLD_OPEN_SCRIPT } from "./src/arcade/zoom/coldOpen.ts";

const root = dirname(fileURLToPath(import.meta.url));
const bootShim = readFileSync(resolve(root, "src/head/boot-shim.js"), "utf8");
const tokens = readFileSync(resolve(root, "public/tokens.css"), "utf8");

// Renders each entry's <head> and <noscript> from src/data/site.js. The HTML
// files carry two placeholder comments and nothing else that could drift.
// The same table writes sitemap.xml into the build.
function siteHead() {
  return {
    name: "ampactor:site-head",
    enforce: "pre",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: renderSitemap(),
      });
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const key = relative(root, ctx.filename).split("\\").join("/");
        const entry = ENTRIES[key];
        if (!entry) throw new Error(`site.js has no entry for ${key}`);
        return html
          .replace(
            "<!-- site:head -->",
            renderHead(entry, {
              prepaint: PREPAINT_SCRIPT,
              coldOpen: COLD_OPEN_SCRIPT,
              bootShim,
              tokens,
            }),
          )
          .replace("<!-- site:noscript -->", renderNoscript(entry));
      },
    },
  };
}

// In the build, each page's stylesheets go inline into its <head>: the first
// paint then waits on the HTML alone, not on two more requests for 5 KB of
// gzipped CSS. The files stay in dist for anything that links them.
function inlineCss() {
  const LINK =
    /<link rel="stylesheet"(?: crossorigin)? href="\/(assets\/[^"]+\.css)">/g;
  return {
    name: "ampactor:inline-css",
    apply: "build",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        return html.replace(LINK, (tag, file) => {
          const asset = ctx.bundle[file];
          if (!asset || asset.type !== "asset") return tag;
          return `<style>${String(asset.source)}</style>`;
        });
      },
    },
  };
}

// Every page loads the same shell as one file: React, the header and footer,
// the theme, the formatters, the ledger's summary and the chart scale the
// floor's teaser borrows. Left to the automatic splitter, a module that some
// pages share but not all gets a chunk of its own, so adding a page can add a
// request to the others: /craft/ once split the chart scale out and cost the
// floor 160 ms of largest paint on a throttled phone.
// (Rolldown's own runtime stays a separate 0.4 KB file whatever the groups
// say, so every page loads three scripts: the runtime, the shell, its own.)
const SHELL = [
  // Vite's preload polyfill, which would otherwise be a tiny file of its own.
  /modulepreload-polyfill/,
  /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
  /[\\/]src[\\/](ui|styles)[\\/]/,
  /[\\/]src[\\/]lib[\\/](format|theme)\.ts$/,
  /[\\/]src[\\/]data[\\/](profile\.js|receiptsSummary\.ts|receipts\.summary\.json)$/,
  /[\\/]src[\\/]floor[\\/](Header\.tsx|Footer\.tsx|Floor\.module\.css)$/,
  /[\\/]src[\\/]receipts[\\/]charts[\\/]scale\.ts$/,
];

export default defineConfig({
  plugins: [siteHead(), react(), inlineCss()],
  base: "/",
  // GitHub Pages serves real files with no SPA fallback; the dev server
  // should fail in the same places.
  appType: "mpa",
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        Object.keys(ENTRIES).map((file) => [
          file.replace(/\/?index\.html$/, "") || "main",
          resolve(root, file),
        ]),
      ),
      output: {
        codeSplitting: {
          groups: [
            { name: "shell", test: (id) => SHELL.some((re) => re.test(id)) },
          ],
        },
      },
    },
  },
});
