import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import ArcadeStage from "../ArcadeStage";

// Mock heavy hooks
vi.mock("../useIntroSequence", () => ({
  default: () => ({
    introComplete: true,
    skipIntro: vi.fn(),
  }),
}));

vi.mock("../useAmbientHum", () => ({
  default: () => ({
    playBlip: vi.fn(),
    playEnter: vi.fn(),
    playBack: vi.fn(),
    playInsertSting: vi.fn(),
  }),
}));

const SELECT = { view: "arcade", screen: "select" };
const FLOOR = { view: "floor" };
const METRICS = { zoomW: 900, zoomH: 800 };

function renderStage(props = {}) {
  const consoleRef = createRef();
  const backdropRef = createRef();
  const enterButtonRef = createRef();
  const tunnelRef = createRef();
  const onNavigate = vi.fn();
  const onEnter = vi.fn();
  const utils = render(
    <ArcadeStage
      mode="live"
      zoomed
      animating={false}
      scale={1}
      metrics={METRICS}
      route={SELECT}
      onNavigate={onNavigate}
      onEnter={onEnter}
      introVariant="console"
      consoleRef={consoleRef}
      backdropRef={backdropRef}
      enterButtonRef={enterButtonRef}
      tunnelRef={tunnelRef}
      {...props}
    />,
  );
  return { ...utils, consoleRef, enterButtonRef, onNavigate, onEnter };
}

describe("ArcadeStage", () => {
  it("renders the zoomed cabinet as a dialog with live controls", () => {
    const { container, consoleRef } = renderStage();
    expect(container.firstChild).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Arcade" })).toBe(
      consoleRef.current,
    );
    expect(screen.getByText("AMPACTOR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /insert coin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /navigate up/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /navigate down/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to the floor/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enter the arcade/i })).toBeNull();
    expect(container.querySelector(".crt-screen")).not.toHaveAttribute("inert");
  });

  it("‹ FLOOR asks the router to leave", () => {
    const { onNavigate } = renderStage();
    screen.getByRole("button", { name: /back to the floor/i }).click();
    expect(onNavigate).toHaveBeenCalledWith({ type: "exit" });
  });

  it("on the floor it is a miniature under one control, with the panel inert", () => {
    const { container, consoleRef, enterButtonRef, onEnter } = renderStage({
      mode: "attract",
      zoomed: false,
      scale: 0.71,
      route: FLOOR,
      introVariant: "screen",
    });
    const enter = screen.getByRole("button", { name: /enter the arcade/i });
    expect(enter).toBe(enterButtonRef.current);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(consoleRef.current.getAttribute("data-zoomed")).toBe("false");
    expect(consoleRef.current.style.getPropertyValue("--k")).toBe("0.71");
    // RTL's role queries ignore `inert`, so the attribute itself is asserted.
    expect(container.querySelector(".crt-screen")).toHaveAttribute("inert");
    expect(container.querySelector(".cabinet-body")).toHaveAttribute("inert");
    expect(screen.getByTestId("attract-screen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back to the floor/i })).toBeNull();
    enter.click();
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("lays the console out at the zoomed size at both depths", () => {
    const { consoleRef, rerender } = renderStage({
      mode: "attract",
      zoomed: false,
      scale: 0.5,
      route: FLOOR,
      introVariant: "screen",
    });
    expect(consoleRef.current.style.width).toBe("900px");
    expect(consoleRef.current.style.height).toBe("800px");
    rerender(
      <ArcadeStage
        mode="live"
        zoomed
        animating={false}
        scale={0.5}
        metrics={METRICS}
        route={SELECT}
        onNavigate={vi.fn()}
        onEnter={vi.fn()}
        introVariant="screen"
        consoleRef={consoleRef}
        backdropRef={createRef()}
        enterButtonRef={createRef()}
        tunnelRef={createRef()}
      />,
    );
    expect(consoleRef.current.style.width).toBe("900px");
    expect(consoleRef.current.style.height).toBe("800px");
    expect(consoleRef.current.getAttribute("data-zoomed")).toBe("true");
  });

  it("keeps the panel quiet while the zoom is animating", () => {
    const { container } = renderStage({ animating: true });
    expect(container.querySelector(".crt-screen")).toHaveAttribute("inert");
    expect(container.querySelector(".cabinet-body")).toHaveAttribute("inert");
    expect(screen.queryByRole("button", { name: /enter the arcade/i })).toBeNull();
  });
});
