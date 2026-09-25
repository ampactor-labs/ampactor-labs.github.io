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

test("the floor is accessible and puts the work one control away", async ({
  page,
}) => {
  await landOnFloor(page);
  await expect(
    page.getByRole("heading", { level: 1, name: "Morgan Espitia" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("the cabinet is laid out at its zoomed size and scaled into its slot", async ({
  page,
}) => {
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

test("entering zooms the same console to the viewport, and Escape brings it back", async ({
  page,
}) => {
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
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();

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
  await expect(
    page.getByRole("heading", { level: 2, name: "MENTL" }),
  ).toBeVisible();

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

test("a deep link opens the cartridge, and Back lands on the list, not off-site", async ({
  page,
}) => {
  await page.goto("/arcade/#sonido");
  await expect(
    page.getByRole("heading", { level: 2, name: "SONIDO" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to the floor" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", ENTER)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("reduced motion skips the tween and lands in the same place", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await landOnFloor(page);
  await page.getByRole("button", ENTER).click();
  await expect(page.getByRole("dialog", { name: "Arcade" })).toBeVisible();
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
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
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "patina-light",
  );
  const consoleEl = page.locator(".cabinet-scope");
  await expect(consoleEl).toHaveCSS("background-color", "rgb(42, 40, 38)");
  await page.getByRole("button", { name: /switch to dark theme/i }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  expect(
    await page.evaluate(() => localStorage.getItem("ampactor_theme")),
  ).toBe("patina-dark");
});

// A fresh context is a first visit: nothing in storage.
test.describe("the first visit", () => {
  const SHOW = "[data-cold-open][data-zoomed='true']";
  const visited = (page: Page) =>
    page.evaluate(() => localStorage.getItem("ampactor_visited"));

  test("opens inside the machine, then the camera pulls back to the room", async ({
    page,
  }) => {
    await page.goto("/");
    // Marked before first paint; the machine full-screen, and a picture to
    // assistive tech, which reads the floor underneath.
    await expect(page.locator("html")).toHaveAttribute("data-cold-open");
    await expect(page.locator(SHOW)).toBeAttached();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Morgan Espitia" }),
    ).toBeAttached();
    const entries = await page.evaluate(() => history.length);

    await expect(page.getByRole("button", ENTER)).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.locator("html")).not.toHaveAttribute("data-cold-open");
    await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(() => history.length)).toBe(entries);
    expect(await visited(page)).toBe("1");
    // The camera kept the top of the page, where the name is.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Morgan Espitia" }),
    ).toBeInViewport();

    // It has booted once: walking up now cuts straight to the list.
    await page.getByRole("button", ENTER).click();
    await expect(
      page.getByRole("listbox", { name: "Project list" }),
    ).toBeVisible();
  });

  test("a key ends the show at once, and Tab still moves focus", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(SHOW)).toBeAttached();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
    await expect(page.getByRole("button", ENTER)).toBeVisible({
      timeout: 2_500,
    });
    expect(await visited(page)).toBe("1");
  });

  test("reduced motion lands straight on the floor", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("button", ENTER)).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute("data-cold-open");
    expect(await visited(page)).toBeNull();
  });

  test("an anchor is a destination: /#how lands on the section, address intact", async ({
    page,
  }) => {
    await page.goto("/#how");
    await expect(page.locator("html")).not.toHaveAttribute("data-cold-open");
    await expect(page).toHaveURL(/\/#how$/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Receipts over claims" }),
    ).toBeInViewport();
  });

  test("straight to /arcade/, the machine still boots, then the list", async ({
    page,
  }) => {
    await page.goto("/arcade/");
    await expect(page.getByRole("dialog", { name: "Arcade" })).toBeVisible();
    await expect(page.getByText("PRESS ANY KEY")).toBeVisible({
      timeout: 15_000,
    });
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("listbox", { name: "Project list" }),
    ).toBeVisible();
    expect(await visited(page)).toBe("1");
  });
});
