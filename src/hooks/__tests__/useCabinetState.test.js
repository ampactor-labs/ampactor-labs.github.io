import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useCabinetState from "../useCabinetState";
import { PROJECTS, HIDDEN_PROJECTS } from "../../data/projects";
import { BOOT_LINES } from "../../constants";

// Mock heavy dependencies
vi.mock("../../useAmbientHum", () => ({
  default: () => ({
    playBlip: vi.fn(),
    playEnter: vi.fn(),
    playBack: vi.fn(),
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
    screenRef = makeRef({
      getBoundingClientRect: () => ({ width: 400, height: 600 }),
    });
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
      vi.advanceTimersByTime(900); // bootPhase 0→1 (450ms) + buffer
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
    expect(result.current.allProjects.length).toBe(
      PROJECTS.length + HIDDEN_PROJECTS.length,
    );
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
    const originalBack = window.history.back;
    window.history.back = () => {
      window.dispatchEvent(new Event("popstate"));
    };

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

    window.history.back = originalBack;
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

  describe("detail screen controls", () => {
    const BOTH = PROJECTS.findIndex((p) => p.live && p.github);
    const SOURCE_ONLY = PROJECTS.findIndex((p) => p.github && !p.live);

    // Open a project and hand back the hook with the refs DetailScreen would
    // normally populate: one stub anchor per link, and a body that behaves like a
    // real scroll container (a smooth scrollTo lands, so scrollTop tracks target).
    function openDetail(idx) {
      const { result } = renderHook(() =>
        useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
      );
      bootToSelect(result);
      act(() => {
        result.current.openProject(idx);
      });
      const body = {
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 400,
        scrollTo: vi.fn(({ top }) => {
          body.scrollTop = top;
        }),
      };
      result.current.detailBodyRef.current = body;
      const clicks = result.current.detailLinks.map(() => vi.fn());
      result.current.linkRefs.current = clicks.map((click) => ({ click }));
      return { result, body, clicks };
    }

    it("focuses the demo link first when a project has both", () => {
      const { result } = openDetail(BOTH);
      expect(result.current.detailLinks.map((l) => l.kind)).toEqual([
        "live",
        "github",
      ]);
      expect(result.current.linkIdx).toBe(0);
    });

    it("focuses the source link when that is the only one", () => {
      const { result } = openDetail(SOURCE_ONLY);
      expect(result.current.detailLinks.map((l) => l.kind)).toEqual(["github"]);
      expect(result.current.linkIdx).toBe(0);
    });

    it("navRight and navLeft walk the link rail and clamp at both ends", () => {
      const { result } = openDetail(BOTH);
      act(() => result.current.navRight());
      expect(result.current.linkIdx).toBe(1);

      act(() => result.current.navRight()); // already at the end
      expect(result.current.linkIdx).toBe(1);

      act(() => result.current.navLeft());
      expect(result.current.linkIdx).toBe(0);

      act(() => result.current.navLeft()); // already at the start
      expect(result.current.linkIdx).toBe(0);
    });

    it("pressA clicks the focused link, not the other one", () => {
      const { result, clicks } = openDetail(BOTH);
      act(() => result.current.pressA());
      expect(clicks[0]).toHaveBeenCalledTimes(1);
      expect(clicks[1]).not.toHaveBeenCalled();

      act(() => result.current.navRight());
      act(() => result.current.pressA());
      expect(clicks[1]).toHaveBeenCalledTimes(1);
      expect(clicks[0]).toHaveBeenCalledTimes(1);
    });

    it("navUp and navDown scroll the detail body", () => {
      const { result, body } = openDetail(BOTH);
      act(() => result.current.navDown());
      expect(body.scrollTop).toBe(72);
      act(() => result.current.navUp());
      expect(body.scrollTop).toBe(0);
    });

    // Chrome resolves a smooth scrollBy against the live, mid-animation offset, so
    // the naive version swallowed the second press. Mashing must accumulate.
    it("accumulates rapid navDown presses instead of swallowing them", () => {
      const { result, body } = openDetail(BOTH);
      act(() => {
        result.current.navDown();
        result.current.navDown();
        result.current.navDown();
      });
      expect(body.scrollTop).toBe(216);
    });

    it("clamps scrolling at the top and the bottom of the body", () => {
      const { result, body } = openDetail(BOTH);
      act(() => result.current.navUp());
      expect(body.scrollTop).toBe(0); // already at the top

      for (let i = 0; i < 20; i++) act(() => result.current.navDown());
      expect(body.scrollTop).toBe(600); // scrollHeight 1000 - clientHeight 400
    });

    it("keeps the selected project on the list when scrolling the detail body", () => {
      const { result } = openDetail(BOTH);
      act(() => result.current.navDown());
      act(() => result.current.navDown());
      expect(result.current.selectedIdx).toBe(BOTH);
      expect(result.current.screen).toBe("detail");
    });

    it("navLeft falls back to Back when the project has no links", () => {
      const originalBack = window.history.back;
      window.history.back = vi.fn();

      const { result } = renderHook(() =>
        useCabinetState(screenRef, tunnelRef, logoRef, consoleRef),
      );
      bootToSelect(result);
      act(() => {
        result.current.insertCoin();
      });
      const synthIdx = result.current.allProjects.findIndex(
        (p) => p.interactive === "synth",
      );
      act(() => {
        result.current.openProject(synthIdx);
      });
      expect(result.current.detailLinks).toEqual([]);

      act(() => result.current.navLeft());
      expect(window.history.back).toHaveBeenCalled();

      window.history.back = originalBack;
    });

    it("resets focus to the first link when another project is opened", () => {
      const originalBack = window.history.back;
      window.history.back = () => window.dispatchEvent(new Event("popstate"));

      const { result } = openDetail(BOTH);
      act(() => result.current.navRight());
      expect(result.current.linkIdx).toBe(1);

      act(() => result.current.goBack());
      expect(result.current.detailProject).toBeNull();

      act(() => {
        result.current.openProject(SOURCE_ONLY);
      });
      expect(result.current.linkIdx).toBe(0);
      expect(result.current.detailLinks.map((l) => l.kind)).toEqual(["github"]);

      window.history.back = originalBack;
    });

    it("drops the previous project's anchors on the way out", () => {
      const originalBack = window.history.back;
      window.history.back = () => window.dispatchEvent(new Event("popstate"));

      const { result } = openDetail(BOTH);
      expect(result.current.linkRefs.current).toHaveLength(2);

      act(() => result.current.goBack());
      expect(result.current.linkRefs.current).toEqual([]);

      window.history.back = originalBack;
    });
  });
});
