import { test, expect } from "@playwright/test";

// Every byte the pages need comes from the site itself: fonts included. A
// first paint that waits on nobody else's server, and no visitor data handed
// to one.
for (const path of ["/", "/receipts/", "/arcade/", "/craft/"]) {
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
    expect(loaded).toEqual(expect.arrayContaining(["Inter", "Press Start 2P"]));
  });
}
