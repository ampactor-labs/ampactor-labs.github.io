import { test, expect } from "@playwright/test";

// The cabinet at /arcade/, driven from the keyboard.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ampactor_visited", "1"));
});

test("the whole cabinet is playable from the keyboard", async ({ page }) => {
  await page.goto("/arcade/");
  const list = page.getByRole("listbox", { name: "Project list" });
  await expect(list).toBeVisible();
  await expect(
    page.getByRole("option", { selected: true }),
  ).toHaveAccessibleName(/MENTL/);

  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("option", { selected: true }),
  ).toHaveAccessibleName(/SONIDO/);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#sonido$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "SONIDO" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(list).toBeVisible();
});

test("the coin slot still unlocks the hidden programs", async ({ page }) => {
  await page.goto("/arcade/");
  await page.getByRole("button", { name: "Insert coin" }).click();
  await expect(page.getByRole("option", { name: /TUNNEL_RUN/ })).toBeVisible();
  await expect(
    page.getByRole("option", { name: /SYS\/RESONANCE/ }),
  ).toBeVisible();
});

test("the page does not scroll behind the zoomed cabinet", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the arcade", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: "Arcade" })).toBeVisible();
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
});

test("with the lights on, a hard-loaded arcade still stands in a dark room", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("ampactor_theme", "patina-light"),
  );
  await page.goto("/arcade/");
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  // The room is opaque around the machine and the page is pinned behind it,
  // exactly as if the visitor had walked up from the floor.
  await expect(page.locator("[data-backdrop]")).toHaveCSS("opacity", "1");
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
});
