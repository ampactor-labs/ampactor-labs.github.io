import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import App from "../App";
import { BOOT_LINES } from "../arcade/constants";

// The power-on is a GSAP timeline; here it completes on the spot.
vi.mock("gsap", () => {
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

const START = { name: "PRESS START" };
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

  it("lands on the title card, with the name as the heading", () => {
    returning();
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: "MORGAN ESPITIA" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", START)).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.pathname).toBe("/");
    expect(window.history.state).toEqual({ v: 1, view: "home" });
  });

  it("PRESS START pushes /arcade/ and shows the list with the résumé one press away", async () => {
    returning();
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", START));
    });
    expect(window.location.pathname).toBe("/arcade/");
    expect(window.history.state).toMatchObject({
      v: 1,
      view: "arcade",
      screen: "select",
      fromHome: true,
    });
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RESUME" })).toHaveAttribute(
      "href",
      "/resume.html",
    );
  });

  it("Escape on the list walks history back to the title card", async () => {
    returning();
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", START));
    });
    await act(async () => {
      const popped = nextPopState();
      fireEvent.keyDown(window, { key: "Escape" });
      await popped;
    });
    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("button", START)).toBeInTheDocument();
    expect(screen.queryByRole("listbox", LIST)).toBeNull();
  });

  it("browser Back from the list lands on the title card", async () => {
    returning();
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", START));
    });
    await pressBack();
    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("button", START)).toBeInTheDocument();
  });

  it("a hard load of /arcade/ mounts on the list, and leaving gives the title card its own entry", async () => {
    returning();
    window.history.replaceState(null, "", "/arcade/");
    render(<App />);
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
    const entries = window.history.length;
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(window.location.pathname).toBe("/");
    expect(window.history.length).toBe(entries + 1);
    expect(screen.getByRole("button", START)).toBeInTheDocument();
    // ...so Back returns to the list rather than leaving the site.
    await pressBack();
    expect(window.location.pathname).toBe("/arcade/");
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
  });

  it("a deep link opens the cartridge over a select entry", async () => {
    returning();
    window.history.replaceState(null, "", "/arcade/#mentl");
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 2, name: "MENTL" }),
    ).toBeInTheDocument();
    expect(window.history.state).toMatchObject({ screen: "project", id: "mentl" });
    await pressBack();
    expect(window.location.pathname + window.location.hash).toBe("/arcade/");
    expect(screen.getByRole("listbox", LIST)).toBeInTheDocument();
  });

  it("a deep link opens an operator program", () => {
    returning();
    window.history.replaceState(null, "", "/arcade/#credits");
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 2, name: "CREDITS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("THANK YOU FOR PLAYING")).toBeInTheDocument();
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

    it("boots, then lands on the title card by itself and remembers the visit", async () => {
      render(<App />);
      await act(async () => {});
      // The test pattern first; no title card yet.
      expect(screen.queryByRole("button", START)).toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(900); // test pattern → the first BIOS line
      });
      expect(screen.getByText(/AMPACTOR BIOS/)).toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime((BOOT_LINES.length - 1) * 130 + 50); // every line
      });
      expect(screen.queryByRole("button", START)).toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(1500); // the beat after READY.
      });
      expect(screen.getByRole("button", START)).toBeInTheDocument();
      expect(localStorage.getItem("ampactor_visited")).toBe("1");
      expect(window.location.pathname).toBe("/");
    });
  });
});
