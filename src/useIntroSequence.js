import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

export default function useIntroSequence(logoRef, tunnelRef, consoleRef) {
  const [introComplete, setIntroComplete] = useState(false);
  const tlRef = useRef(null);

  useEffect(() => {
    const logo = logoRef.current;
    const console_ = consoleRef.current;
    const tunnel = tunnelRef.current;
    if (!logo || !console_) return;

    // Start with everything hidden
    gsap.set(logo, { opacity: 0 });
    gsap.set(console_, { opacity: 0, y: 20 });

    // Start tunnel at zero speed
    if (tunnel) tunnel.setSpeed(0);

    const tl = gsap.timeline({
      onComplete: () => setIntroComplete(true),
    });

    // 0.0–0.8s: A-mark logo flickers into existence (CRT warm-up)
    tl.to(logo, {
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
    }, 0);

    // 0.5–1.5s: Tunnel ramps up
    tl.to({}, {
      duration: 1,
      onUpdate: function () {
        if (tunnel) tunnel.setSpeed(this.progress() * 0.00008);
      },
    }, 0.5);

    // 1.0–1.5s: Logo dims to ambient
    tl.to(logo, {
      opacity: 0.03,
      duration: 0.5,
      ease: "power2.in",
    }, 1.0);

    // 1.5–2.5s: Console scales in and fades up
    tl.to(console_, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
    }, 1.5);

    // 2.5s: Enable CRT animation by adding the class
    tl.call(() => {
      const screenEl = console_.querySelector(".crt-screen");
      if (screenEl) {
        screenEl.style.animation = "none";
        // Force reflow
        void screenEl.offsetWidth;
        screenEl.style.animation = "";
      }
    }, [], 2.5);

    tlRef.current = tl;

    return () => { tl.kill(); };
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
