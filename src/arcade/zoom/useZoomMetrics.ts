import { useEffect, useState, type RefObject } from "react";

// The cabinet is always laid out at the size it has when zoomed: min(900px,
// 100vw) wide and 100dvh tall. On the floor that layout is scaled down to fit
// its slot, so zooming is a pure transform and nothing inside ever reflows. A
// hidden probe element carries exactly those CSS dimensions (see
// Floor.module.css) and is measured with a ResizeObserver, so the numbers
// follow the viewport, the mobile browser chrome and the dvh unit without any
// arithmetic of our own.

export const ZOOM_MAX_WIDTH = 900;

export interface ZoomMetrics {
  zoomW: number;
  zoomH: number;
}

export function fallbackMetrics(): ZoomMetrics {
  if (typeof window === "undefined") return { zoomW: ZOOM_MAX_WIDTH, zoomH: 800 };
  return {
    zoomW: Math.min(ZOOM_MAX_WIDTH, window.innerWidth || ZOOM_MAX_WIDTH),
    zoomH: window.innerHeight || 800,
  };
}

function observeLayout(
  el: HTMLElement,
  onChange: () => void,
): () => void {
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(onChange);
    observer.observe(el);
    return () => observer.disconnect();
  }
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useZoomMetrics(
  probeRef: RefObject<HTMLElement | null>,
): ZoomMetrics {
  const [metrics, setMetrics] = useState<ZoomMetrics>(fallbackMetrics);

  useEffect(() => {
    const el = probeRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const next = w > 0 && h > 0 ? { zoomW: w, zoomH: h } : fallbackMetrics();
      setMetrics((prev) =>
        prev.zoomW === next.zoomW && prev.zoomH === next.zoomH ? prev : next,
      );
    };
    measure();
    return observeLayout(el, measure);
  }, [probeRef]);

  return metrics;
}

// The layout width of an element (its slot on the floor), or null until it
// has one. Layout width, not the bounding rect: the slot is never transformed,
// but the rule holds for everything that feeds the scale.
export function useLayoutWidth(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setWidth(w > 0 ? w : null);
    };
    measure();
    return observeLayout(el, measure);
  }, [ref]);

  return width;
}

// On a phone the zoomed layout is the viewport itself, so an uncapped
// miniature would be nearly full-size and push the name a screen away. The
// cap keeps the machine a machine on the floor: on desktop the slot decides
// (640px of a 900px layout is 0.71), on phones the cap does.
export const MAX_FLOOR_SCALE = 0.72;

// How far the cabinet shrinks to stand in a slot of `slotWidth`. Never above
// the cap: a slot wider than that just leaves room around the machine.
export function cabinetScale(slotWidth: number | null, metrics: ZoomMetrics): number {
  const width = slotWidth ?? Math.min(640, metrics.zoomW);
  return Math.min(MAX_FLOOR_SCALE, width / metrics.zoomW);
}
