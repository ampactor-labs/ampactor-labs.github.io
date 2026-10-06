import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bedRunning,
  getBus,
  hasBus,
  resetBus,
  setSound,
  soundOn,
  startBed,
  stopBed,
  withClock,
} from "../bus";

const contexts = () => window.AudioContext.instances.length;
// resume() settles on the microtask queue; a macrotask runs after all of it.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  resetBus();
  localStorage.clear();
});
afterEach(() => resetBus());

describe("the cabinet's sound bus", () => {
  it("makes nothing until a sound is asked for, then one context for all", () => {
    const before = contexts();
    expect(hasBus()).toBe(false);
    // The switch alone never makes a context.
    setSound(false);
    setSound(true);
    expect(contexts()).toBe(before);
    expect(getBus()).toBe(getBus());
    expect(contexts()).toBe(before + 1);
  });

  it("remembers SOUND OFF, and a context made later starts silent", () => {
    expect(soundOn()).toBe(true);
    setSound(false);
    expect(localStorage.getItem("ampactor_sound")).toBe("off");
    expect(soundOn()).toBe(false);
    expect(getBus().master.gain.value).toBe(0);
  });

  it("ramps the master when the switch flips with the room running", () => {
    const ramp = vi.spyOn(getBus().master.gain, "linearRampToValueAtTime");
    setSound(false);
    expect(ramp).toHaveBeenLastCalledWith(0, expect.any(Number));
    setSound(true);
    expect(ramp).toHaveBeenLastCalledWith(0.65, expect.any(Number));
  });

  it("SOUND OFF is silence all the way down: no context, no notes, no room", () => {
    setSound(false);
    const before = contexts();
    const play = vi.fn();
    withClock(play);
    startBed();
    expect(play).not.toHaveBeenCalled();
    expect(bedRunning()).toBe(false);
    expect(contexts()).toBe(before);
  });

  it("switching off stops the room and puts the context to sleep", () => {
    vi.useFakeTimers();
    try {
      startBed();
      expect(bedRunning()).toBe(true);
      setSound(false);
      expect(bedRunning()).toBe(false);
      vi.advanceTimersByTime(250);
      expect(getBus().ctx.state).toBe("suspended");
    } finally {
      vi.useRealTimers();
    }
  });

  it("waits for a sleeping clock before it schedules a note", async () => {
    const bus = getBus();
    bus.ctx.state = "suspended";
    const play = vi.fn();
    withClock(play);
    expect(play).not.toHaveBeenCalled();
    await settle();
    expect(play).toHaveBeenCalledWith(bus, 0);
  });

  it("starts the bed once and stops it", () => {
    const oscillators = vi.spyOn(window.AudioContext.prototype, "createOscillator");
    startBed();
    startBed();
    expect(bedRunning()).toBe(true);
    // The root, the fifth and the filter's slow LFO.
    expect(oscillators).toHaveBeenCalledTimes(3);
    stopBed(0.1);
    expect(bedRunning()).toBe(false);
    oscillators.mockRestore();
  });

  it("a stop asked for while the clock wakes still lands, and a restart wins", async () => {
    getBus().ctx.state = "suspended";
    startBed();
    stopBed(0.1);
    await settle();
    expect(bedRunning()).toBe(false);

    getBus().ctx.state = "suspended";
    startBed();
    stopBed(0.1);
    startBed();
    await settle();
    expect(bedRunning()).toBe(true);
  });
});
