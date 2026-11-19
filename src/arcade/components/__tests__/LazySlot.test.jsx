import { describe, it, expect, vi } from "vitest";
import { lazy } from "react";
import { render, screen } from "@testing-library/react";
import LazySlot from "../LazySlot";
import { isChunkLoadError } from "../../../lib/staleChunks";

describe("isChunkLoadError", () => {
  it("knows each browser's words for a chunk that failed to load", () => {
    for (const message of [
      "Failed to fetch dynamically imported module: https://ampactor.dev/assets/DetailScreen-x.js",
      "Importing a module script failed.",
      "error loading dynamically imported module: https://ampactor.dev/assets/x.js",
    ])
      expect(isChunkLoadError(new TypeError(message))).toBe(true);
    expect(isChunkLoadError(new Error("x is undefined"))).toBe(false);
  });
});

describe("LazySlot", () => {
  it("keeps a failed screen from taking the cabinet down", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const Broken = lazy(() => Promise.reject(new Error("render failed")));
    render(
      <div>
        <p>the list</p>
        <LazySlot>
          <Broken />
        </LazySlot>
      </div>,
    );
    expect(await screen.findByRole("button", { name: "RELOAD" })).toBeTruthy();
    expect(screen.getByText("the list")).toBeTruthy();
    quiet.mockRestore();
  });
});
