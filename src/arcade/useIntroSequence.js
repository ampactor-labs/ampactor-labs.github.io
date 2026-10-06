import { useRef, useState, useEffect, useCallback } from "react";
// GSAP's core: it tweens plain numbers, and the styles are written here by
// hand, so its CSS plugin (a third of its weight) stays off the first screen.
import gsap from "gsap/gsap-core";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Inline styles, written and cleared by hand.
const style = (el, props) => {
  if (!el) return;
  for (const [name, value] of Object.entries(props))
    el.style.setProperty(name, value);
};
const clear = (el, ...names) => {
  if (!el) return;
  for (const name of names) el.style.removeProperty(name);
};

// The power-on. Two variants of the same timeline:
//
//   "console" — the whole machine materialises out of the dark: the tunnel
//               reveals, the A-mark snaps on, and the console lights up band
//               by band. This is the cabinet hard-loaded at /arcade/, where
//               there was nothing on screen before it.
//   "screen"  — the cabinet is already standing there (the visitor walked up
//               to it on the floor and it zoomed in), so only the tube fires:
//               same tunnel and A-mark, but the clip-path/brightness ignition
//               runs on the screen's content layer and the chassis stays put.
//
// The sequence starts when `active` turns true, not on mount, and is torn
// down (styles cleared) when it turns false again. `skip` (a returning
// visitor) and reduced motion both jump straight to the finished state.
export default function useIntroSequence(
  logoRef,
  tunnelRef,
  consoleRef,
  { active = true, skip = false, variant = "console", tubeRef = null } = {},
) {
  const [introComplete, setIntroComplete] = useState(false);
  const tlRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setIntroComplete(false);
      return;
    }
    const logo = logoRef.current;
    const console_ = consoleRef.current;
    const tunnel = tunnelRef.current;
    if (!console_) return;
    const target = variant === "screen" ? tubeRef?.current : console_;

    const finish = () => {
      style(logo, { opacity: "0.1" });
      style(console_, { opacity: "1" });
      clear(console_, "clip-path", "filter");
      if (target && target !== console_)
        clear(target, "opacity", "clip-path", "filter");
      if (tunnel) tunnel.setRevealRadius(9999);
      setIntroComplete(true);
    };

    if (skip || prefersReducedMotion()) {
      finish();
      return () => {
        setIntroComplete(false);
      };
    }

    // Start with everything hidden
    style(logo, { opacity: "0" });
    style(target, { opacity: "0" });

    let mounted = true;
    const tl = gsap.timeline({
      onComplete: () => {
        if (mounted) setIntroComplete(true);
      },
    });

    // 0.0–0.8s: Radial reveal — tunnel already running at default speed. When
    // the zoom has already opened the tunnel behind the arriving cabinet, the
    // reveal is done and this step has nothing to add.
    const rMax =
      Math.hypot(window.innerWidth / 2, window.innerHeight / 2) * 1.1;
    const revealed = tunnel?.getRevealRadius?.() ?? 0;
    if (tunnel && revealed < rMax) {
      const proxy = { r: revealed };
      tl.to(
        proxy,
        {
          r: rMax,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => tunnel.setRevealRadius(proxy.r),
        },
        0,
      );
    }

    // 0.05–0.27s: the A-mark snaps on, one rise; 0.55–0.9s it dims to ambient.
    if (logo) {
      const glow = { opacity: 0 };
      const paint = () => style(logo, { opacity: String(glow.opacity) });
      tl.to(
        glow,
        { opacity: 0.9, duration: 0.22, ease: "power3.out", onUpdate: paint },
        0.05,
      );
      tl.to(
        glow,
        { opacity: 0.1, duration: 0.35, ease: "power2.in", onUpdate: paint },
        0.55,
      );
    }

    // 0.5–1.27s: the tube ignites as a stepped wipe, twelve lit bands left to
    // right (the reference's grid lighting up), with a brightness peak that
    // decays as the bands land. The same window the scanline aperture had,
    // so the boot's constants and the browser suite's timings hold.
    if (target) {
      const radius = variant === "screen" ? "0px" : "16px";
      const wipe = { bands: 0 };
      const light = { brightness: 2.4 };
      const clip = (n) =>
        `inset(0 ${100 - (n / 12) * 100}% 0 0 round ${radius})`;
      tl.call(
        () =>
          style(target, {
            opacity: "1",
            "clip-path": clip(0),
            filter: `brightness(${light.brightness})`,
          }),
        null,
        0.5,
      );
      tl.to(
        wipe,
        {
          bands: 12,
          duration: 0.7,
          ease: "steps(12)",
          onUpdate: () => style(target, { "clip-path": clip(wipe.bands) }),
        },
        0.52,
      );
      tl.to(
        light,
        {
          brightness: 1,
          duration: 0.75,
          ease: "power2.out",
          onUpdate: () =>
            style(target, { filter: `brightness(${light.brightness})` }),
          onComplete: () => clear(target, "clip-path", "filter"),
        },
        0.52,
      );
    }

    tlRef.current = tl;

    return () => {
      mounted = false;
      tl.kill();
      tlRef.current = null;
      // Leave nothing behind: the next activation starts from a clean slate,
      // and a cabinet that shrank back to the floor must not stay half-clipped.
      clear(console_, "opacity", "clip-path", "filter");
      if (target && target !== console_)
        clear(target, "opacity", "clip-path", "filter");
      setIntroComplete(false);
    };
    // `skip` and `variant` are read when the sequence starts; changing them
    // mid-sequence must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const skipIntro = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.progress(1);
    } else {
      setIntroComplete(true);
    }
  }, []);

  return { introComplete, skipIntro };
}
