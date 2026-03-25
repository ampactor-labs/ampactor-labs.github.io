import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import BootScreen from "../BootScreen";

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
      <BootScreen lines={lines} currentLine={0} bootPhase={0} fs={fs} onSkip={onSkip} />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("matches snapshot in phase 0", () => {
    const { container } = render(
      <BootScreen lines={lines} currentLine={0} bootPhase={0} fs={fs} onSkip={onSkip} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders boot text in phase 1", () => {
    const { getByText } = render(
      <BootScreen lines={lines} currentLine={2} bootPhase={1} fs={fs} onSkip={onSkip} />,
    );
    expect(getByText("AMPACTOR BIOS v4.2.0")).toBeTruthy();
    expect(getByText("Loading DSP subsystem.......... OK")).toBeTruthy();
  });

  it("matches snapshot in phase 1", () => {
    const { container } = render(
      <BootScreen lines={lines} currentLine={3} bootPhase={1} fs={fs} onSkip={onSkip} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("shows PRESS ANY KEY line with special styling", () => {
    const { getByText } = render(
      <BootScreen lines={lines} currentLine={10} bootPhase={1} fs={fs} onSkip={onSkip} />,
    );
    expect(getByText("PRESS ANY KEY")).toBeTruthy();
  });

  it("shows skip hint when halfway through boot lines", () => {
    const { getByText } = render(
      <BootScreen lines={lines} currentLine={6} bootPhase={1} fs={fs} onSkip={onSkip} />,
    );
    expect(getByText(/press any key or tap/i)).toBeTruthy();
  });
});
