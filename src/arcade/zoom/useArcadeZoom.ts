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

interface Pending {
  dir: "in" | "out";
  from: DOMRect;
  duration: number;
  restoreFocus: boolean;
}

export const ZOOM_IN_SECONDS = 0.55;
export const ZOOM_OUT_SECONDS = 0.45;

// The camera dolly. The console is laid out at its zoomed size at all times
// and scaled down into its slot by CSS (`--k`); zooming animates only a
// transform between the two rects, so nothing inside reflows or pops.
//
//   in:  lock the page → remember the miniature's rect → let React lay the
//        stage out fixed and full-screen → tween the transform from that rect
//        to identity → the cabinet goes live and takes focus.
//   out: bring the slot under the locked viewport if it isn't → remember the
//        full-screen rect → let React put the stage back in the slot → tween
//        from that rect to the CSS scale → unlock, back to attract, focus
//        returns to the "Enter the arcade" control.
//
// CSS owns the resting transform, GSAP owns the transition, React owns the
// data-zoomed attribute; nobody writes another's property.
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
    const el = optionsRef.current.consoleRef.current;
    if (!el || pendingRef.current || zoomedRef.current) return;
    lockScroll();
    pendingRef.current = {
      dir: "in",
      from: el.getBoundingClientRect(),
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
    const el = optionsRef.current.consoleRef.current;
    if (!el || pendingRef.current || !zoomedRef.current) return;
    // The visitor may have entered from far down the page. If the slot is
    // mostly out of view, move the pinned body so it sits mid-viewport before
    // the machine shrinks into it; a slot that is mostly visible (a phone
    // cabinet whose bottom runs past the fold) is left exactly where it was.
    const slot = optionsRef.current.slotRef.current;
    if (slot && recentre) {
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
      from: el.getBoundingClientRect(),
      duration,
      restoreFocus,
    };
    setAnimating(true);
    setZoomed(false);
  }, []);

  // A cabinet that mounts zoomed (a hard load of /arcade/, the floor's cold
  // open) starts in the posture a zoom-in would have left it in: the page
  // pinned behind it and the dark room opaque. Without this the room stays
  // see-through, and the floor shows around the machine.
  useLayoutEffect(() => {
    if (!optionsRef.current.initialZoomed) return;
    lockScroll();
    const backdrop = optionsRef.current.backdropRef.current;
    if (backdrop) gsap.set(backdrop, { opacity: 1 });
  }, []);

  // Nothing stays pinned once the cabinet is gone.
  useEffect(() => () => unlockScroll(), []);

  useLayoutEffect(() => {
    const pending = pendingRef.current;
    const el = optionsRef.current.consoleRef.current;
    if (!pending || !el) return;
    const { scale, backdropRef, enterButtonRef, tunnelRef, reducedMotion } =
      optionsRef.current;
    const to = el.getBoundingClientRect();
    const backdrop = backdropRef.current;

    const finish = () => {
      pendingRef.current = null;
      // Hand the transform back to CSS: none when zoomed, scale(var(--k)) in the slot.
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
      if (backdrop)
        gsap.set(backdrop, { opacity: pending.dir === "in" ? 1 : 0 });
      tunnelRef?.current?.setRevealRadius(pending.dir === "in" ? 9999 : 0);
      finish();
      return;
    }

    const dx = pending.from.left - to.left;
    const dy = pending.from.top - to.top;

    if (pending.dir === "in") {
      gsap.fromTo(
        el,
        { x: dx, y: dy, scale, transformOrigin: "0 0" },
        {
          x: 0,
          y: 0,
          scale: 1,
          duration: pending.duration,
          ease: "power3.inOut",
          onComplete: finish,
        },
      );
      if (backdrop)
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35 });
      // The tunnel opens behind the machine as it arrives; the intro's own
      // reveal then has nothing left to do and skips itself.
      const tunnel = tunnelRef?.current;
      if (tunnel) {
        const rMax =
          Math.hypot(window.innerWidth / 2, window.innerHeight / 2) * 1.1;
        const proxy = { r: 0 };
        gsap.to(proxy, {
          r: rMax,
          duration: ZOOM_IN_SECONDS,
          ease: "power2.out",
          onUpdate: () => tunnel.setRevealRadius(proxy.r),
        });
      }
    } else {
      gsap.fromTo(
        el,
        { x: dx, y: dy, scale: 1, transformOrigin: "0 0" },
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
