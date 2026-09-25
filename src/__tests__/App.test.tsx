import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import App from "../App";

// The cold open's clock is gsap.delayedCall; tests fire it by hand.
const { delayed } = vi.hoisted(() => ({ delayed: [] as Array<() => void> }));

function runClock() {
  for (const fn of delayed.splice(0)) fn();
}

// The zoom is a GSAP tween; here it completes on the spot so the state
// machine can be walked synchronously.
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
      delayedCall: (_seconds: number, fn: () => void) => {
        delayed.push(fn);
        return {
          kill: () => {
            const i = delayed.indexOf(fn);
            if (i >= 0) delayed.splice(i, 1);
          },
        };
      },
      timeline: () => {
        const tl = {
          to: () => tl,
          set: () => tl,
          call: () => tl,
          kill: () => {},
          progress: () => {},
        };
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

const ENTER = { name: "Enter the arcade" };
const FLOOR = { name: "Back to the floor" };

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    delayed.length = 0;
    document.documentElement.removeAttribute("data-cold-open");
    window.history.replaceState(null, "", "/");
    document.body.removeAttribute("style");
  });

  it("lands on the floor with the cabinet as one control", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Morgan Espitia" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", ENTER)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.pathname).toBe("/");
    expect(window.history.state).toEqual({ v: 1, view: "floor" });
  });

  it("entering pushes /arcade/, zooms, locks the page, and makes the floor inert", async () => {
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", ENTER));
    });
    expect(window.location.pathname).toBe("/arcade/");
    expect(window.history.state).toMatchObject({
      v: 1,
      view: "arcade",
      screen: "select",
      fromFloor: true,
    });
    const dialog = screen.getByRole("dialog", { name: "Arcade" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.activeElement).toBe(dialog);
    expect(document.body.style.position).toBe("fixed");
    expect(screen.getByRole("banner")).toHaveAttribute("inert");
    expect(screen.getByRole("contentinfo")).toHaveAttribute("inert");
    expect(screen.queryByRole("button", ENTER)).toBeNull();
  });

  it("‹ FLOOR walks history back to the floor and restores focus", async () => {
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", ENTER));
    });
    await act(async () => {
      const popped = nextPopState();
      fireEvent.click(screen.getByRole("button", FLOOR));
      await popped;
    });
    expect(window.location.pathname).toBe("/");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.position).toBe("");
    expect(document.activeElement).toBe(screen.getByRole("button", ENTER));
    expect(screen.getByRole("banner")).not.toHaveAttribute("inert");
  });

  it("browser Back leaves the arcade", async () => {
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", ENTER));
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await pressBack();
    expect(window.location.pathname).toBe("/");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a hard load of /arcade/ mounts zoomed and leaving gives the floor its own entry", async () => {
    window.history.replaceState(null, "", "/arcade/");
    render(<App />);
    expect(screen.getByRole("dialog", { name: "Arcade" })).toBeInTheDocument();
    expect(window.history.state).toEqual({
      v: 1,
      view: "arcade",
      screen: "select",
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", FLOOR));
    });
    expect(window.location.pathname).toBe("/");
    expect(window.history.state).toEqual({ v: 1, view: "floor" });
    expect(screen.queryByRole("dialog")).toBeNull();
    // Back returns into the arcade.
    await pressBack();
    expect(window.location.pathname).toBe("/arcade/");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("a deep link opens the cartridge over a select entry", async () => {
    window.history.replaceState(null, "", "/arcade/#mentl");
    render(<App />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(window.history.state).toMatchObject({
      screen: "project",
      id: "mentl",
    });
    expect(
      screen.getByRole("heading", { level: 2, name: /mentl/i }),
    ).toBeInTheDocument();
    await pressBack();
    expect(window.location.pathname).toBe("/arcade/");
    expect(window.history.state).toMatchObject({ screen: "select" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("listbox", { name: /project list/i }),
    ).toBeInTheDocument();
  });

  it("goes to a floor anchor loaded from another page", () => {
    window.history.replaceState(null, "", "/#how");
    const spy = vi.spyOn(Element.prototype, "scrollIntoView");
    render(<App />);
    expect(spy.mock.contexts.map((el) => (el as Element).id)).toContain("how");
    // The address keeps its anchor.
    expect(window.location.hash).toBe("#how");
    spy.mockRestore();
  });

  // The first visit's show. The pre-paint script (coldOpen.test.ts) has marked
  // <html>; the app reads the mark.
  describe("the cold open", () => {
    beforeEach(() => {
      document.documentElement.setAttribute("data-cold-open", "");
    });

    it("opens inside the machine, then pulls back to the floor without touching history", async () => {
      const entries = window.history.length;
      render(<App />);
      // The machine fills the screen, but it is a picture: not a dialog, no
      // way out but the show ending, and the floor stays readable.
      expect(
        document.querySelector('[data-zoomed="true"][data-cold-open]'),
      ).not.toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.queryByRole("button", FLOOR)).toBeNull();
      expect(screen.queryByRole("button", ENTER)).toBeNull();
      expect(screen.getByRole("banner")).not.toHaveAttribute("inert");
      expect(document.body.style.position).toBe("fixed");

      await act(async () => runClock());

      expect(document.documentElement).not.toHaveAttribute("data-cold-open");
      expect(localStorage.getItem("ampactor_visited")).toBe("1");
      expect(document.body.style.position).toBe("");
      expect(screen.getByRole("button", ENTER)).toBeInTheDocument();
      // Focus is left where the visitor would expect on a fresh page.
      expect(document.activeElement).toBe(document.body);
      expect(window.location.pathname).toBe("/");
      expect(window.history.state).toEqual({ v: 1, view: "floor" });
      expect(window.history.length).toBe(entries);
    });

    it("ends at the first key, and a shortcut is not a key", async () => {
      render(<App />);
      await act(async () => {
        fireEvent.keyDown(window, { key: "Meta", metaKey: true });
      });
      expect(screen.queryByRole("button", ENTER)).toBeNull();
      await act(async () => {
        fireEvent.keyDown(window, { key: "Tab" });
      });
      expect(screen.getByRole("button", ENTER)).toBeInTheDocument();
      expect(localStorage.getItem("ampactor_visited")).toBe("1");
      expect(delayed).toHaveLength(0);
    });

    it("ends at a press anywhere", async () => {
      render(<App />);
      await act(async () => {
        fireEvent.pointerDown(document.body);
      });
      expect(screen.getByRole("button", ENTER)).toBeInTheDocument();
    });

    it("leaves the machine booted: walking up afterwards cuts straight to the list", async () => {
      render(<App />);
      await act(async () => runClock());
      await act(async () => {
        fireEvent.click(screen.getByRole("button", ENTER));
      });
      expect(
        screen.getByRole("dialog", { name: "Arcade" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("listbox", { name: /project list/i }),
      ).toBeInTheDocument();
    });

    it("walking in during the show goes straight in", async () => {
      render(<App />);
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Enter the arcade ▸" }),
        );
      });
      expect(window.location.pathname).toBe("/arcade/");
      expect(document.documentElement).not.toHaveAttribute("data-cold-open");
      const dialog = screen.getByRole("dialog", { name: "Arcade" });
      expect(document.activeElement).toBe(dialog);
      expect(screen.getByRole("banner")).toHaveAttribute("inert");
      expect(delayed).toHaveLength(0);
    });

    it("is ignored anywhere but the floor", () => {
      window.history.replaceState(null, "", "/arcade/");
      render(<App />);
      expect(
        screen.getByRole("dialog", { name: "Arcade" }),
      ).toBeInTheDocument();
      expect(delayed).toHaveLength(0);
    });
  });
});
