import { useEffect, useRef, useState, type RefObject } from "react";

// The rendered width of a chart's box, so the SVG is drawn at real pixels
// (text must never be stretched by a viewBox). Without a ResizeObserver
// (jsdom) the fallback width stands.
export function useMeasure<T extends HTMLElement>(
  fallback = 640,
): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
