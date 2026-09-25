// Prints axe-core violations for one or more pages of a running build,
// compactly: rule, impact, the offending element, and why. A development
// aid for the accessibility pass; the e2e suite is the gate.
//
//   npx vite preview --port 4174 &
//   node scripts/axe-report.mjs http://localhost:4174/receipts/ [--light] [--phone]
/* global localStorage -- the init script below runs inside the page, not in Node */
import { chromium, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const args = process.argv.slice(2);
const urls = args.filter((a) => !a.startsWith("--"));
const light = args.includes("--light");
const phone = args.includes("--phone");

if (!urls.length) {
  console.error(
    "usage: node scripts/axe-report.mjs <url> [<url>…] [--light] [--phone]",
  );
  process.exit(2);
}

const browser = await chromium.launch();
const colorScheme = light ? "light" : "dark";
const context = await browser.newContext(
  phone
    ? { ...devices["Pixel 7"], colorScheme, ignoreHTTPSErrors: true }
    : {
        viewport: { width: 1280, height: 800 },
        colorScheme,
        ignoreHTTPSErrors: true,
      },
);
if (light) {
  await context.addInitScript(() =>
    localStorage.setItem("ampactor_theme", "patina-light"),
  );
}
let failures = 0;
for (const url of urls) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).analyze();
  console.log(
    `\n${url}  ${light ? "light" : "dark"}  ${phone ? "phone" : "desktop"}`,
  );
  if (!results.violations.length) console.log("  no violations");
  for (const v of results.violations) {
    failures += v.nodes.length;
    console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    for (const node of v.nodes) {
      const why = node.any
        .concat(node.all, node.none)
        .map((c) => c.message)
        .join(" | ");
      console.log(
        `    - ${node.target.join(" ")}\n      ${node.html.slice(0, 140)}\n      ${why}`,
      );
    }
  }
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
