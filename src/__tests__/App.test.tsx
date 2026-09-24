import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import App from "../App";

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
});
