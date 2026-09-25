import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import AttractScreen, {
  frameDuration,
  nextFrame,
} from "../AttractScreen";
import { PROJECTS } from "../../../../data/projects";

const fs = (n) => n;

describe("AttractScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("cycles test pattern → PRESS START → each cartridge → round again", () => {
    const three = PROJECTS.slice(0, 3);
    render(<AttractScreen projects={three} fs={fs} />);
    const el = screen.getByTestId("attract-screen");
    expect(el.dataset.frame).toBe("0");

    act(() => vi.advanceTimersByTime(frameDuration(0)));
    expect(el.dataset.frame).toBe("1");
    expect(screen.getByText("PRESS START")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(frameDuration(1)));
    expect(el.dataset.frame).toBe("2");
    expect(screen.getByText(three[0].title)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(frameDuration(2)));
    expect(screen.getByText(three[1].title)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(frameDuration(3)));
    expect(screen.getByText(three[2].title)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(frameDuration(4)));
    expect(el.dataset.frame).toBe("0");
  });

  it("holds a static PRESS START under reduced motion", () => {
    render(<AttractScreen projects={PROJECTS} fs={fs} reducedMotion />);
    const el = screen.getByTestId("attract-screen");
    expect(el.dataset.frame).toBe("1");
    act(() => vi.advanceTimersByTime(20000));
    expect(el.dataset.frame).toBe("1");
    expect(screen.getByText("PRESS START").style.animation).toBe("");
  });

  it("nextFrame wraps after the last cartridge", () => {
    expect(nextFrame(0, 3)).toBe(1);
    expect(nextFrame(1, 3)).toBe(2);
    expect(nextFrame(4, 3)).toBe(0);
    expect(nextFrame(1, 0)).toBe(0);
  });
});
