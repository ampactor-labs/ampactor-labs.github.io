import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import App from "../App";
import { BOOT_LINES } from "../arcade/constants";
import {
  BOOT_PATTERN_MS,
  BOOT_LINE_MS,
  BOOT_BEAT_MS,
} from "../arcade/hooks/useCabinetState";

// The power-on is a GSAP timeline; here it completes on the spot.
vi.mock("gsap/gsap-core", () => {
  const complete = (vars: { onComplete?: () => void }) => {
    vars.onComplete?.();
    return {};
  };
  return {
    default: {
      fromTo: (_el: unknown, _from: unknown, to: { onComplete?: () => void }) =>
        complete(to),
      to: (_el: unknown, vars: { onComplete?: () => void }) => complete(vars),
      set: () => {},
      timeline: (vars?: { onComplete?: () => void }) => {
        const tl = {
          to: () => tl,
          set: () => tl,
          call: () => tl,
          kill: () => {},
          progress: () => {
            vars?.onComplete?.();
          },
        };
        // A real timeline runs; this one is already over.
        queueMicrotask(() => vars?.onComplete?.());
        return tl;
      },
    },
  };
});

vi.mock("../arcade/useAmbientHum", () => ({
  default: () => ({
    playBlip: vi.fn(),
    playEnter: vi.fn(),
    playBack: vi.fn(),
    playInsertSting: vi.fn(),
    sound: true,
    toggleSound: vi.fn(),
  }),
}));

// jsdom traverses history on a timer and fires popstate when it lands, so a
// Back press is awaited as the event, not as a delay.
function nextPopState(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 1000);
    window.addEventListener("popstate", done, { once: true });
  });
}

async function pressBack() {
  await act(async () => {
    const popped = nextPopState();
    window.history.back();
    await popped;
  });
}

const LIST = { name: "Project list" };
const returning = () => localStorage.setItem("ampactor_visited", "1");

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    // A fresh entry at the end of the session history: a push truncates
    // whatever forward entries the last test's Back left behind, so the
    // length arithmetic below holds.
    window.history.pushState(null, "", "/");
  });

  it("lands on the list at home, with the name as the heading", () => {
    returning();
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: /MORGAN ESPITIA/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PRESS START" })).toBeNull();
    expect(screen.getByRole("link", { name: "RESUME" })).toHaveAttribute(
      "href",
      "/resume.html",
    );
    expect(window.location.pathname).toBe("/");
  });

  it("Escape on the list stays on the list and adds no history", async () => {
    returning();
    render(<App />);
    const entries = window.history.length;
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(window.location.pathname).toBe("/");
    expect(window.history.length).toBe(entries);
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
  });

  it("a cartridge opened from home goes back to the list at home", async () => {
    returning();
    render(<App />);
    await act(async () => {
      fireEvent.keyDown(window, { key: "Enter" });
    });
    expect(window.history.state).toMatchObject({ screen: "project" });
    await pressBack();
    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
  });

  it("a hard load of /arcade/ mounts on the list", () => {
    returning();
    window.history.replaceState(null, "", "/arcade/");
    render(<App />);
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
  });

  it("a deep link opens the cartridge over a select entry", async () => {
    returning();
    window.history.replaceState(null, "", "/arcade/#mentl");
    render(<App />);
    // The readout loads on demand, so the first look waits for it.
    expect(
      await screen.findByRole("heading", { level: 1, name: "MENTL" }),
    ).toBeInTheDocument();
    expect(window.history.state).toMatchObject({ screen: "project", id: "mentl" });
    await pressBack();
    expect(window.location.pathname + window.location.hash).toBe("/arcade/");
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
  });

  it("a deep link opens an operator program", async () => {
    returning();
    window.history.replaceState(null, "", "/arcade/#credits");
    render(<App />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "CREDITS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("MAKE ART WITH YOUR FRIENDS")).toBeInTheDocument();
  });

  it("corrects an unknown cartridge to the list without a new entry", async () => {
    returning();
    window.history.replaceState(null, "", "/arcade/#no-such-thing");
    const entries = window.history.length;
    render(<App />);
    await act(async () => {});
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
    expect(window.location.pathname + window.location.hash).toBe("/arcade/");
    expect(window.history.length).toBe(entries);
    expect(window.history.state).toMatchObject({ view: "arcade", screen: "select" });
  });

  // A hash edited by hand after load arrives as a popstate with no state.
  it("corrects an unknown cartridge typed into the address bar", async () => {
    returning();
    window.history.replaceState(null, "", "/arcade/");
    render(<App />);
    await act(async () => {
      window.history.pushState(null, "", "/arcade/#typo");
      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    });
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
    expect(window.location.pathname + window.location.hash).toBe("/arcade/");
  });

  describe("a first visit", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("boots, then lands on the list by itself and remembers the visit", async () => {
      render(<App />);
      await act(async () => {});
      // The test pattern first; no list yet.
      expect(screen.queryByRole("listbox", LIST)).toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(BOOT_PATTERN_MS + 10); // test pattern → the first BIOS line
      });
      expect(screen.getByText(/AMPACTOR BIOS/)).toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime((BOOT_LINES.length - 1) * BOOT_LINE_MS + 10); // every line
      });
      expect(screen.queryByRole("listbox", LIST)).toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(BOOT_BEAT_MS + 10); // the beat after READY.
      });
      expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
      expect(localStorage.getItem("ampactor_visited")).toBe("1");
      expect(window.location.pathname).toBe("/");
    });
  });
});
