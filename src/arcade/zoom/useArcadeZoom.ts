import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  lockScroll,
  lockedScrollY,
  setLockedScrollY,
  unlockScroll,
} from "./scrollLock";

export type CabinetMode = "attract" | "live";

export interface TunnelHandle {
  setRevealRadius(r: number): void;
  getRevealRadius?(): number;
}

interface ZoomOptions {
  initialZoomed: boolean;
  // The floor scale: slot width over the zoomed layout width.
  scale: number;
  // Changes whenever the console's layout size does (the viewport changed),
  // so a zoomed machine is re-pinned to cover the new viewport.
  layoutKey?: string;
  consoleRef: RefObject<HTMLElement | null>;
  backdropRef: RefObject<HTMLElement | null>;
  slotRef: RefObject<HTMLElement | null>;
  enterButtonRef: RefObject<HTMLElement | null>;
  tunnelRef?: RefObject<TunnelHandle | null>;
  reducedMotion?: boolean;
}

export interface ZoomOutOptions {
  // Seconds for the shrink. The cold open pulls back slower than an exit.
  duration?: number;
  // Bring the slot under the viewport first when it is mostly out of view.
  // The cold open keeps the top of the page, where the name is.
  recentre?: boolean;
  // Hand focus to the "Enter the arcade" control when the shrink lands. The
  // cold open leaves focus where the visitor put it: they never walked up.
  restoreFocus?: boolean;
}

// The translation that carries the console from its slot to the middle of
// the viewport, at full size.
interface Cover {
  x: number;
  y: number;
}

interface Pending {
  dir: "in" | "out";
  cover: Cover;
  duration: number;
  restoreFocus: boolean;
}

export const ZOOM_IN_SECONDS = 0.55;
export const ZOOM_OUT_SECONDS = 0.45;

// Pins the stage where its slot is and aims the console at the viewport. The
// stage becomes fixed at exactly the slot's box, so pinning moves nothing;
// from there the console is translated to the top of the viewport, centred,
// at full size. Written as custom properties on the slot, which the stage and
// the console inherit (stage.module.css).
function pin(slot: HTMLElement, console_: HTMLElement): Cover {
  const box = slot.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const cover = {
    x: (viewportWidth - console_.offsetWidth) / 2 - box.left,
    y: -box.top,
  };
  const style = slot.style;
  style.setProperty("--pin-x", `${box.left}px`);
  style.setProperty("--pin-y", `${box.top}px`);
  style.setProperty("--pin-w", `${box.width}px`);
  style.setProperty("--pin-h", `${box.height}px`);
  style.setProperty("--cover-x", `${cover.x}px`);
  style.setProperty("--cover-y", `${cover.y}px`);
  return cover;
}

