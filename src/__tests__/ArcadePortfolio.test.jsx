import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ArcadePortfolio from "../ArcadePortfolio";

// Mock GSAP and intro sequence to prevent animation side effects
vi.mock("../useIntroSequence", () => ({
  default: () => ({
    introComplete: false,
    skipIntro: vi.fn(),
  }),
}));

vi.mock("../useAmbientHum", () => ({
  default: () => ({
    playBlip: vi.fn(),
    playInsertSting: vi.fn(),
  }),
}));

describe("ArcadePortfolio", () => {
  it("mounts without crashing", () => {
    const { container } = render(<ArcadePortfolio />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the AMPACTOR text", () => {
    const { getByText } = render(<ArcadePortfolio />);
    expect(getByText("AMPACTOR")).toBeTruthy();
  });

  it("renders coin slot button", () => {
    const { getByRole } = render(<ArcadePortfolio />);
    expect(getByRole("button", { name: /insert coin/i })).toBeTruthy();
  });

  it("renders navigation buttons", () => {
    const { getByRole } = render(<ArcadePortfolio />);
    expect(getByRole("button", { name: /navigate up/i })).toBeTruthy();
    expect(getByRole("button", { name: /navigate down/i })).toBeTruthy();
  });
});
