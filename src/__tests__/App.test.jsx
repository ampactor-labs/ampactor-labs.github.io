import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import App from "../App";

// Mounting the cabinet pulls in the GSAP intro and audio — mock both, as the
// ArcadePortfolio test does, so the transition can be exercised in jsdom.
vi.mock("../useIntroSequence", () => ({
  default: () => ({ introComplete: false, skipIntro: vi.fn() }),
}));
vi.mock("../useAmbientHum", () => ({
  default: () => ({
    playBlip: vi.fn(),
    playEnter: vi.fn(),
    playBack: vi.fn(),
    playInsertSting: vi.fn(),
  }),
}));

describe("App", () => {
  // Defend against cross-test pollution: App's initial view reads
  // window.location.hash, and the cabinet writes localStorage on first boot.
  beforeEach(() => {
    cleanup();
    window.location.hash = "";
    localStorage.clear();
  });

  it("shows the lobby by default, not the cabinet", () => {
    const { getByText, queryByLabelText } = render(<App />);
    expect(getByText("Rust")).toBeTruthy();
    expect(queryByLabelText("Back to home")).toBeNull();
  });

  it("enters the cabinet when explore is clicked", () => {
    const { getByRole, getByLabelText } = render(<App />);
    fireEvent.click(getByRole("button", { name: /explore the full arcade/i }));
    expect(getByLabelText("Back to home")).toBeTruthy();
  });

  it("returns to the lobby from the cabinet", () => {
    const { getByRole, getByText, getByLabelText, queryByLabelText } = render(
      <App />,
    );
    fireEvent.click(getByRole("button", { name: /explore the full arcade/i }));
    fireEvent.click(getByLabelText("Back to home"));
    expect(getByText("Rust")).toBeTruthy();
    expect(queryByLabelText("Back to home")).toBeNull();
  });
});
