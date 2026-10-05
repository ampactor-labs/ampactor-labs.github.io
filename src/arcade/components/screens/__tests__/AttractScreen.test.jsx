import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import AttractScreen, {
  FRAMES,
  FEATURED,
  frameDuration,
  nextFrame,
  topScores,
} from "../AttractScreen";
import { PROJECTS } from "../../../../data/projects";
import { WORDS } from "../../../../data/profile";
import { summary } from "../../../../data/receiptsSummary";

const fs = (n) => n;

describe("AttractScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens on the title card: the name as the page's heading, the role, the operator's lines, PRESS START", () => {
    render(<AttractScreen projects={PROJECTS} fs={fs} />);
    expect(screen.getByTestId("attract-screen").dataset.frame).toBe("title");
    expect(
      screen.getByRole("heading", { level: 1, name: "MORGAN ESPITIA" }),
    ).toBeVisible();
    expect(screen.getByText("SOFTWARE ENGINEER")).toBeInTheDocument();
    for (const line of WORDS.title) expect(screen.getByText(line)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PRESS START" })).toBeInTheDocument();
    // Nothing else on the card: the sticker on the select screen has the rest.
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("cycles title → four cartridges → high scores → round again", () => {
    render(<AttractScreen projects={PROJECTS} fs={fs} />);
    const el = screen.getByTestId("attract-screen");
    let frame = 0;
    const advance = () => {
      act(() => vi.advanceTimersByTime(frameDuration(frame)));
      frame = nextFrame(frame);
    };
    for (let i = 0; i < FEATURED; i++) {
      advance();
      expect(el.dataset.frame).toBe("show");
      expect(screen.getByText(PROJECTS[i].title)).toBeInTheDocument();
    }
    advance();
    expect(el.dataset.frame).toBe("scores");
    expect(screen.getByText(topScores(1)[0].repo, { exact: false })).toBeInTheDocument();
    advance();
    expect(el.dataset.frame).toBe("title");
    // The heading is in the document on every frame, shown only on the title.
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
    // The next pass shows the next cartridges.
    advance();
    expect(screen.getByText(PROJECTS[FEATURED].title)).toBeInTheDocument();
  });

  it("holds the title card under reduced motion, with a static PRESS START", () => {
    render(<AttractScreen projects={PROJECTS} fs={fs} reducedMotion />);
    const el = screen.getByTestId("attract-screen");
    act(() => vi.advanceTimersByTime(60000));
    expect(el.dataset.frame).toBe("title");
    expect(screen.getByRole("button", { name: "PRESS START" }).style.animation).toBe("");
  });

  it("starts on the button and on the tube", () => {
    const onStart = vi.fn();
    render(<AttractScreen projects={PROJECTS} fs={fs} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "PRESS START" }));
    expect(onStart).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("SOFTWARE ENGINEER"));
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("holds the frame while a pointer is on the tube, and gives it its full time after", () => {
    render(<AttractScreen projects={PROJECTS} fs={fs} />);
    const el = screen.getByTestId("attract-screen");
    act(() => vi.advanceTimersByTime(frameDuration(0) - 1000));
    fireEvent.pointerEnter(el);
    act(() => vi.advanceTimersByTime(60000));
    expect(el.dataset.frame).toBe("title");
    fireEvent.pointerLeave(el);
    act(() => vi.advanceTimersByTime(frameDuration(0) - 1));
    expect(el.dataset.frame).toBe("title");
    act(() => vi.advanceTimersByTime(1));
    expect(el.dataset.frame).toBe("show");
  });

  it("holds while focus is inside, on PRESS START", () => {
    render(<AttractScreen projects={PROJECTS} fs={fs} />);
    const el = screen.getByTestId("attract-screen");
    const start = screen.getByRole("button", { name: "PRESS START" });
    act(() => start.focus());
    act(() => vi.advanceTimersByTime(60000));
    expect(el.dataset.frame).toBe("title");
    act(() => start.blur());
    act(() => vi.advanceTimersByTime(frameDuration(0)));
    expect(el.dataset.frame).toBe("show");
  });

  it("steps the loop either way when nudged", () => {
    const { rerender } = render(
      <AttractScreen projects={PROJECTS} fs={fs} nudge={{ n: 0, dir: 1 }} />,
    );
    const el = screen.getByTestId("attract-screen");
    rerender(<AttractScreen projects={PROJECTS} fs={fs} nudge={{ n: 1, dir: 1 }} />);
    expect(el.dataset.frame).toBe("show");
    rerender(<AttractScreen projects={PROJECTS} fs={fs} nudge={{ n: 2, dir: -1 }} />);
    expect(el.dataset.frame).toBe("title");
    rerender(<AttractScreen projects={PROJECTS} fs={fs} nudge={{ n: 3, dir: -1 }} />);
    expect(el.dataset.frame).toBe(FRAMES[FRAMES.length - 1]);
  });

  it("does not replay presses from an earlier visit when it comes back", () => {
    render(<AttractScreen projects={PROJECTS} fs={fs} nudge={{ n: 4, dir: 1 }} />);
    expect(screen.getByTestId("attract-screen").dataset.frame).toBe("title");
  });

  it("nextFrame wraps, and the high scores are the ledger's top repositories", () => {
    expect(nextFrame(0)).toBe(1);
    expect(nextFrame(FRAMES.length - 1)).toBe(0);
    const top = topScores(3);
    expect(top).toHaveLength(3);
    expect(top[0].commits).toBeGreaterThanOrEqual(top[1].commits);
    expect(summary.byRepo.some((r) => r.repo === top[0].repo)).toBe(true);
  });
});
