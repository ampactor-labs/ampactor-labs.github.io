import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settled } from "./settled";
import { PALETTE } from "../src/arcade/palette.js";

// The title card's address: the origin and nothing else.
const HOME_URL = /^https?:\/\/[^/]+\/$/;

// A palette token the way the browser reports a computed colour.
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

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
    page.getByRole("heading", { level: 1, name: "SONIDO" }),
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
  await settled(page);
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
    page.getByRole("heading", { level: 1, name: "CREDITS" }),
  ).toBeVisible();
  await expect(page.getByText("MAKE ART WITH YOUR FRIENDS")).toBeAttached();

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
    page.getByRole("heading", { level: 1, name: "HIGH SCORES" }),
  ).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader", { name: "RANK" })).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "SCORE" }),
  ).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(11); // header + top 10
  await expect(
    page.getByRole("img", { name: /Commits per month/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /FULL LEDGER/ })).toHaveAttribute(
    "href",
    "/receipts/",
  );
  await settled(page);
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

test("TUNNEL_RUN runs: the countdown flies into the game without an error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/arcade/");
  await page.getByRole("button", { name: "Insert coin" }).click();
  await page.getByRole("option", { name: /TUNNEL_RUN/ }).click();
  await expect(page.getByRole("button", { name: "PAUSE" })).toBeVisible();
  // Three seconds of countdown, then the ship flies: every frame draws it.
  await page.waitForTimeout(4500);
  expect(errors).toEqual([]);
});

// On a touch screen the panel's controls take a 44 px tap (the key plus its
// invisible margin) and the header's pills stand 40 px tall.
test("on a touch screen every panel control is a 44 px target", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, "the sizes are for touch screens");
  await page.goto("/arcade/");
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
  ).toBe(true);
  const controls = [
    "Navigate up",
    "Navigate down",
    "Navigate left",
    "Navigate right",
    "Back",
    "Select",
    "Insert coin",
  ];
  for (const name of controls) {
    const box = await page
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box, name).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    // A tap 21 px from the centre, in each direction, still lands on it.
    const hits = await page.evaluate(
      ({ cx, cy, name }) => {
        const control = [...document.querySelectorAll('[role="button"]')].find(
          (el) => el.getAttribute("aria-label") === name,
        );
        const taps: [number, number][] = [
          [cx - 21, cy],
          [cx + 21, cy],
          [cx, cy - 21],
          [cx, cy + 21],
        ];
        return taps.map(([x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return Boolean(control && hit && control.contains(hit));
        });
      },
      { cx, cy, name },
    );
    expect(hits, name).toEqual([true, true, true, true]);
  }
  for (const name of ["RESUME", "GITHUB", "LINKEDIN"]) {
    const box = await page
      .getByRole("link", { name, exact: true })
      .boundingBox();
    expect(box!.height, name).toBeGreaterThanOrEqual(40);
  }
});

// Press Start 2P is drawn on an 8 px grid; off it, the pixels smear. Every
// node set in it sits on the grid, and its tracking is whole pixels.
test("the pixel face sits on its 8 px grid on every screen", async ({
  page,
}) => {
  const offGrid = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => {
          const style = getComputedStyle(el);
          if (!style.fontFamily.startsWith('"Press Start 2P"')) return false;
          const ownText = [...el.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent!.trim(),
          );
          if (!ownText || style.visibility === "hidden") return false;
          const size = parseFloat(style.fontSize);
          const track =
            style.letterSpacing === "normal"
              ? 0
              : parseFloat(style.letterSpacing);
          return size % 8 !== 0 || !Number.isInteger(track);
        })
        .map((el) => {
          const style = getComputedStyle(el);
          return `${el.textContent!.trim().slice(0, 24)} ${style.fontSize} ${style.letterSpacing}`;
        }),
    );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "PRESS START" })).toBeVisible();
  expect(await offGrid()).toEqual([]);
  await page.goto("/arcade/");
  await expect(
    page.getByRole("listbox", { name: "Project list" }),
  ).toBeVisible();
  expect(await offGrid()).toEqual([]);
  for (const [hash, title] of [
    ["sonido", "SONIDO"],
    ["high-scores", "HIGH SCORES"],
    ["credits", "CREDITS"],
  ]) {
    await page.goto(`/arcade/#${hash}`);
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    expect(await offGrid(), hash).toEqual([]);
  }
});

test("the page never scrolls: the cabinet is the viewport", async ({
  page,
}) => {
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
  await page.emulateMedia({ colorScheme: "light" });
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
    rgb(PALETTE.raised),
  );
  await expect(page.locator("[data-backdrop]")).toHaveCSS("opacity", "1");
});
