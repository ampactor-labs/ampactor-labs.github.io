import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ENTER = { name: "Enter the arcade", exact: true };

async function landOnFloor(page: Page, { visited = true } = {}) {
  await page.addInitScript((v) => {
    if (v) localStorage.setItem("ampactor_visited", "1");
  }, visited);
  await page.goto("/");
  await expect(page.getByRole("button", ENTER)).toBeVisible();
}

test("the floor is accessible and puts the work one control away", async ({ page }) => {
  await landOnFloor(page);
  await expect(page.getByRole("heading", { level: 1, name: "Morgan Espitia" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("the cabinet is laid out at its zoomed size and scaled into its slot", async ({ page }) => {
  await landOnFloor(page);
  const consoleEl = page.locator("[data-zoomed='false'].cabinet-scope");
  const layout = await consoleEl.evaluate((el) => ({
    w: (el as HTMLElement).offsetWidth,
    h: (el as HTMLElement).offsetHeight,
  }));
  const viewport = page.viewportSize()!;
  expect(layout.w).toBe(Math.min(900, viewport.width));
  const box = (await consoleEl.boundingBox())!;
  expect(box.width).toBeLessThan(layout.w);
  expect(box.width / layout.w).toBeCloseTo(box.height / layout.h, 2);
});

test("entering zooms the same console to the viewport, and Escape brings it back", async ({ page }) => {
  await landOnFloor(page);
  const enter = page.getByRole("button", ENTER);
  const consoleEl = page.locator(".cabinet-scope");
  // Document coordinates: clicking may scroll the control into view first,
  // and the cabinet must come back to where it stands on the page, not to
  // where it happened to be in the viewport.
  const pageRect = async () => {
    const box = (await consoleEl.boundingBox())!;
    const scrollY = await page.evaluate(() => window.scrollY);
    return { width: box.width, top: box.y + scrollY };
  };
  const floorRect = await pageRect();

  await enter.click();
  const dialog = page.getByRole("dialog", { name: "Arcade" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(dialog).toBeFocused();
  // Settled: the same element now fills the viewport width (max 900) and height.
  await expect(async () => {
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(Math.round(box.width)).toBe(Math.min(900, viewport.width));
    expect(Math.round(box.height)).toBe(viewport.height);
    expect(Math.round(box.y)).toBe(0);
  }).toPass();
  // The floor is locked and inert behind it.
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
  await expect(page.getByRole("banner")).toHaveAttribute("inert", "");
  await expect(page.getByRole("listbox", { name: "Project list" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
  await expect(page.getByRole("button", ENTER)).toBeFocused();
  const backRect = await pageRect();
  expect(Math.round(backRect.width)).toBe(Math.round(floorRect.width));
  expect(Math.round(backRect.top)).toBe(Math.round(floorRect.top));
});

test("browser Back walks cartridge → select → floor", async ({ page }) => {
  await landOnFloor(page);
  await page.getByRole("button", ENTER).click();
  const list = page.getByRole("listbox", { name: "Project list" });
  await expect(list).toBeVisible();
  await page.getByRole("option", { name: /MENTL/ }).click();
  await expect(page).toHaveURL(/\/arcade\/#mentl$/);
  await expect(page.getByRole("heading", { level: 2, name: "MENTL" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(list).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goForward();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("a deep link opens the cartridge, and Back lands on the list, not off-site", async ({ page }) => {
  await page.goto("/arcade/#sonido");
  await expect(page.getByRole("heading", { level: 2, name: "SONIDO" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("listbox", { name: "Project list" })).toBeVisible();
  await page.getByRole("button", { name: "Back to the floor" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", ENTER)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("reduced motion skips the tween and lands in the same place", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await landOnFloor(page);
  await page.getByRole("button", ENTER).click();
  await expect(page.getByRole("dialog", { name: "Arcade" })).toBeVisible();
  await expect(page.getByRole("listbox", { name: "Project list" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", ENTER)).toBeFocused();
});

test("with the lights on, the cabinet stays dark", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ampactor_theme", "patina-light");
    localStorage.setItem("ampactor_visited", "1");
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "patina-light");
  const consoleEl = page.locator(".cabinet-scope");
  await expect(consoleEl).toHaveCSS("background-color", "rgb(42, 40, 38)");
  await page.getByRole("button", { name: /switch to dark theme/i }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  expect(await page.evaluate(() => localStorage.getItem("ampactor_theme"))).toBe("patina-dark");
});

test("first visit: the machine boots, then the list", async ({ page }) => {
  await landOnFloor(page, { visited: false });
  await page.getByRole("button", ENTER).click();
  await expect(page.getByRole("dialog", { name: "Arcade" })).toBeVisible();
  await expect(page.getByText("PRESS ANY KEY")).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox", { name: "Project list" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("ampactor_visited"))).toBe("1");
});
