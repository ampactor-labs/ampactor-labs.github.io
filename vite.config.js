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
            }),
          )
          .replace("<!-- site:noscript -->", renderNoscript(entry));
      },
    },
  };
}

export default defineConfig({
  plugins: [siteHead(), react()],
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
    },
  },
});
