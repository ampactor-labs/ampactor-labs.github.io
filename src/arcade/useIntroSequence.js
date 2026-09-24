import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The power-on. Two variants of the same timeline:
//
//   "console" — the whole machine materialises out of the dark: the tunnel
//               reveals, the A-mark flickers, and the console blooms open from
//               a single scanline. This is the cabinet hard-loaded at /arcade/,
//               where there was nothing on screen before it.
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
      if (logo) gsap.set(logo, { opacity: 0.03 });
      gsap.set(console_, { opacity: 1, clearProps: "clipPath,filter" });
      if (target && target !== console_) {
        gsap.set(target, { clearProps: "opacity,clipPath,filter" });
      }
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
    if (logo) gsap.set(logo, { opacity: 0 });
    if (target) gsap.set(target, { opacity: 0 });

    let mounted = true;
    const tl = gsap.timeline({
      onComplete: () => {
        if (mounted) setIntroComplete(true);
      },
    });

    // 0.0–0.8s: Radial reveal — tunnel already running at default speed. When
    // the zoom has already opened the tunnel behind the arriving cabinet, the
    // reveal is done and this step has nothing to add.
    const rMax = Math.hypot(window.innerWidth / 2, window.innerHeight / 2) * 1.1;
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

    // 0.0–0.55s: A-mark logo flickers into existence (CRT warm-up)
    if (logo) {
      tl.to(
        logo,
        {
          keyframes: [
            { opacity: 0, duration: 0 },
            { opacity: 0.4, duration: 0.07 },
            { opacity: 0.1, duration: 0.056 },
            { opacity: 0.6, duration: 0.084 },
            { opacity: 0.2, duration: 0.042 },
            { opacity: 0.8, duration: 0.105 },
            { opacity: 0.5, duration: 0.056 },
            { opacity: 0.9, duration: 0.14 },
          ],
          ease: "none",
        },
        0,
      );

      // 0.55–0.9s: Logo dims to ambient
      tl.to(
        logo,
        {
          opacity: 0.03,
          duration: 0.35,
          ease: "power2.in",
        },
        0.55,
      );
    }

    // 0.5–1.27s: CRT power-on — a scanline igniting, then blooming open in
    // one continuous tween. The old version stepped through four keyframe
    // segments (velocity jumps at every boundary read as stutter) and peaked
    // at brightness(6), which washed the whole console white. One expo.out
    // for the aperture and a parallel decay from a gentler peak keep the
    // tube-firing read without the flash or the seams.
    if (target) {
      const radius = variant === "screen" ? "0px" : "16px";
      tl.set(
        target,
        {
          opacity: 1,
          clipPath: `inset(49.5% 0 49.5% 0 round ${radius})`,
          filter: "brightness(2.4)",
        },
        0.5,
      );
      tl.to(
        target,
        {
          clipPath: `inset(0% 0 0% 0 round ${radius})`,
          duration: 0.7,
          ease: "expo.out",
        },
        0.52,
      );
      tl.to(
        target,
        {
          filter: "brightness(1)",
          duration: 0.75,
          ease: "power2.out",
          clearProps: "clipPath,filter",
        },
        0.52,
      );
    }

    // 1.2s: Restart flicker animation
    tl.call(
      () => {
        const screenEl = console_.querySelector(".crt-screen");
        if (screenEl) {
          screenEl.style.animation = "none";
          void screenEl.offsetWidth; // force reflow
          screenEl.style.animation = "flicker 14s infinite";
        }
      },
      [],
      1.2,
    );

    tlRef.current = tl;

    return () => {
      mounted = false;
      tl.kill();
      tlRef.current = null;
      // Leave nothing behind: the next activation starts from a clean slate,
      // and a cabinet that shrank back to the floor must not stay half-clipped.
      gsap.set(console_, { clearProps: "opacity,clipPath,filter" });
      if (target && target !== console_) {
        gsap.set(target, { clearProps: "opacity,clipPath,filter" });
      }
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
