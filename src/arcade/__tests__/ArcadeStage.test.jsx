import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ArcadeStage from "../ArcadeStage";
import { SYSTEM_PROGRAMS } from "../../data/programs";

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
    playStart: vi.fn(),
    playInsertSting: vi.fn(),
    sound: true,
    toggleSound: vi.fn(),
  }),
}));

const HOME = { view: "home" };
const SELECT = { view: "arcade", screen: "select" };
const project = (id) => ({ view: "arcade", screen: "project", id });

function renderStage(route = HOME) {
  localStorage.setItem("ampactor_visited", "1");
  const consoleRef = createRef();
  const tunnelRef = createRef();
  const onNavigate = vi.fn();
  const utils = render(
    <ArcadeStage
      route={route}
      onNavigate={onNavigate}
      consoleRef={consoleRef}
      tunnelRef={tunnelRef}
    />,
  );
  return { ...utils, consoleRef, onNavigate };
}

describe("ArcadeStage", () => {
  it("at home shows the title card with the name, and START asks to enter", () => {
    const { onNavigate } = renderStage(HOME);
    expect(
      screen.getByRole("heading", { level: 1, name: "MORGAN ESPITIA" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "PRESS START" }));
    expect(onNavigate).toHaveBeenCalledWith({ type: "enter" });
  });

  it("the panel is live on the title card: A starts, the coin starts with credit", () => {
    const { onNavigate } = renderStage(HOME);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(onNavigate).toHaveBeenCalledWith({ type: "enter" });
    fireEvent.click(screen.getByRole("button", { name: "Insert coin" }));
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it("at the select route lists the cartridges and the operator programs", () => {
    renderStage(SELECT);
    const list = screen.getByRole("listbox", { name: "Project list" });
    expect(list).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /MENTL/ })).toBeInTheDocument();
    for (const p of SYSTEM_PROGRAMS)
      expect(screen.getByRole("option", { name: new RegExp(p.title) })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RESUME" })).toHaveAttribute("href", "/resume.html");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens an operator program from its route", () => {
    renderStage(project("high-scores"));
    expect(screen.getByRole("heading", { level: 1, name: "HIGH SCORES" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /FULL LEDGER/ })).toHaveAttribute("href", "/receipts/");
    expect(screen.getByRole("region", { name: "HIGH SCORES" })).toBeInTheDocument();
  });

  it("opens a cartridge from its route", () => {
    renderStage(project("mentl"));
    expect(screen.getByRole("heading", { level: 1, name: "MENTL" })).toBeInTheDocument();
  });
});
