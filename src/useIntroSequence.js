import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

export default function useIntroSequence(
  logoRef,
  tunnelRef,
  consoleRef,
  skipOnMount = false,
) {
  const [introComplete, setIntroComplete] = useState(skipOnMount);
  const tlRef = useRef(null);

  useEffect(() => {
    const logo = logoRef.current;
    const console_ = consoleRef.current;
    const tunnel = tunnelRef.current;
    if (!logo || !console_) return;

    // Returning visitor: skip intro entirely, show cabinet immediately
    if (skipOnMount) {
      gsap.set(logo, { opacity: 0 });
      gsap.set(console_, { opacity: 1 });
      if (tunnel) tunnel.setRevealRadius(9999);
      return;
    }

    // Start with everything hidden
    gsap.set(logo, { opacity: 0 });
    gsap.set(console_, { opacity: 0 });

    let mounted = true;
    const tl = gsap.timeline({
      onComplete: () => {
        if (mounted) setIntroComplete(true);
      },
    });

    // 0.0–0.8s: Radial reveal — tunnel already running at default speed
    if (tunnel) {
      const rMax =
        Math.hypot(window.innerWidth / 2, window.innerHeight / 2) * 1.1;
      const proxy = { r: 0 };
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

    // 0.5–1.27s: CRT power-on — a scanline igniting, then blooming open in
    // one continuous tween. The old version stepped through four keyframe
    // segments (velocity jumps at every boundary read as stutter) and peaked
    // at brightness(6), which washed the whole console white. One expo.out
    // for the aperture and a parallel decay from a gentler peak keep the
    // tube-firing read without the flash or the seams.
    tl.set(
      console_,
      {
        opacity: 1,
        clipPath: "inset(49.5% 0 49.5% 0 round 16px)",
        filter: "brightness(2.4)",
      },
      0.5,
    );
    tl.to(
      console_,
      {
        clipPath: "inset(0% 0 0% 0 round 16px)",
        duration: 0.7,
        ease: "expo.out",
      },
      0.52,
    );
    tl.to(
      console_,
      {
        filter: "brightness(1)",
        duration: 0.75,
        ease: "power2.out",
        clearProps: "clipPath,filter",
      },
      0.52,
    );

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
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const skipIntro = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.progress(1);
    } else {
      setIntroComplete(true);
    }
  }, []);

  return { introComplete, skipIntro };
}
