import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

export default function useIntroSequence(logoRef, tunnelRef, consoleRef, skipOnMount = false) {
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

    // 0.0–1.5s: Radial reveal — tunnel already running at default speed
    if (tunnel) {
      const rMax =
        Math.hypot(window.innerWidth / 2, window.innerHeight / 2) * 1.1;
      const proxy = { r: 0 };
      tl.to(
        proxy,
        {
          r: rMax,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => tunnel.setRevealRadius(proxy.r),
        },
        0,
      );
    }

    // 0.0–0.8s: A-mark logo flickers into existence (CRT warm-up)
    tl.to(
      logo,
      {
        keyframes: [
          { opacity: 0, duration: 0 },
          { opacity: 0.4, duration: 0.1 },
          { opacity: 0.1, duration: 0.08 },
          { opacity: 0.6, duration: 0.12 },
          { opacity: 0.2, duration: 0.06 },
          { opacity: 0.8, duration: 0.15 },
          { opacity: 0.5, duration: 0.08 },
          { opacity: 0.9, duration: 0.2 },
        ],
        ease: "none",
      },
      0,
    );

    // 0.8–1.3s: Logo dims to ambient
    tl.to(
      logo,
      {
        opacity: 0.03,
        duration: 0.5,
        ease: "power2.in",
      },
      0.8,
    );

    // 1.5–2.5s: CRT scan-on reveal (trimmed from 2.0–3.5s)
    tl.set(
      console_,
      { opacity: 1, clipPath: "inset(49% 0 49% 0 round 16px)" },
      1.5,
    );
    tl.to(
      console_,
      {
        clipPath: "inset(0% 0 0% 0 round 16px)",
        duration: 1.0,
        ease: "power2.out",
        clearProps: "clipPath",
      },
      1.5,
    );

    // 2.6s: Restart flicker animation
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
      2.6,
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
