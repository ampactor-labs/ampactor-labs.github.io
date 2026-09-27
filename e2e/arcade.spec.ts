import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The title card's address: the origin and nothing else.
const HOME_URL = /^https?:\/\/[^/]+\/$/;

// The select screen at /arcade/ and the programs it opens, driven from the
// keyboard and the panel. A returning visitor: the machine has booted before.
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

test("the list is accessible, and the operator's programs end it", async ({
  page,
}) => {
  await page.goto("/arcade/");
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  const names = await page
    .getByRole("option")
    .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
  expect(names.slice(-3).map((n) => n?.split(" — ")[0])).toEqual([
    "HOW TO PLAY",
    "HIGH SCORES",
    "CREDITS",
  ]);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("up from the top wraps to CREDITS; B steps out to the list, then the title card", async ({
  page,
}) => {
  await page.goto("/arcade/");
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("option", { selected: true }),
  ).toHaveAccessibleName(/CREDITS/);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#credits$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "CREDITS" }),
  ).toBeVisible();
  await expect(page.getByText("THANK YOU FOR PLAYING")).toBeAttached();

  // The panel's B, not the screen's own ◄.
  const B = page.getByRole("button", { name: "Back", exact: true });
  await B.click();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  // A B mashed right after closing a program must not also leave; past the
  // settle window it does.
  await page.waitForTimeout(450);
  await B.click();
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole("button", { name: "PRESS START" })).toBeVisible();
});

test("HIGH SCORES is the ledger in the cabinet's own words", async ({
  page,
}) => {
  await page.goto("/arcade/#high-scores");
  await expect(
    page.getByRole("heading", { level: 2, name: "HIGH SCORES" }),
  ).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader", { name: "RANK" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "SCORE" })).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(11); // header + top 10
  await expect(page.getByRole("img", { name: /Commits per month/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /FULL LEDGER/ })).toHaveAttribute(
    "href",
    "/receipts/",
  );
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("the coin slot still unlocks the hidden programs", async ({ page }) => {
  await page.goto("/arcade/");
  await page.getByRole("button", { name: "Insert coin" }).click();
  await expect(page.getByRole("option", { name: /TUNNEL_RUN/ })).toBeVisible();
  await expect(
    page.getByRole("option", { name: /SYS\/RESONANCE/ }),
  ).toBeVisible();
});

test("the page never scrolls: the cabinet is the viewport", async ({ page }) => {
  await page.goto("/arcade/");
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("with the lights on, the cabinet still stands in the dark", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("ampactor_theme", "patina-light"),
  );
  await page.goto("/arcade/");
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "patina-light",
  );
  await expect(page.locator(".cabinet-scope")).toHaveCSS(
    "background-color",
    "rgb(42, 40, 38)",
  );
  await expect(page.locator("[data-backdrop]")).toHaveCSS("opacity", "1");
});
