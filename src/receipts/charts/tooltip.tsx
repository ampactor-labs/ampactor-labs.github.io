import {
  useCallback,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import styles from "./Charts.module.css";

// One hover tooltip per chart, positioned inside the chart's own box and
// hidden from assistive tech: the <desc> and the table view carry the same
// facts for readers who cannot hover.
export interface Tip {
  x: number;
  y: number;
  content: ReactNode;
}

export function useChartTooltip(wrapRef: RefObject<HTMLElement | null>) {
  const [tip, setTip] = useState<Tip | null>(null);

  const show = useCallback(
    (event: PointerEvent, content: ReactNode) => {
      const box = wrapRef.current?.getBoundingClientRect();
      if (!box) return;
      setTip({
        x: event.clientX - box.left,
        y: event.clientY - box.top,
        content,
      });
    },
    [wrapRef],
  );

  const hide = useCallback(() => setTip(null), []);

  return { tip, show, hide };
}

export function ChartTooltip({
  tip,
  width,
}: {
  tip: Tip | null;
  width: number;
}) {
  if (!tip) return null;
  // Keep the bubble inside the chart: centred on the pointer, nudged in from
  // either edge, and above the pointer with a small gap.
  const half = 90;
  const x = Math.min(Math.max(tip.x, half), Math.max(half, width - half));
  return (
    <div
      className={styles.tooltip}
      style={{ left: x, top: Math.max(tip.y - 14, 8) }}
      aria-hidden="true"
    >
      {tip.content}
    </div>
  );
}