// The camera dolly. The console is laid out at its zoomed size at all times
// and scaled down into its slot by CSS (`--k`). Off the floor its stage is
// pinned in place of the slot and the console is translated to cover the
// viewport, so a zoom animates one transform and no box on the page ever
// moves: nothing inside reflows or pops, and nothing counts as a layout
// shift, even when the move is not a response to input (the cold open's
// pull-back).
//
//   in:  lock the page → pin the stage where the slot is → tween the console
//        from scale(k) to the cover → the cabinet goes live and takes focus.
//   out: bring the slot under the locked viewport if it isn't → re-pin there
//        (the console keeps covering the viewport) → tween back to scale(k)
//        → unpin, unlock, back to attract, focus returns to "Enter".
//
// CSS owns both resting transforms, GSAP owns the transition, React owns the
// data-zoomed / data-pinned attributes; nobody writes another's property.
export function useArcadeZoom(options: ZoomOptions): {
  zoomed: boolean;
  animating: boolean;
  mode: CabinetMode;
  zoomIn: () => void;
  zoomOut: (options?: ZoomOutOptions) => void;
} {
  const [zoomed, setZoomed] = useState(options.initialZoomed);
  const [animating, setAnimating] = useState(false);
  const [mode, setMode] = useState<CabinetMode>(
    options.initialZoomed ? "live" : "attract",
  );
  const zoomedRef = useRef(zoomed);
  zoomedRef.current = zoomed;
  const pendingRef = useRef<Pending | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const zoomIn = useCallback(() => {
    const { consoleRef, slotRef } = optionsRef.current;
    const el = consoleRef.current;
    const slot = slotRef.current;
    if (!el || !slot || pendingRef.current || zoomedRef.current) return;
    lockScroll();
    pendingRef.current = {
      dir: "in",
      cover: pin(slot, el),
      duration: ZOOM_IN_SECONDS,
      restoreFocus: true,
    };
    setAnimating(true);
    setZoomed(true);
  }, []);

  const zoomOut = useCallback((out: ZoomOutOptions = {}) => {
    const {
      duration = ZOOM_OUT_SECONDS,
      recentre = true,
      restoreFocus = true,
    } = out;
    const { consoleRef, slotRef } = optionsRef.current;
    const el = consoleRef.current;
    const slot = slotRef.current;
    if (!el || !slot || pendingRef.current || !zoomedRef.current) return;
    // The visitor may have entered from far down the page. If the slot is
    // mostly out of view, move the pinned body so it sits mid-viewport before
    // the machine shrinks into it; a slot that is mostly visible (a phone
    // cabinet whose bottom runs past the fold) is left exactly where it was.
    if (recentre) {
      const rect = slot.getBoundingClientRect();
      const vh = window.innerHeight;
      const visible =
        Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0)) /
        Math.max(1, rect.height);
      if (visible < 0.5) {
        const y = lockedScrollY() ?? window.scrollY;
        setLockedScrollY(y + rect.top - (vh - rect.height) / 2);
      }
    }
    pendingRef.current = {
      dir: "out",
      // Wherever the slot is now; the console still covers the viewport.
      cover: pin(slot, el),
      duration,
      restoreFocus,
    };
    setAnimating(true);
    setZoomed(false);
  }, []);

  // A cabinet that mounts zoomed (a hard load of /arcade/, the floor's cold
  // open) starts in the posture a zoom-in would have left it in: the page
  // pinned behind it, the stage pinned in its slot, the room opaque.
  useLayoutEffect(() => {
    const { initialZoomed, slotRef, consoleRef, backdropRef } =
      optionsRef.current;
    if (!initialZoomed) return;
    lockScroll();
    if (slotRef.current && consoleRef.current) {
      pin(slotRef.current, consoleRef.current);
    }
    const backdrop = backdropRef.current;
    if (backdrop) gsap.set(backdrop, { opacity: 1 });
  }, []);

  // A zoomed machine follows the viewport: a resize, a rotation, a new
  // layout size re-pin it so it still covers the screen.
  const { layoutKey, scale } = options;
  useLayoutEffect(() => {
    if (!zoomed || pendingRef.current) return;
    const { slotRef, consoleRef } = optionsRef.current;
    if (slotRef.current && consoleRef.current) {
      pin(slotRef.current, consoleRef.current);
    }
  }, [zoomed, layoutKey, scale]);

  useEffect(() => {
    if (!zoomed) return;
    const onResize = () => {
      if (pendingRef.current) return;
      const { slotRef, consoleRef } = optionsRef.current;
      if (slotRef.current && consoleRef.current) {
        pin(slotRef.current, consoleRef.current);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [zoomed]);

  // Nothing stays pinned once the cabinet is gone.
  useEffect(() => () => unlockScroll(), []);

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    const el = optionsRef.current.consoleRef.current;
    if (!pending || !el) return;
    const { scale, backdropRef, enterButtonRef, tunnelRef, reducedMotion } =
      optionsRef.current;
    const backdrop = backdropRef.current;
    const { cover } = pending;

    const finish = () => {
      pendingRef.current = null;
      // Hand the transform back to CSS: the cover when zoomed, scale(var(--k))
      // in the slot.
      gsap.set(el, { clearProps: "transform" });
      if (pending.dir === "in") {
        setMode("live");
        el.focus({ preventScroll: true });
      } else {
        unlockScroll();
        setMode("attract");
        if (pending.restoreFocus) {
          enterButtonRef.current?.focus({ preventScroll: true });
        }
      }
      setAnimating(false);
    };

    if (reducedMotion) {
      if (backdrop) {
        gsap.set(backdrop, { opacity: pending.dir === "in" ? 1 : 0 });
      }
      tunnelRef?.current?.setRevealRadius(pending.dir === "in" ? 9999 : 0);
      finish();
      return;
    }

    if (pending.dir === "in") {
      gsap.fromTo(
        el,
        { x: 0, y: 0, scale, transformOrigin: "0 0" },
        {
          x: cover.x,
          y: cover.y,
          scale: 1,
          duration: pending.duration,
          ease: "power3.inOut",
          onComplete: finish,
        },
      );
      if (backdrop) {
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35 });
      }
      // The tunnel opens behind the machine as it arrives; the intro's own
      // reveal then has nothing left to do and skips itself.
      const tunnel = tunnelRef?.current;
      if (tunnel) {
        const rMax =
          Math.hypot(window.innerWidth / 2, window.innerHeight / 2) * 1.1;
        const proxy = { r: 0 };
        gsap.to(proxy, {
          r: rMax,
          duration: pending.duration,
          ease: "power2.out",
          onUpdate: () => tunnel.setRevealRadius(proxy.r),
        });
      }
    } else {
      gsap.fromTo(
        el,
        { x: cover.x, y: cover.y, scale: 1, transformOrigin: "0 0" },
        {
          x: 0,
          y: 0,
          scale,
          duration: pending.duration,
          ease: "power3.inOut",
          onComplete: finish,
        },
      );
      // The room's lights come up over most of a slow pull-back, and at the
      // usual pace for an ordinary exit.
      if (backdrop) {
        gsap.to(backdrop, {
          opacity: 0,
          duration: Math.max(0.35, pending.duration * 0.6),
        });
      }
    }
    // Runs on the commit that flipped `zoomed`; everything else is read from refs.
  }, [zoomed]);

  return { zoomed, animating, mode, zoomIn, zoomOut };
}
