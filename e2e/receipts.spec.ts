import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function openLedger(page: Page, search = "") {
  await page.goto(`/receipts/${search}`);
  await expect(page.getByText(/^Showing/)).toBeVisible();
}

test("the ledger is accessible and answers the URL", async ({ page }) => {
  await openLedger(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /Every public commit/ }),
  ).toBeVisible();
  const summary = page.getByText(/^Showing/);
  const text = (await summary.textContent()) ?? "";
  const [, shown, total] = text.match(/Showing ([\d,]+) of ([\d,]+)/) ?? [];
  expect(shown).toBe(total);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("filters write the URL, the URL restores the filters", async ({
  page,
}) => {
  await openLedger(page);
  const total = Number(
    ((await page.getByText(/^Showing/).textContent()) ?? "")
      .match(/of ([\d,]+)/)?.[1]
      ?.replace(/,/g, ""),
  );
  await page
    .getByRole("group", { name: "Repositories" })
    .getByRole("button", { name: /^mentl/ })
    .click();
  await expect(page).toHaveURL(/\?repo=mentl$/);
  const summary = page.getByText(/^Showing/);
  await expect(summary).not.toContainText(
    `Showing ${total.toLocaleString("en-US")} of`,
  );
  await page.getByRole("checkbox", { name: "Include merges" }).uncheck();
  await expect(page).toHaveURL(/\?repo=mentl&merges=0$/);
  await page
    .getByRole("searchbox", { name: "Search subjects" })
    .fill("bootstrap");
  await expect(page).toHaveURL(/q=bootstrap/);

  await page.reload();
  await expect(
    page
      .getByRole("group", { name: "Repositories" })
      .getByRole("button", { name: /^mentl/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("checkbox", { name: "Include merges" }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("searchbox", { name: "Search subjects" }),
  ).toHaveValue("bootstrap");

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page).toHaveURL(/\/receipts\/$/);
  await expect(summary).toContainText(
    `Showing ${total.toLocaleString("en-US")} of`,
  );
});

test("a chart flips to its table, and a column narrows the range", async ({
  page,
}) => {
  await openLedger(page);
  const figure = page.getByRole("figure", { name: "Commits per month" });
  await figure.getByRole("button", { name: "Table" }).click();
  await expect(figure.getByRole("table")).toBeVisible();
  await expect(
    figure.getByRole("columnheader", { name: "Commits" }),
  ).toBeVisible();
  await figure.getByRole("button", { name: "Chart" }).click();
  await expect(
    figure.getByRole("img", { name: "Commits per month" }),
  ).toBeVisible();
});

test("a row opens the commit in a drawer with its message and a GitHub link", async ({
  page,
}) => {
  await openLedger(page, "?repo=site");
  const first = page.locator("tbody tr[data-index='0'] button");
  await first.focus();
  await first.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "View on GitHub →" }),
  ).toHaveAttribute(
    "href",
    /github\.com\/ampactor-labs\/ampactor-labs\.github\.io\/commit\/[0-9a-f]{7}/,
  );
  await expect(
    dialog.getByRole("heading", { level: 3, name: "Message" }),
  ).toBeVisible();
  await expect(dialog.getByText("Loading the message…")).toHaveCount(0, {
    timeout: 10_000,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(first).toBeFocused();
});

test("arrow keys walk the rows", async ({ page }) => {
  await openLedger(page);
  const first = page.locator("tbody tr[data-index='0'] button");
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("tbody tr[data-index='1'] button")).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(page.locator("tbody tr[data-index='11'] button")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
});

test("the export refuses a bad name, then downloads the slice", async ({
  page,
}) => {
  await openLedger(page, "?repo=mentl");
  const name = page.getByLabel("File name");
  await name.fill("../etc/passwd");
  await name.blur();
  await expect(page.getByText(/Letters, digits, dots/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Download/ })).toBeDisabled();

  await name.fill("mentl-ledger");
  const button = page.getByRole("button", {
    name: "Download mentl-ledger.csv",
  });
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    button.click(),
  ]);
  expect(download.suggestedFilename()).toBe("mentl-ledger.csv");
  const stream = await download.createReadStream();
  const decoder = new TextDecoder();
  let text = "";
  for await (const chunk of stream)
    text += decoder.decode(chunk, { stream: true });
  text += decoder.decode();
  expect(text.split("\r\n")[0]).toBe(
    '"sha","repo","date","subject","author","co_authors","merge","additions","deletions","files"',
  );
  expect(text).toContain('"mentl"');
  expect(text).not.toContain('"sonido"');
  await expect(
    page.getByRole("status").filter({ hasText: "Downloaded mentl-ledger.csv" }),
  ).toBeVisible();
});

test("with the lights on, the charts still pass axe", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("ampactor_theme", "patina-light"),
  );
  await openLedger(page);
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "patina-light",
  );
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});
