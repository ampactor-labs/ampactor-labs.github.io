import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The cabinet is the page. "/" is its title card (attract mode); PRESS START
// is the select screen at "/arcade/"; a cartridge or an operator program is
// "/arcade/#<id>". Back walks the same way out.
const START = { name: "PRESS START" };
const LIST = { name: "Project list" };
const NAME = { level: 1, name: "MORGAN ESPITIA" };
// The title card's address: the origin and nothing else ("/arcade/" also
// ends in a slash).
const HOME_URL = /^https?:\/\/[^/]+\/$/;
const titleCard = (page: Page) =>
  page.locator('[data-testid="attract-screen"][data-frame="title"]');

async function landOnTitleCard(page: Page) {
  await page.addInitScript(() => localStorage.setItem("ampactor_visited", "1"));
  await page.goto("/");
  await expect(page.getByRole("button", START)).toBeVisible();
}

test("the title card is accessible, and says who and how to reach them", async ({
  page,
}) => {
  await landOnTitleCard(page);
  await expect(titleCard(page)).toBeVisible();
  await expect(page.getByRole("heading", NAME)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ampactorlabs@gmail.com" }),
  ).toHaveAttribute("href", "mailto:ampactorlabs@gmail.com");
  await expect(page.getByText(/AVAILABLE · FULL-TIME/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-stage", "");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("PRESS START is the list, with the résumé one press away", async ({
  page,
}) => {
  await landOnTitleCard(page);
  await page.getByRole("button", START).click();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "MORGAN ESPITIA · SOFTWARE ENGINEER",
    }),
  ).toBeVisible();
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

test("Escape on the list walks back to the title card; Forward walks back in", async ({
  page,
}) => {
  await landOnTitleCard(page);
  await page.getByRole("button", START).click();
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole("button", START)).toBeVisible();
  await expect(page.getByRole("listbox", LIST)).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
});

test("browser Back walks cartridge → list → title card", async ({ page }) => {
  await landOnTitleCard(page);
  await page.getByRole("button", START).click();
  const list = page.getByRole("listbox", LIST);
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
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole("button", START)).toBeVisible();
});

test("a deep link opens the cartridge, and Back lands on the list, not off-site", async ({
  page,
}) => {
  await landOnTitleCard(page);
  await page.goto("/arcade/#sonido");
  await expect(
    page.getByRole("heading", { level: 2, name: "SONIDO" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
  // Leaving a hard-loaded list gives the title card its own entry...
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole("button", START)).toBeVisible();
  // ...so Back returns to the list.
  await page.goBack();
  await expect(page).toHaveURL(/\/arcade\/$/);
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
});

test("the operator programs open by deep link", async ({ page }) => {
  await landOnTitleCard(page);
  await page.goto("/arcade/#high-scores");
  await expect(
    page.getByRole("heading", { level: 2, name: "HIGH SCORES" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /FULL LEDGER/ })).toHaveAttribute(
    "href",
    "/receipts/",
  );
  await page.goto("/arcade/#credits");
  await expect(
    page.getByRole("heading", { level: 2, name: "CREDITS" }),
  ).toBeVisible();
  await expect(page.getByText("THANK YOU FOR PLAYING")).toBeVisible();
  await expect(page.getByRole("link", { name: /FULL RÉSUMÉ/ })).toHaveAttribute(
    "href",
    "/resume.html",
  );
});

test("a hash naming nothing is corrected to the list, address included", async ({
  page,
}) => {
  await landOnTitleCard(page);
  await page.goto("/arcade/#no-such-thing");
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
  await expect(page).toHaveURL(/\/arcade\/$/);
});

test("left and right step the attract loop", async ({ page }) => {
  await landOnTitleCard(page);
  await page.keyboard.press("ArrowRight");
  await expect(
    page.locator('[data-testid="attract-screen"][data-frame="howto"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Navigate left" }).click();
  await expect(titleCard(page)).toBeVisible();
  // Stepping the loop is not leaving it.
  await expect(page).toHaveURL(HOME_URL);
});

test("with reduced motion the title card holds still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await landOnTitleCard(page);
  await expect(page.locator(".attract-start")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.waitForTimeout(600);
  await expect(titleCard(page)).toBeVisible();
  await page.getByRole("button", START).click();
  await expect(page.getByRole("listbox", LIST)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", START)).toBeVisible();
});

// A fresh context is a first visit: nothing in storage.
test.describe("the first visit", () => {
  const visited = (page: Page) =>
    page.evaluate(() => localStorage.getItem("ampactor_visited"));

  test("powers on, prints the BIOS, and lands on the title card by itself", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-stage", "");
    await expect(page.getByText(/AMPACTOR BIOS/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", START)).toHaveCount(0);
    const entries = await page.evaluate(() => history.length);

    await expect(page.getByRole("button", START)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(HOME_URL);
    expect(await page.evaluate(() => history.length)).toBe(entries);
    expect(await visited(page)).toBe("1");

    // It has booted once: START now cuts straight to the list.
    await page.getByRole("button", START).click();
    await expect(page.getByRole("listbox", LIST)).toBeVisible();
  });

  test("a key after READY. moves on at once", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("READY.")).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", START)).toBeVisible({
      timeout: 2_000,
    });
    expect(await visited(page)).toBe("1");
  });

  test("with reduced motion the machine still boots, without the power-on", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByText(/AMPACTOR BIOS/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", START)).toBeVisible({
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
