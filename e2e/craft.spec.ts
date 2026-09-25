import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
// What scripts/audit.mjs measured; the page must show these numbers.
import audit from "../src/data/audit.json" with { type: "json" };

const n = (v: number) => v.toLocaleString("en-US");

test("the case study is accessible and quotes the measured numbers", async ({
  page,
}) => {
  await page.goto("/craft/");
  await expect(
    page.getByRole("heading", { level: 1, name: "How this site is built" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Site" })
      .getByRole("link", { name: "CRAFT", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  const tiles = page.getByRole("list", { name: "Measured" });
  await expect(
    tiles.getByRole("listitem").filter({ hasText: "Unit tests" }),
  ).toContainText(n(audit.tests.unit));
  await expect(
    tiles.getByRole("listitem").filter({ hasText: "Browser test runs" }),
  ).toContainText(n(audit.tests.browserRuns));
  const figure = page.getByRole("figure");
  await expect(figure.getByRole("img", { name: /^On the page/ })).toBeVisible();
  await expect(figure.getByRole("img", { name: /^Open:/ })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("with the lights on, the case study still passes axe", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("ampactor_theme", "patina-light"),
  );
  await page.goto("/craft/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "patina-light",
  );
  // Past every reveal, so each block is at full opacity when checked.
  await page
    .getByRole("heading", { name: "Tradeoffs and next steps" })
    .scrollIntoViewIfNeeded();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("the contents go to each chapter, and the floor links here", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("ampactor_visited", "1"));
  await page.goto("/");
  await page.getByRole("link", { name: /^How this site is built/ }).click();
  await expect(page).toHaveURL(/\/craft\/$/);

  await page
    .getByRole("navigation", { name: "On this page" })
    .getByRole("link", { name: /The commit log/ })
    .click();
  await expect(page).toHaveURL(/#commits$/);
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "The commit log",
    }),
  ).toBeInViewport();
});
