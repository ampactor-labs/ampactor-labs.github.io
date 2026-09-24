import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { renderHook, act } from "@testing-library/react";
import useCabinetState from "../useCabinetState";
import { PROJECTS, HIDDEN_PROJECTS } from "../../../data/projects";
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

const SELECT = { view: "arcade", screen: "select" };
const FLOOR = { view: "floor" };
const project = (id) => ({ view: "arcade", screen: "project", id });

function makeRef(value = null) {
  return { current: value };
}

describe("useCabinetState", () => {
  let screenRef, tunnelRef, logoRef, consoleRef;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
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

  // The cabinet never touches history itself: it emits intents and renders the
  // route it is handed. This stands in for the app's router: every intent
  // becomes the route the real one would produce, synchronously.
  function renderCabinet({ initialRoute = SELECT, ...extra } = {}) {
    const intents = [];
    const hook = renderHook(() => {
      const [route, setRoute] = useState(initialRoute);
      const onNavigate = (intent) => {
        intents.push(intent);
        if (intent.type === "open") setRoute(project(intent.id));
        else if (intent.type === "back" || intent.type === "select")
          setRoute(SELECT);
        else if (intent.type === "exit") setRoute(FLOOR);
      };
      const state = useCabinetState({
        screenRef,
        tunnelRef,
        logoRef,
        consoleRef,
        route,
        onNavigate,
        ...extra,
      });
      return { ...state, route, setRoute };
    });
    return { ...hook, intents };
  }

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
    const { result } = renderCabinet();
    expect(result.current.screen).toBe("boot");
    expect(result.current.coinCount).toBe(0);
  });

  it("starts with only PROJECTS visible (no coins)", () => {
    const { result } = renderCabinet();
    expect(result.current.allProjects.length).toBe(PROJECTS.length);
  });

  it("insertCoin unlocks all 3 hidden projects", () => {
    const { result } = renderCabinet();
    bootToSelect(result);
    act(() => {
      result.current.insertCoin();
    });
    expect(result.current.coinCount).toBe(3);
    expect(result.current.allProjects.length).toBe(
      PROJECTS.length + HIDDEN_PROJECTS.length,
    );
  });

  it("openProject asks the router to open, then renders the detail route", () => {
    const { result, intents } = renderCabinet();
    bootToSelect(result);
    act(() => {
      result.current.openProject(0);
    });
    expect(intents).toContainEqual({ type: "open", id: PROJECTS[0].id });
    expect(result.current.screen).toBe("detail");
    expect(result.current.detailProject).toEqual(PROJECTS[0]);
  });

  it("goBack returns to select screen", () => {
    const { result, intents } = renderCabinet();
    bootToSelect(result);
    act(() => {
      result.current.openProject(0);
    });
    act(() => {
      result.current.goBack();
    });
    expect(intents.at(-1)).toEqual({ type: "back" });
    expect(result.current.screen).toBe("select");
    expect(result.current.detailProject).toBeNull();
  });

  it("openProject navigates to game for tunnel-run", () => {
    const { result } = renderCabinet();
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

  describe("routing", () => {
    it("Enter on the select screen opens through the router like A does", () => {
      const { result, intents } = renderCabinet();
      bootToSelect(result);
      act(() => {
        vi.advanceTimersByTime(600); // past the boot → select settle guard
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });
      expect(intents.at(-1)).toEqual({ type: "open", id: PROJECTS[0].id });
      expect(result.current.screen).toBe("detail");
    });

    it("arrow keys on the select screen are consumed, not scrolled", () => {
      const { result } = renderCabinet();
      bootToSelect(result);
      const down = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        cancelable: true,
      });
      act(() => {
        window.dispatchEvent(down);
      });
      expect(down.defaultPrevented).toBe(true);
      expect(result.current.selectedIdx).toBe(1);
    });

    it("Escape on the select screen asks to leave the arcade", () => {
      const { result, intents } = renderCabinet();
      bootToSelect(result);
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });
      expect(intents.at(-1)).toEqual({ type: "exit" });
      expect(result.current.route).toEqual(FLOOR);
    });

    it("B on the select screen leaves, but not right after closing a detail", () => {
      const { result, intents } = renderCabinet();
      bootToSelect(result);
      act(() => {
        result.current.openProject(0);
      });
      act(() => {
        result.current.goBack(); // closes the detail
      });
      act(() => {
        result.current.goBack(); // mashed: must not leave
      });
      expect(intents.filter((i) => i.type === "exit")).toHaveLength(0);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      act(() => {
        result.current.goBack();
      });
      expect(intents.at(-1)).toEqual({ type: "exit" });
    });

    it("follows a route change it did not initiate (browser Back/Forward)", () => {
      const { result } = renderCabinet();
      bootToSelect(result);
      act(() => {
        result.current.setRoute(project(PROJECTS[2].id));
      });
      expect(result.current.screen).toBe("detail");
      expect(result.current.detailProject.id).toBe(PROJECTS[2].id);
      expect(result.current.selectedIdx).toBe(2);
      act(() => {
        result.current.setRoute(SELECT);
      });
      expect(result.current.screen).toBe("select");
      expect(result.current.detailProject).toBeNull();
    });

    it("opens a deep-linked cartridge without booting", () => {
      const { result } = renderCabinet({
        initialRoute: project(PROJECTS[1].id),
      });
      expect(result.current.screen).toBe("detail");
      expect(result.current.detailProject.id).toBe(PROJECTS[1].id);
    });

    it("corrects an unknown cartridge to the select screen", () => {
      const { result, intents } = renderCabinet({
        initialRoute: project("does-not-exist"),
      });
      expect(intents).toContainEqual({ type: "select" });
      expect(result.current.screen).toBe("select");
    });

    it("keeps a hidden program locked behind the coin slot", () => {
      const { result, intents } = renderCabinet({
        initialRoute: project(HIDDEN_PROJECTS[0].id),
      });
      expect(intents).toContainEqual({ type: "select" });
      expect(result.current.screen).toBe("select");
    });
  });

  describe("attract mode", () => {
    it("shows the attract loop and takes no input", () => {
      const { result, intents } = renderCabinet({
        mode: "attract",
        initialRoute: FLOOR,
      });
      expect(result.current.screen).toBe("attract");
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });
      expect(result.current.selectedIdx).toBe(0);
      expect(intents).toEqual([]);
      act(() => {
        result.current.insertCoin();
        result.current.pressA();
        result.current.navDown();
      });
      expect(result.current.coinCount).toBe(0);
      expect(result.current.selectedIdx).toBe(0);
    });

    it("boots when it goes live, and returns to attract when it leaves", () => {
      const { result, rerender } = renderHook(
        ({ mode }) =>
          useCabinetState({
            screenRef,
            tunnelRef,
            logoRef,
            consoleRef,
            mode,
            route: mode === "live" ? SELECT : FLOOR,
          }),
        { initialProps: { mode: "attract" } },
      );
      expect(result.current.screen).toBe("attract");
      rerender({ mode: "live" });
      expect(result.current.screen).toBe("boot");
      bootToSelect(result);
      expect(result.current.screen).toBe("select");
      expect(localStorage.getItem("ampactor_visited")).toBe("1");
      rerender({ mode: "attract" });
      expect(result.current.screen).toBe("attract");
      rerender({ mode: "live" });
      // A visitor who has already booted once is not made to sit through it again.
      expect(result.current.screen).toBe("select");
    });

    it("ignores the controls while the zoom is animating", () => {
      const { result, intents } = renderCabinet({ animating: true });
      bootToSelect(result);
      act(() => {
        result.current.pressA();
        result.current.navDown();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });
      expect(intents).toEqual([]);
      expect(result.current.selectedIdx).toBe(0);
    });
  });

  describe("detail screen controls", () => {
    const BOTH = PROJECTS.findIndex((p) => p.live && p.github);
    const SOURCE_ONLY = PROJECTS.findIndex((p) => p.github && !p.live);

    // Open a project and hand back the hook with the refs DetailScreen would
    // normally populate: one stub anchor per link, and a body that behaves like a
    // real scroll container (a smooth scrollTo lands, so scrollTop tracks target).
    function openDetail(idx) {
      const { result } = renderCabinet();
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
      const { result, intents } = renderCabinet();
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
      expect(intents.at(-1)).toEqual({ type: "back" });
      expect(result.current.screen).toBe("select");
    });

    it("resets focus to the first link when another project is opened", () => {
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
    });

    it("drops the previous project's anchors on the way out", () => {
      const { result } = openDetail(BOTH);
      expect(result.current.linkRefs.current).toHaveLength(2);

      act(() => result.current.goBack());
      expect(result.current.linkRefs.current).toEqual([]);
    });
  });
});
