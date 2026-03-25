import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useCabinetState from "../useCabinetState";
import { PROJECTS, HIDDEN_PROJECTS } from "../../data/projects";
import { BOOT_LINES } from "../../constants";

// Mock heavy dependencies
vi.mock("../../useAmbientHum", () => ({
  default: () => ({
    playBlip: vi.fn(),
    playInsertSting: vi.fn(),
  }),
}));

vi.mock("../../useIntroSequence", () => ({
  default: () => ({
    introComplete: true,
    skipIntro: vi.fn(),
  }),
}));

function makeRef(value = null) {
  return { current: value };
}

describe("useCabinetState", () => {
  let screenRef, tunnelRef, logoRef, consoleRef;

  beforeEach(() => {
    vi.useFakeTimers();
    screenRef = makeRef({ getBoundingClientRect: () => ({ width: 400, height: 600 }) });
    tunnelRef = makeRef();
    logoRef = makeRef();
    consoleRef = makeRef({ style: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Advance through the full boot sequence and call advanceBoot to reach "select".
  // Two separate act() calls are required: the first flushes the bootPhase 0→1 timeout
  // so React re-renders and registers the interval effect; the second advances through
  // all boot lines.
  function bootToSelect(result) {
    act(() => {
      vi.advanceTimersByTime(900); // bootPhase 0→1 (800ms) + buffer
    });
    act(() => {
      vi.advanceTimersByTime(BOOT_LINES.length * 280 + 100); // all boot lines
    });
    act(() => {
      result.current.advanceBoot(); // bootLine at end → screen="select"
    });
  }

  it("initializes with screen=boot, coinCount=0", () => {
    const { result } = renderHook(() =>
      useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
    );
    expect(result.current.screen).toBe("boot");
    expect(result.current.coinCount).toBe(0);
  });

  it("starts with only PROJECTS visible (no coins)", () => {
    const { result } = renderHook(() =>
      useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
    );
    expect(result.current.allProjects.length).toBe(PROJECTS.length);
  });

  it("insertCoin unlocks all 3 hidden projects", () => {
    const { result } = renderHook(() =>
      useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
    );
    bootToSelect(result);
    act(() => {
      result.current.insertCoin();
    });
    expect(result.current.coinCount).toBe(3);
    expect(result.current.allProjects.length).toBe(PROJECTS.length + HIDDEN_PROJECTS.length);
  });

  it("openProject changes screen to detail for regular projects", () => {
    const { result } = renderHook(() =>
      useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
    );
    bootToSelect(result);
    act(() => {
      result.current.openProject(0);
    });
    expect(result.current.screen).toBe("detail");
    expect(result.current.detailProject).toEqual(PROJECTS[0]);
  });

  it("goBack returns to select screen", () => {
    const { result } = renderHook(() =>
      useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
    );
    bootToSelect(result);
    act(() => {
      result.current.openProject(0);
    });
    act(() => {
      result.current.goBack();
    });
    expect(result.current.screen).toBe("select");
    expect(result.current.detailProject).toBeNull();
  });

  it("openProject navigates to game for tunnel-run", () => {
    const { result } = renderHook(() =>
      useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
    );
    bootToSelect(result);
    act(() => {
      result.current.insertCoin();
    });
    const gameIdx = result.current.allProjects.findIndex(
      (p) => p.interactive === "tunnelgame",
    );
    act(() => {
      result.current.openProject(gameIdx);
    });
    expect(result.current.screen).toBe("game");
  });
});
