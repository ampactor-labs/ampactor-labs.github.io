import type { Page } from "@playwright/test";

// axe measures what is on screen at the moment it runs, and an entrance is a
// moment, not the screen: a link caught at the start of its 260 ms dash, or a
// page mid view-transition, has almost no contrast and no hit-testable layout.
// Every scan waits for the finite animations to finish first. The loops (the
// idle sweep, PRESS START breathing, the marquee) run forever and the
// scroll-driven reveals follow the scroll, so both are left alone.
export async function settled(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      if (animation.timeline && animation.timeline !== document.timeline)
        return true;
      if (animation.effect?.getComputedTiming().iterations === Infinity)
        return true;
      return animation.playState !== "running";
    }),
  );
}
