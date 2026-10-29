import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settled } from "./settled";

// The cabinet is the page. "/" and "/arcade/" are its project list; a
// cartridge or an operator program is "/arcade/#<id>", and Back walks out to
// the list. A first visit boots the machine before the list.
const LIST = { name: "Project list" };
const NAME = { level: 1, name: "MORGAN ESPITIA · SOFTWARE ENGINEER" };
// Home's address: the origin and nothing else ("/arcade/" also ends in a
// slash).
const HOME_URL = /^https?:\/\/[^/]+\/$/;

async function landOnList(page: Page) {
  await page.addInitScript(() => localStorage.setItem("ampactor_visited", "1"));
  await page.goto("/");
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
}

test("home is the list: accessible, and it says who", async ({ page }) => {
  await landOnList(page);
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole("heading", NAME)).toBeVisible();
  await expect(page.getByRole("button", { name: "PRESS START" })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-stage", "");
  await settled(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

// An iPhone SE with Safari's bars: the shortest tube in common use. The name
// and the first cartridge are both on screen.
test.describe("on a short phone", () => {
  test.use({ viewport: { width: 375, height: 548 } });

  test("the name and the first cartridge are in view", async ({ page }) => {
    await landOnList(page);
    await expect(page.getByRole("heading", NAME)).toBeInViewport();
    await expect(page.getByRole("option").first()).toBeInViewport();
  });
});

test("the list's header has the résumé, GitHub and LinkedIn", async ({
  page,
}) => {
  await landOnList(page);
  const operator = page.getByRole("navigation", { name: "Operator" });
  await expect(operator.getByRole("link", { name: "RESUME" })).toHaveAttribute(
    "href",
    "/resume.html",
  );
  await expect(operator.getByRole("link", { name: "GITHUB" })).toHaveAttribute(
    "href",
    /github\.com/,
  );
  await expect(
    operator.getByRole("link", { name: "LINKEDIN" }),
  ).toHaveAttribute("href", /linkedin\.com/);
});

test("Escape on the list goes nowhere: there is nothing behind it", async ({
  page,
}) => {
  await landOnList(page);
  const entries = await page.evaluate(() => history.length);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(entries);
});

test("browser Back walks cartridge → list", async ({ page }) => {
  await landOnList(page);
  const list = page.getByRole("listbox", LIST);
  await page.getByRole("option", { name: /MENTL/ }).click();
  await expect(page).toHaveURL(/\/arcade\/#mentl$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "MENTL" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(HOME_URL);
  await expect(list).toBeVisible();
});

test("a deep link opens the cartridge, and Back lands on the list, not off-site", async ({
  page,
}) => {
  await landOnList(page);
  await page.goto("/arcade/#sonido");
  await expect(
    page.getByRole("heading", { level: 1, name: "SONIDO" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
});

test("the operator programs open by deep link", async ({ page }) => {
  await landOnList(page);
  await page.goto("/arcade/#high-scores");
  await expect(
    page.getByRole("heading", { level: 1, name: "HIGH SCORES" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /FULL LEDGER/ })).toHaveAttribute(
    "href",
    "/receipts/",
  );
  await page.goto("/arcade/#credits");
  await expect(
    page.getByRole("heading", { level: 1, name: "CREDITS" }),
  ).toBeVisible();
  await expect(page.getByText("MAKE ART WITH YOUR FRIENDS")).toBeVisible();
  await expect(page.getByRole("link", { name: /FULL RÉSUMÉ/ })).toHaveAttribute(
    "href",
    "/resume.html",
  );
});

test("a hash naming nothing is corrected to the list, address included", async ({
  page,
}) => {
  await landOnList(page);
  await page.goto("/arcade/#no-such-thing");
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
  await expect(page).toHaveURL(/\/arcade\/$/);
});

// A fresh context is a first visit: nothing in storage.
test.describe("the first visit", () => {
  const visited = (page: Page) =>
    page.evaluate(() => localStorage.getItem("ampactor_visited"));

  test("powers on, prints the BIOS, and lands on the list by itself", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-stage", "");
    await expect(page.getByRole("listbox", LIST)).toHaveCount(0);
    const entries = await page.evaluate(() => history.length);
    await expect(page.getByText(/AMPACTOR BIOS/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("listbox", LIST)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(HOME_URL);
    expect(await page.evaluate(() => history.length)).toBe(entries);
    expect(await visited(page)).toBe("1");
  });

  // That a key cuts the boot short, rather than the boot finishing on its
  // own, is proved with fake timers in useCabinetState's tests.
  test("a key during the BIOS lands on the list", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(
      () => /AMPACTOR BIOS/.test(document.body.innerText),
      null,
      { polling: 40, timeout: 15_000 },
    );
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox", LIST)).toBeVisible({
      timeout: 3_000,
    });
    expect(await visited(page)).toBe("1");
  });

  // Every line is laid out before it prints, so nothing on the tube moves
  // while the BIOS prints: no layout shift from the power-on to READY.
  test("the BIOS prints in place", async ({ page }) => {
    type Shift = PerformanceEntry & { value: number; hadRecentInput: boolean };
    await page.addInitScript(() => {
      const shifts: number[] = [];
      Object.assign(window, { __shifts: shifts });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Shift[])
          if (!entry.hadRecentInput) shifts.push(entry.value);
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await page.waitForFunction(
      () => /READY\./.test(document.body.innerText),
      null,
      { polling: 40, timeout: 15_000 },
    );
    const shifts = await page.evaluate(
      () => (window as unknown as { __shifts: number[] }).__shifts,
    );
    expect(shifts).toEqual([]);
  });

  test("with reduced motion the machine still boots, without the power-on", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByText(/AMPACTOR BIOS/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("listbox", LIST)).toBeVisible({
      timeout: 10_000,
    });
    expect(await visited(page)).toBe("1");
  });

  test("straight to /arcade/, the machine boots, then the list", async ({
    page,
  }) => {
    await page.goto("/arcade/");
    await expect(page.getByText(/AMPACTOR BIOS/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("listbox", LIST)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/arcade\/$/);
    expect(await visited(page)).toBe("1");
  });
});
