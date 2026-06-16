import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import Lobby from "../Lobby";

describe("Lobby", () => {
  it("renders the positioning, CTA, and résumé link", () => {
    const { getByText, container } = render(<Lobby onEnter={() => {}} />);
    expect(getByText(/hard layer/i)).toBeTruthy();
    expect(getByText(/Let's talk/i)).toBeTruthy();
    expect(getByText("WHAT I TAKE ON")).toBeTruthy();
    expect(container.querySelector('a[href="/resume.html"]')).toBeTruthy();
  });

  it("surfaces the flagship work", () => {
    const { getByText } = render(<Lobby onEnter={() => {}} />);
    expect(getByText("TOKENSAFE + SCRY")).toBeTruthy();
  });

  it("calls onEnter when the explore button is clicked", () => {
    const onEnter = vi.fn();
    const { getByRole } = render(<Lobby onEnter={onEnter} />);
    fireEvent.click(getByRole("button", { name: /explore the full arcade/i }));
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
