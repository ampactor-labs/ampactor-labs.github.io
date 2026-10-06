import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import useAmbientHum from "../useAmbientHum";
import { bedRunning, hasBus, resetBus } from "../audio/bus";

const contexts = () => window.AudioContext.instances.length;
const tap = () => window.dispatchEvent(new Event("pointerdown"));

beforeEach(() => {
  resetBus();
  localStorage.clear();
});
afterEach(() => resetBus());

describe("the cabinet's sound", () => {
  it("is silent on the title card: a tap and a key make no context", () => {
    const before = contexts();
    renderHook(() => useAmbientHum({ enabled: false }));
    act(() => {
      tap();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(contexts()).toBe(before);
    expect(hasBus()).toBe(false);
  });

  it("START is the ignition: the room comes up under it", () => {
    const { result } = renderHook(() => useAmbientHum({ enabled: false }));
    act(() => result.current.playStart());
    expect(hasBus()).toBe(true);
    expect(bedRunning()).toBe(true);
  });

  it("in the arcade the first gesture wakes the room", () => {
    renderHook(() => useAmbientHum({ enabled: true }));
    expect(hasBus()).toBe(false);
    act(() => tap());
    expect(hasBus()).toBe(true);
    expect(bedRunning()).toBe(true);
  });

  it("going back to the title card takes the room down", () => {
    const { rerender } = renderHook(
      ({ enabled }) => useAmbientHum({ enabled }),
      { initialProps: { enabled: true } },
    );
    act(() => tap());
    rerender({ enabled: false });
    expect(bedRunning()).toBe(false);
  });

  it("SOUND OFF takes the room down; back on in the arcade, it comes up", () => {
    const { result } = renderHook(() => useAmbientHum({ enabled: true }));
    act(() => tap());
    expect(bedRunning()).toBe(true);
    act(() => result.current.toggleSound());
    expect(bedRunning()).toBe(false);
    act(() => result.current.toggleSound());
    expect(bedRunning()).toBe(true);
  });

  it("SOUND OFF is remembered for the next visit", () => {
    const { result } = renderHook(() => useAmbientHum({ enabled: false }));
    expect(result.current.sound).toBe(true);
    act(() => result.current.toggleSound());
    expect(result.current.sound).toBe(false);
    expect(localStorage.getItem("ampactor_sound")).toBe("off");
    const next = renderHook(() => useAmbientHum({ enabled: false }));
    expect(next.result.current.sound).toBe(false);
    // Flipping the switch on the title card still makes no context.
    expect(hasBus()).toBe(false);
  });
});
