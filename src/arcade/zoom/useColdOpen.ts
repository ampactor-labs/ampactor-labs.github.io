import gsap from "gsap";
import { useEffect, useRef } from "react";
import { COLD_OPEN_SECONDS } from "./coldOpen";

const INPUTS = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
const MODIFIERS = new Set([
  "Alt",
  "AltGraph",
  "CapsLock",
  "Control",
  "Meta",
  "OS",
  "Shift",
]);

// A keyboard shortcut (a screenshot, a tab switch) is not the visitor asking
// to skip; anything else is.
function wantsIn(event: Event): boolean {
  if (!(event instanceof KeyboardEvent)) return true;
  return !(
    MODIFIERS.has(event.key) ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  );
}

// The show's clock and its exit. The clock is gsap's, so it pauses with the
// tab exactly as the power-on animation does and a page opened in the
// background still plays when it is first looked at. Any key, press, wheel or
// touch ends the show at once. The listeners are passive and run in the
// capture phase, so the cabinet still hears the same input (it fast-forwards
// its power-on) and nothing the browser does by default is prevented: a Tab
// that ends the show also moves focus, as it would on any page.
export function useColdOpen(active: boolean, onEnd: () => void): void {
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (!active) return;
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      onEndRef.current();
    };
    const onInput = (event: Event) => {
      if (wantsIn(event)) end();
    };
    const call = gsap.delayedCall(COLD_OPEN_SECONDS, end);
    const options = { capture: true, passive: true };
    for (const type of INPUTS) window.addEventListener(type, onInput, options);
    return () => {
      call.kill();
      for (const type of INPUTS)
        window.removeEventListener(type, onInput, options);
    };
  }, [active]);
}
