import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import BootScreen from "../BootScreen";
import { BOOT_LINES } from "../../../constants";
import { WORDS } from "../../../../data/profile";

const fs = (size) => size;
const lines = [
  "AMPACTOR BIOS v4.2.0",
  "Loading DSP subsystem.......... OK",
  "Mounting effect algebra........ OK",
  "Calibrating resonance field.... OK",
  "Linking x402 payment layer..... OK",
  "Scanning 9 security verticals.. OK",
  "Phase coupling established..... OK",
  "",
  "ALL SYSTEMS NOMINAL",
  "",
  "PRESS ANY KEY",
];
const onSkip = vi.fn();

describe("BootScreen", () => {
  it("renders test pattern in phase 0", () => {
    const { container } = render(
      <BootScreen
        lines={lines}
        currentLine={0}
        bootPhase={0}
        fs={fs}
        onSkip={onSkip}
      />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("matches snapshot in phase 0", () => {
    const { container } = render(
      <BootScreen
        lines={lines}
        currentLine={0}
        bootPhase={0}
        fs={fs}
        onSkip={onSkip}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("holds the test card while the tube is still powering on", () => {
    const props = { lines, currentLine: 0, bootPhase: 0, fs, onSkip };
    const { container, rerender } = render(
      <BootScreen {...props} introComplete={false} />,
    );
    expect(container.firstChild.style.animation).toBe("");
    rerender(<BootScreen {...props} introComplete />);
    expect(container.firstChild.style.animation).toMatch(/testPattern/);
  });

  it("renders boot text in phase 1", () => {
    const { getByText } = render(
      <BootScreen
        lines={lines}
        currentLine={2}
        bootPhase={1}
        fs={fs}
        onSkip={onSkip}
      />,
    );
    expect(getByText("AMPACTOR BIOS v4.2.0")).toBeTruthy();
    expect(getByText("Loading DSP subsystem.......... OK")).toBeTruthy();
  });

  it("matches snapshot in phase 1", () => {
    const { container } = render(
      <BootScreen
        lines={lines}
        currentLine={3}
        bootPhase={1}
        fs={fs}
        onSkip={onSkip}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("shows PRESS ANY KEY line with special styling", () => {
    const { getByText } = render(
      <BootScreen
        lines={lines}
        currentLine={10}
        bootPhase={1}
        fs={fs}
        onSkip={onSkip}
      />,
    );
    expect(getByText("PRESS ANY KEY")).toBeTruthy();
  });

  it("sets each BIOS status line as a checklist row: name, verb and a lit OK", () => {
    const { container, getByText, getAllByText } = render(
      <BootScreen
        lines={BOOT_LINES}
        currentLine={BOOT_LINES.length - 1}
        bootPhase={1}
        fs={fs}
        onSkip={onSkip}
      />,
    );
    expect(getByText("mentl")).toBeTruthy();
    expect(getByText("compiling")).toBeTruthy();
    const statusLines = BOOT_LINES.filter((line) => / \.{2,} .+ \.{2,} OK$/.test(line));
    const oks = getAllByText("OK");
    expect(oks).toHaveLength(statusLines.length);
    expect(oks.every((cell) => cell.className === "ok-cell")).toBe(true);
    // The dot leaders and the block cursor are gone; the words are not.
    expect(container.textContent).not.toContain("..");
    expect(container.textContent).not.toContain("\u2588");
  });

  it("ends the real BIOS on the operator's sign-off, lit, then READY.", () => {
    const { getByText } = render(
      <BootScreen
        lines={BOOT_LINES}
        currentLine={BOOT_LINES.length - 1}
        bootPhase={1}
        fs={fs}
        onSkip={onSkip}
      />,
    );
    expect(BOOT_LINES.slice(-3)).toEqual([WORDS.boot, "", "READY."]);
    expect(getByText(WORDS.boot).style.color).toBe("rgb(0, 229, 255)");
    expect(getByText("READY.").style.color).toBe("var(--cab-voice)");
  });
});
