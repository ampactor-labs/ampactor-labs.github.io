import { test, expect, type Page } from "@playwright/test";

// The title card's address: the origin and nothing else.
const HOME_URL = /^https?:\/\/[^/]+\/$/;

// The new page reports whether it arrived through a view transition.
async function recordArrival(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("ampactor_visited", "1");
    const w = window as unknown as { __arrivedByTransition: boolean | null };
    w.__arrivedByTransition = null;
    window.addEventListener("pagereveal", (event) => {
      w.__arrivedByTransition = !!(
        event as Event & { viewTransition?: unknown }
      ).viewTransition;
    });
  });
}

const arrivedByTransition = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __arrivedByTransition: boolean | null })
        .__arrivedByTransition,
  );

test("leaving the cabinet for the ledger is one place, not a cut", async ({
  page,
}) => {
  await recordArrival(page);
  await page.goto("/arcade/#high-scores");
  await page.getByRole("link", { name: /FULL LEDGER/ }).click();
  await expect(page).toHaveURL(/\/receipts\/$/);
  await expect.poll(() => arrivedByTransition(page)).toBe(true);

  await page.getByRole("link", { name: "Ampactor Labs, home" }).click();
  await expect(page).toHaveURL(HOME_URL);
  await expect.poll(() => arrivedByTransition(page)).toBe(true);
  await expect(page.getByRole("button", { name: "PRESS START" })).toBeVisible();
});

test("with reduced motion the pages cut, as they always did", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recordArrival(page);
  await page.goto("/arcade/#high-scores");
  await page.getByRole("link", { name: /FULL LEDGER/ }).click();
  await expect(page).toHaveURL(/\/receipts\/$/);
  await expect.poll(() => arrivedByTransition(page)).toBe(false);
});

test("blocks below the fold settle in as they scroll into view", async ({
  page,
}) => {
  await page.goto("/craft/");
  const block = page.locator(".reveal").last();
  // Well below the fold at the top of the page: not yet in.
  expect(
    Number(await block.evaluate((el) => getComputedStyle(el).opacity)),
  ).toBeLessThan(1);
  await block.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 200);
  await expect(block).toHaveCSS("opacity", "1");
});

test("with reduced motion every block is simply there", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/craft/");
  await expect(page.locator(".reveal").last()).toHaveCSS("opacity", "1");
});
