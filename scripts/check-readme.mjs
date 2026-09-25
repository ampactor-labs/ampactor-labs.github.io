#!/usr/bin/env node
// Check one README against docs/README-STANDARD.md before it is pushed. It
// needs only Node, so it runs from any project's directory:
//
//   node path/to/ampactor-labs.github.io/scripts/check-readme.mjs README.md
//
// Prints the sentence the site would show as the project's card, then each
// error, rename and warning. Exits 0 when the README meets the standard.

import { readFileSync } from "node:fs";
import { checkReadme, summaryOf } from "./sync-readmes.mjs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/check-readme.mjs path/to/README.md");
  process.exit(2);
}

let md;
try {
  md = readFileSync(file, "utf8");
} catch (err) {
  console.error(`check-readme: ${err.message}`);
  process.exit(2);
}

const { errors, renames, warnings, meetsStandard } = checkReadme(md);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

console.log(`card     ${summaryOf(md) || "(none: no lead paragraph)"}`);
for (const e of errors) console.log(`error    ${e}`);
for (const r of renames) console.log(`rename   ${r}`);
for (const w of warnings) console.log(`warning  ${w}`);
console.log(
  meetsStandard
    ? `\nmeets the standard, ${plural(warnings.length, "warning")}`
    : `\ndoes not meet the standard: ${plural(errors.length, "error")}, ${plural(renames.length, "rename")}`,
);
process.exit(meetsStandard ? 0 : 1);
