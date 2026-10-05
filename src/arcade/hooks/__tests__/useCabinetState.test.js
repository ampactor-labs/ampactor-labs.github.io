import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { renderHook, act } from "@testing-library/react";
import useCabinetState, {
  BOOT_PATTERN_MS,
  BOOT_LINE_MS,
  BOOT_BEAT_MS,
} from "../useCabinetState";
import { PROJECTS, HIDDEN_PROJECTS } from "../../../data/projects";
import { SYSTEM_PROGRAMS } from "../../../data/programs";
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
const HOME = { view: "home" };
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
        else if (intent.type === "exit") setRoute(HOME);
        else if (intent.type === "enter") setRoute(SELECT);
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
      vi.advanceTimersByTime(BOOT_PATTERN_MS + 10); // bootPhase 0→1
    });
    act(() => {
      vi.advanceTimersByTime(BOOT_LINES.length * BOOT_LINE_MS + 10); // all boot lines
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

  it("starts with the cartridges and the operator programs, no hidden ones", () => {
    const { result } = renderCabinet();
    expect(result.current.allProjects.length).toBe(
      PROJECTS.length + SYSTEM_PROGRAMS.length,
    );
  });

  it("insertCoin unlocks all 3 hidden projects", () => {
    const { result } = renderCabinet();
    bootToSelect(result);
    act(() => {
      result.current.insertCoin();
    });
    expect(result.current.coinCount).toBe(3);
    expect(result.current.allProjects.length).toBe(
      PROJECTS.length + SYSTEM_PROGRAMS.length + HIDDEN_PROJECTS.length,
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
      expect(result.current.route).toEqual(HOME);
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

    // The floor links straight to the game, so a hidden program named in
    // the URL drops the coin for the visitor instead of refusing them.
    it("opens a hidden program named in the URL by dropping the coin", () => {
      const { result, intents } = renderCabinet({
        initialRoute: project(HIDDEN_PROJECTS[0].id),
      });
      expect(result.current.coinCount).toBe(3);
      expect(intents).not.toContainEqual({ type: "select" });
      expect(result.current.detailProject?.id).toBe(HIDDEN_PROJECTS[0].id);
    });

    it("still corrects a cartridge that does not exist to the select screen", () => {
      const { result, intents } = renderCabinet({
        initialRoute: project("no-such-cartridge"),
      });
      expect(intents).toContainEqual({ type: "select" });
      expect(result.current.coinCount).toBe(0);
      expect(result.current.screen).toBe("select");
    });
  });

  describe("the title card", () => {
    // A returning visitor: the machine has booted for them before, so it
    // lands where the URL points.
    beforeEach(() => localStorage.setItem("ampactor_visited", "1"));

    it("is home: Enter, A and a tap start the machine", () => {
      const { result, intents } = renderCabinet({ initialRoute: HOME });
      expect(result.current.screen).toBe("attract");
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });
      expect(intents).toEqual([{ type: "enter" }]);
      expect(result.current.screen).toBe("select");
    });

    it("A on the panel starts it too", () => {
      const { result, intents } = renderCabinet({ initialRoute: HOME });
      act(() => result.current.pressA());
      expect(intents).toEqual([{ type: "enter" }]);
    });

    it("left and right step the attract loop instead of the list", () => {
      const { result, intents } = renderCabinet({ initialRoute: HOME });
      act(() => {
        result.current.navRight();
        result.current.navLeft();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
      });
      expect(result.current.attractNudge).toEqual({ n: 3, dir: 1 });
      expect(result.current.selectedIdx).toBe(0);
      expect(intents).toEqual([]);
    });

    it("a coin on the title card is credit accepted and the machine starts", () => {
      const { result, intents } = renderCabinet({ initialRoute: HOME });
      act(() => result.current.insertCoin());
      expect(result.current.coinCount).toBe(3);
      expect(intents).toEqual([{ type: "enter" }]);
      expect(result.current.allProjects.map((p) => p.id)).toContain("tunnel-run");
    });

    it("B on the list steps back to the title card", () => {
      const { result, intents } = renderCabinet({ initialRoute: HOME });
      act(() => result.current.pressA());
      expect(result.current.screen).toBe("select");
      act(() => result.current.goBack());
      expect(intents.at(-1)).toEqual({ type: "exit" });
      expect(result.current.screen).toBe("attract");
    });

    it("a first visit boots, then lands on the title card at home", () => {
      localStorage.clear();
      const { result } = renderCabinet({ initialRoute: HOME });
      expect(result.current.screen).toBe("boot");
      bootToSelect(result);
      expect(result.current.screen).toBe("attract");
      expect(localStorage.getItem("ampactor_visited")).toBe("1");
    });

    // Each act() flushes the state the timers queued, so the BIOS lines, the
    // beat after the last one, and the landing are three separate advances.
    it("the boot moves on by itself after the last line", () => {
      localStorage.clear();
      const { result } = renderCabinet({ initialRoute: SELECT });
      expect(result.current.screen).toBe("boot");
      act(() => {
        vi.advanceTimersByTime(BOOT_PATTERN_MS + 10); // test pattern → the first BIOS line
      });
      act(() => {
        vi.advanceTimersByTime((BOOT_LINES.length - 1) * BOOT_LINE_MS + 10); // every line printed
      });
      expect(result.current.screen).toBe("boot");
      act(() => {
        vi.advanceTimersByTime(BOOT_BEAT_MS + 10); // the beat after READY.
      });
      expect(result.current.screen).toBe("select");
    });

    it("a key during the lines cuts the boot short", () => {
      localStorage.clear();
      const { result } = renderCabinet({ initialRoute: SELECT });
      act(() => {
        vi.advanceTimersByTime(BOOT_PATTERN_MS + 10); // on to the lines
      });
      act(() => {
        vi.advanceTimersByTime(3 * BOOT_LINE_MS); // a few lines in
      });
      expect(result.current.screen).toBe("boot");
      expect(result.current.bootLine).toBeLessThan(BOOT_LINES.length - 1);
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });
      expect(result.current.screen).toBe("select");
    });
  });

  describe("the Konami code", () => {
    it("drops the coin from the list", () => {
      localStorage.setItem("ampactor_visited", "1");
      const { result } = renderCabinet({ initialRoute: SELECT });
      expect(result.current.screen).toBe("select");
      expect(result.current.coinCount).toBe(0);
      const keys = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
      act(() => {
        for (const key of keys) window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      });
      expect(result.current.coinCount).toBe(3);
    });

    it("ignores a near miss", () => {
      localStorage.setItem("ampactor_visited", "1");
      const { result } = renderCabinet({ initialRoute: SELECT });
      const keys = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "a", "b"];
      act(() => {
        for (const key of keys) window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      });
      expect(result.current.coinCount).toBe(0);
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
