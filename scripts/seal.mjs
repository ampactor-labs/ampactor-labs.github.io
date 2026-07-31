#!/usr/bin/env node
// Seal one or more HTML documents into public/keep/vault.json.
//
// The vault is AES-GCM ciphertext. Only the salt, IV, and iteration count are
// public; document titles live inside the encrypted payload, so an unopened
// vault doesn't leak what's in it.
//
// The passphrase is prompted, never read from argv or an env var, so it stays
// out of shell history and out of the process table.
//
//   node scripts/seal.mjs ~/Projects/four-days.html [more.html ...]

import { webcrypto as crypto } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ITERATIONS = 600_000;
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "keep",
  "vault.json",
);

function ask(question, { hidden = false } = {}) {
  return new Promise((done, fail) => {
    const { stdin, stdout } = process;
    if (hidden && !stdin.isTTY) {
      fail(
        new Error(
          "Refusing to read a passphrase from a pipe. Run this in a terminal.",
        ),
      );
      return;
    }
    stdout.write(question);
    if (!hidden) {
      stdin.setEncoding("utf8");
      stdin.once("data", (d) => done(d.trim()));
      stdin.resume();
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    // Raw mode hands over whatever arrived, so a pasted passphrase lands as a
    // single chunk. Walk it character by character, or the paste comes through
    // whole, newline and all.
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      done(buf);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") return finish();
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") buf = buf.slice(0, -1);
        else buf += ch;
      }
    };
    stdin.on("data", onData);
  });
}

const b64 = (buf) => Buffer.from(buf).toString("base64");

async function deriveKey(passphrase, salt) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
}

function titleOf(html, file) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : basename(file).replace(/\.html?$/i, "");
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node scripts/seal.mjs <file.html> [more.html ...]");
  process.exit(1);
}

const docs = [];
for (const file of files) {
  const html = await readFile(file, "utf8");
  docs.push({ title: titleOf(html, file), html });
  console.log(
    `  + ${titleOf(html, file)}  (${(html.length / 1024).toFixed(1)} KB)`,
  );
}

const passphrase = await ask("\nPassphrase: ", { hidden: true });
if (passphrase.length < 12) {
  console.error(
    `\nThat is ${passphrase.length} characters. An attacker who downloads the vault\n` +
      "can guess offline as fast as their hardware allows, so length is the only\n" +
      "thing protecting it. Use at least 12 characters, ideally a few words.",
  );
  process.exit(1);
}
const again = await ask("Again:      ", { hidden: true });
if (passphrase !== again) {
  console.error("\nThose did not match. Nothing was written.");
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const key = await deriveKey(passphrase, salt);
const plaintext = new TextEncoder().encode(JSON.stringify(docs));
const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

await mkdir(dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({
    v: 1,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: ITERATIONS,
      salt: b64(salt),
    },
    cipher: "AES-GCM",
    iv: b64(iv),
    ct: b64(ct),
  }),
);

console.log(`\nSealed ${docs.length} document(s) to public/keep/vault.json`);
console.log(
  "Commit and push; the Pages workflow deploys it to ampactor.dev/keep/",
);
