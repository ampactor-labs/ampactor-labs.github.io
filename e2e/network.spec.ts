import { test, expect } from "@playwright/test";

// Every byte the pages need comes from the site itself: fonts included. A
// first paint that waits on nobody else's server, and no visitor data handed
// to one. The faces each page sets its first screen in, all self-hosted: the
// cabinet's prose is Inter and its signage Press Start; JetBrains Mono comes
// later, with the BIOS and the list's chips.
const FACES: Record<string, string[]> = {
  "/": ["Press Start 2P", "Inter"],
  "/arcade/": ["Press Start 2P", "Inter"],
  "/receipts/": ["Inter", "Press Start 2P"],
  "/craft/": ["Inter", "Press Start 2P"],
};

for (const [path, faces] of Object.entries(FACES)) {
  test(`${path} loads nothing from another origin`, async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const foreign: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith("http") && url.origin !== origin)
        foreign.push(request.url());
    });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(foreign).toEqual([]);
    // The faces in use are the self-hosted ones, loaded.
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((f) => f.status === "loaded")
        .map((f) => f.family.replace(/"/g, ""));
    });
    expect(loaded).toEqual(expect.arrayContaining(faces));
  });
}
