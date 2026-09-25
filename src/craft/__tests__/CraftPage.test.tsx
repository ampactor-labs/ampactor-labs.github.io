import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import CraftPage, {
  COLD_OPEN_SECONDS as SAID_SECONDS,
  PULLBACK_SECONDS as SAID_PULLBACK,
} from "../CraftPage";
import {
  COLD_OPEN_SECONDS,
  PULLBACK_SECONDS,
} from "../../arcade/zoom/coldOpen";
import { audit } from "../../data/audit";
import { summary } from "../../data/receiptsSummary";

const n = (v: number) => v.toLocaleString("en-US");

describe("CraftPage", () => {
  it("sends every contents link to a chapter with a heading", () => {
    const { container } = render(<CraftPage />);
    const contents = screen.getByRole("navigation", { name: "On this page" });
    const links = within(contents).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const id = link.getAttribute("href")!.slice(1);
      const chapter = container.querySelector(`section#${id}`);
      expect(chapter, id).not.toBeNull();
      expect(
        within(chapter as HTMLElement).getByRole("heading", { level: 2 }),
      ).toBeTruthy();
    }
  });

  it("quotes the audit and the ledger, not numbers of its own", () => {
    render(<CraftPage />);
    const tiles = screen.getByRole("list", { name: "Measured" });
    const tile = (label: string) =>
      within(tiles)
        .getAllByRole("listitem")
        .find((li) => li.textContent?.includes(label));
    expect(tile("Unit tests")?.textContent).toContain(n(audit.tests.unit));
    expect(tile("Browser runs")?.textContent).toContain(
      n(audit.tests.browserRuns ?? 0),
    );
    const floor = audit.pages["/"];
    if (floor) {
      const rows = screen.getAllByRole("row");
      const floorRow = rows.find(
        (r) => within(r).queryByRole("rowheader")?.textContent === "The floor",
      );
      expect(floorRow?.textContent).toContain(String(floor.performance));
    }
    expect(
      screen.getByText(new RegExp(`${n(summary.totals.withClaude)} of the`)),
    ).toBeTruthy();
  });

  it("marks itself as the current page in the header", () => {
    render(<CraftPage />);
    const site = screen.getByRole("navigation", { name: "Site" });
    expect(
      within(site)
        .getByRole("link", { name: "CRAFT" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(site)
        .getByRole("link", { name: "RECEIPTS" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("tells the cold open's timings as the code has them", () => {
    expect(SAID_SECONDS).toBe(COLD_OPEN_SECONDS);
    expect(SAID_PULLBACK).toBe(PULLBACK_SECONDS);
    render(<CraftPage />);
    expect(
      screen.getByText(new RegExp(`after ${COLD_OPEN_SECONDS} seconds`)),
    ).toBeTruthy();
  });
});
