import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isScrollLocked,
  lockScroll,
  lockedScrollY,
  setLockedScrollY,
  unlockScroll,
} from "../scrollLock";

describe("scrollLock", () => {
  beforeEach(() => {
    unlockScroll();
    document.body.removeAttribute("style");
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    Object.defineProperty(document.body, "scrollHeight", {
      value: 4000,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", { value: 800, writable: true });
  });

  it("pins the body at the current scroll offset and restores it", () => {
    window.scrollY = 320;
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    lockScroll();
    expect(isScrollLocked()).toBe(true);
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-320px");
    expect(document.body.style.overflow).toBe("hidden");
    expect(lockedScrollY()).toBe(320);

    unlockScroll();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(scrollTo).toHaveBeenCalledWith(0, 320);
    scrollTo.mockRestore();
  });

  it("is idempotent", () => {
    lockScroll();
    lockScroll();
    expect(document.body.style.position).toBe("fixed");
    unlockScroll();
    unlockScroll();
    expect(document.body.style.position).toBe("");
    expect(lockedScrollY()).toBeNull();
  });

  it("moves the pinned body when asked to scroll while locked", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    lockScroll();
    setLockedScrollY(1000);
    expect(document.body.style.top).toBe("-1000px");
    setLockedScrollY(-50);
    expect(document.body.style.top).toBe("0px");
    setLockedScrollY(99999);
    expect(document.body.style.top).toBe("-3200px"); // scrollHeight - innerHeight
    unlockScroll();
    expect(scrollTo).toHaveBeenCalledWith(0, 3200);
    scrollTo.mockRestore();
  });

  it("ignores locked-scroll requests when not locked", () => {
    setLockedScrollY(500);
    expect(document.body.style.top).toBe("");
  });
});
