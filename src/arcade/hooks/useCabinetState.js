import { useState, useEffect, useRef, useMemo } from "react";
import { flushSync } from "react-dom";
import useAmbientHum from "../useAmbientHum";
import useIntroSequence from "../useIntroSequence";
import { PROJECTS, HIDDEN_PROJECTS } from "../../data/projects";
import { SYSTEM_PROGRAMS, isSystemProgram } from "../../data/programs";
import { BOOT_LINES } from "../constants";
import { hasVisited as readVisited, markVisited } from "../visited";
import { KONAMI } from "../../data/quotes";

// The detail screen's link rail, in focus order. Demo comes first when a project
// has one, so A opens the running thing rather than the repo. DetailScreen renders
// from this same list, so the rail's order and the focus index cannot drift apart.
// An operator program declares its rail outright.
export function detailLinksOf(p) {
  if (!p) return [];
  if (p.links) return p.links;
  const links = [];
  // liveLabel overrides the pill text for demos that aren't pages —
  // 2-Top's slot serves an APK download, and the pill should say so.
  if (p.live) links.push({ kind: "live", href: p.live, label: p.liveLabel });
  if (p.github) links.push({ kind: "github", href: p.github });
  return links;
}

// One d-pad press of scroll on the detail body.
const SCROLL_STEP = 72;

// B on the select screen steps back to the title card. A B that just closed a
// detail screen must not also leave when the button is mashed.
const EXIT_SETTLE_MS = 400;

// The power-on's pacing once the tube is lit: the test card, the BIOS lines
// in a burst, a beat on READY., then the title card. About 1.4 s in all; the
// tube's own ignition (useIntroSequence) runs before it.
export const BOOT_PATTERN_MS = 350;
export const BOOT_LINE_MS = 40;
export const BOOT_BEAT_MS = 350;

const SELECT_ROUTE = Object.freeze({ view: "arcade", screen: "select" });

// Which screen a cartridge or program opens on.
const screenFor = (p) =>
  p.interactive === "tunnelgame" ? "game" : isSystemProgram(p) ? "system" : "detail";

// The cabinet's state machine. The machine is the whole page: the URL says
// which screen the address bar wants (`route`), and the cabinet asks for
// changes through `onNavigate` intents ("enter", "open", "back", "exit",
// "select") instead of touching history itself. The boot is the machine's
// own business and is not a route; the title card (attract mode) is home.
export default function useCabinetState({
  screenRef,
  tunnelRef,
  logoRef,
  consoleRef,
  tubeRef = null,
  route = SELECT_ROUTE,
  onNavigate = () => {},
}) {
  const atHome = route.view === "home";
  const deepLinked = route.view === "arcade" && route.screen === "project";

  // Whether the machine has booted for this visitor before. A first visit
  // powers on and prints the BIOS lines; after that it lands where the URL
  // points. A deep link to a cartridge never boots either.
  const hasVisited = useRef(readVisited());
  const [screen, setScreen] = useState(() => {
    if (hasVisited.current || deepLinked) return atHome ? "attract" : "select";
    return "boot";
  });
  // A screen change as a cut and a dash (crtStyles.js): the tube's old frame
  // cuts out and the new one dashes in through the view-transition API, where
  // the browser has it and motion is welcome; a plain state change otherwise.
  // `update` holds every state change of the move, so the old frame is
  // captured whole and the new one lands whole.
  const changeScreen = (update) => {
    const still =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof document.startViewTransition !== "function") {
      update();
      return;
    }
    document.startViewTransition(() => flushSync(update));
  };
  const [bootPhase, setBootPhase] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [detailProject, setDetailProject] = useState(null);
  const [bootLine, setBootLine] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [announcing, setAnnouncing] = useState(null);
  const [dims, setDims] = useState({ w: 360, h: 500 });
  const [gameHighlight, setGameHighlight] = useState(false);
  const [linkIdx, setLinkIdx] = useState(0);
  // The d-pad stepping the attract loop: a counter and a direction the
  // attract screen reacts to.
  const [attractNudge, setAttractNudge] = useState({ n: 0, dir: 1 });
  const coinTimerRefs = useRef([]);
  const screenTransitionRef = useRef(0);
  const lastBackRef = useRef(0);
  // The detail body (what up/down scrolls) and its anchors (what A clicks).
  const detailBodyRef = useRef(null);
  const linkRefs = useRef([]);
  const scrollAnchor = useRef({ top: 0, at: 0 });
  // activateLink runs from a window keydown closure that must not go stale
  // between re-subscribes, so it reads the focused index from a ref.
  const linkIdxRef = useRef(0);
  linkIdxRef.current = linkIdx;
  const screenRefState = useRef(screen);
  screenRefState.current = screen;

  // No AudioContext for a visitor who only looks at the title card.
  const { playBlip, playEnter, playBack, playInsertSting } = useAmbientHum({
    enabled: screen !== "attract",
  });
  const { introComplete, skipIntro } = useIntroSequence(
    logoRef,
    tunnelRef,
    consoleRef,
    {
      active: true,
      // Only a first visit powers the machine on out of the dark.
      skip: hasVisited.current || deepLinked,
      variant: "console",
      tubeRef,
    },
  );

  // Where the boot lands: the title card at home, the list anywhere else.
  const afterBoot = atHome ? "attract" : "select";

  // Once the machine has booted for this visitor, remember it.
  useEffect(() => {
    if (screen !== "boot" && !hasVisited.current) {
      markVisited();
      hasVisited.current = true;
    }
  }, [screen]);

  const allProjects = useMemo(() => {
    let result = [...PROJECTS, ...SYSTEM_PROGRAMS];
    if (coinCount >= 1) result = [...result, HIDDEN_PROJECTS[0]];
    if (coinCount >= 2) result = [...result, HIDDEN_PROJECTS[1]];
    if (coinCount >= 3) result = [...result, HIDDEN_PROJECTS[2]];
    return result;
  }, [coinCount]);

  const detailLinks = useMemo(() => detailLinksOf(detailProject), [detailProject]);

  // The route decides between the title card, select, detail, system and
  // game. A cartridge the machine does not have (a hidden program before the
  // coin drops, a typo in the hash) is corrected to the select screen. The
  // boot always finishes first.
  useEffect(() => {
    if (screen === "boot") return;
    if (route.view === "home") {
      if (screen !== "attract") {
        changeScreen(() => {
          setDetailProject(null);
          setScreen("attract");
        });
        if (screen !== "select") playBack();
      }
      return;
    }
    if (route.screen === "project") {
      const idx = allProjects.findIndex((p) => p.id === route.id);
      if (idx === -1) {
        // A link straight to a hidden program drops the coin for the
        // visitor instead of refusing them.
        if (coinCount === 0 && HIDDEN_PROJECTS.some((p) => p.id === route.id)) {
          setCoinCount(3);
          return;
        }
        onNavigate({ type: "select" });
        return;
      }
      const project = allProjects[idx];
      const target = screenFor(project);
      if (detailProject?.id === project.id && screen === target) return;
      changeScreen(() => {
        setSelectedIdx(idx);
        setDetailProject(project);
        setScreen(target);
      });
    } else if (screen !== "select") {
      const wasOpen = screen === "detail" || screen === "game" || screen === "system";
      changeScreen(() => {
        setDetailProject(null);
        setScreen("select");
      });
      if (wasOpen) playBack();
    }
    // playBack and onNavigate are stable enough; screen and detailProject are
    // read to keep the effect idempotent, not to trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, allProjects]);

  // A fresh project opens with the demo focused (or the source, when that is the
  // only link), and the anchors from the last project must not linger.
  useEffect(() => {
    setLinkIdx(0);
    linkRefs.current = [];
    scrollAnchor.current = { top: 0, at: 0 };
  }, [detailProject]);

  const fontScale = useMemo(
    () => Math.max(1, Math.min(1 + (dims.w - 300) / 700, 1.25)),
    [dims.w],
  );
  const fs = (size) => Math.round(size * fontScale);

  // Chrome resolves a smooth scrollBy against the live, mid-animation offset, so
  // mashing the d-pad swallows presses: two taps of ▼ scroll one step, not two.
  // Accumulate against our own target while the last animation is plausibly still
  // running, and otherwise trust the element, since the reader may have scrolled
  // it by hand or by wheel in the meantime.
  const scrollDetail = (dir) => {
    const el = detailBodyRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const settled = Date.now() - scrollAnchor.current.at > 500;
    const from = settled ? el.scrollTop : scrollAnchor.current.top;
    const top = Math.min(Math.max(from + dir * SCROLL_STEP, 0), max);
    scrollAnchor.current = { top, at: Date.now() };
    el.scrollTo({ top, behavior: "smooth" });
  };

  const moveLink = (delta) => {
    if (detailLinks.length === 0) return false;
    setLinkIdx((i) => Math.min(Math.max(i + delta, 0), detailLinks.length - 1));
    playBlip();
    return true;
  };

  const activateLink = () => {
    linkRefs.current[linkIdxRef.current]?.click();
  };

  // Boot phase 0: the test card, then phase 1: the BIOS lines.
  useEffect(() => {
    if (screen !== "boot" || !introComplete) return;
    if (bootPhase === 0) {
      const t = setTimeout(() => setBootPhase(1), BOOT_PATTERN_MS);
      return () => clearTimeout(t);
    }
  }, [screen, bootPhase, introComplete]);

  useEffect(() => {
    if (screen !== "boot" || bootPhase < 1) return;
    const interval = setInterval(() => {
      setBootLine((prev) => {
        if (prev >= BOOT_LINES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, BOOT_LINE_MS);
    return () => clearInterval(interval);
  }, [screen, bootPhase]);

  // The screen's layout size drives the type scale.
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth || el.getBoundingClientRect().width;
      const h = el.offsetHeight || el.getBoundingClientRect().height;
      setDims({ w: w - 40, h: h - 32 });
    };
    measure();
    if (typeof ResizeObserver !== "undefined" && el instanceof Element) {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [screenRef]);

  // Skip intro on any key or click
  useEffect(() => {
    if (introComplete) return;
    const skip = () => skipIntro();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [introComplete, skipIntro]);

  const finishBoot = () => {
    screenTransitionRef.current = Date.now();
    setScreen(afterBoot);
  };

  // Any key or tap during the boot skips ahead: off the test card and on to
  // the lines, or off the lines and on to where the URL points.
  const skipBoot = () => {
    if (bootPhase === 0) setBootPhase(1);
    else finishBoot();
  };

  useEffect(() => {
    if (!introComplete || screen !== "boot") return;
    const advance = () => skipBoot();
    window.addEventListener("keydown", advance);
    window.addEventListener("pointerdown", advance);
    return () => {
      window.removeEventListener("keydown", advance);
      window.removeEventListener("pointerdown", advance);
    };
    // skipBoot reads the phase and the route at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introComplete, screen, bootPhase, afterBoot]);

  // The last BIOS line printed, the machine moves on by itself after a beat.
  useEffect(() => {
    if (screen !== "boot" || bootPhase < 1 || bootLine < BOOT_LINES.length - 1)
      return;
    const t = setTimeout(finishBoot, BOOT_BEAT_MS);
    return () => clearTimeout(t);
    // finishBoot reads the route through afterBoot at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, bootPhase, bootLine, afterBoot]);

  const isBootTransitioning = () =>
    Date.now() - screenTransitionRef.current < 500;

  // START on the title card: the list, with the sting. No settle guard here:
  // START is a deliberate control, not the any-key that ends the boot, so the
  // next press on the list is meant.
  const start = () => {
    if (screenRefState.current !== "attract") return;
    playEnter();
    onNavigate({ type: "enter" });
  };

  const openProject = (idx) => {
    const project = allProjects[idx];
    if (!project) return;
    setSelectedIdx(idx);
    playEnter();
    onNavigate({ type: "open", id: project.id });
  };

  const isOpen = (s) => s === "detail" || s === "game" || s === "system";

  const goBack = () => {
    if (isOpen(screen)) {
      lastBackRef.current = Date.now();
      onNavigate({ type: "back" });
    } else if (screen === "select") {
      if (Date.now() - lastBackRef.current < EXIT_SETTLE_MS) return;
      onNavigate({ type: "exit" });
    }
  };

  const exitArcade = () => onNavigate({ type: "exit" });

  // The keyboard handler closes over this render's state and callbacks, so it
  // is kept in a ref and the window listener, subscribed once, always calls
  // the latest one.
  const keyHandlerRef = useRef(null);
  // The last few keys, for the Konami code.
  const konamiRef = useRef([]);
  keyHandlerRef.current = (e) => {
    if (!introComplete) return;
    // Up up down down left right left right B A drops the coin, from any
    // screen the panel is live on.
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiRef.current = [...konamiRef.current, key].slice(-KONAMI.length);
    if (KONAMI.every((k, i) => konamiRef.current[i] === k)) {
      konamiRef.current = [];
      insertCoin();
      return;
    }
    if (screen === "game" || screen === "boot") return;
    if (screen === "attract") {
      // A link on the title card keeps its own Enter.
      if (e.target instanceof HTMLElement && e.target.closest("a")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        start();
      } else if (e.key === "ArrowRight") {
        setAttractNudge((v) => ({ n: v.n + 1, dir: 1 }));
      } else if (e.key === "ArrowLeft") {
        setAttractNudge((v) => ({ n: v.n + 1, dir: -1 }));
      }
      return;
    }
    if (screen === "select") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx(
          (i) => (i - 1 + allProjects.length) % allProjects.length,
        );
        playBlip();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % allProjects.length);
        playBlip();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!isBootTransitioning()) openProject(selectedIdx);
      } else if (e.key === "Escape") {
        exitArcade();
      }
    }
    if (screen === "detail" || screen === "system") {
      // Arrows drive the same two things the d-pad does: up/down scroll the
      // body, left/right walk the link rail. None of these are synth note
      // keys, so they are safe even while the synth is being played.
      if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollDetail(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollDetail(1);
      } else if (e.key === "ArrowLeft") {
        moveLink(-1);
      } else if (e.key === "ArrowRight") {
        moveLink(1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        activateLink();
      }
    }
    const isSynth = detailProject?.interactive === "synth";
    // Synth is keyboard-playable; "b" is not one of its note keys, so it is
    // safe as a back shortcut there. Backspace is excluded while playing to
    // avoid surprises.
    if (
      (screen === "detail" || screen === "system") &&
      (e.key === "Escape" ||
        e.key === "b" ||
        e.key === "B" ||
        (e.key === "Backspace" && !isSynth))
    ) {
      goBack();
    }
  };

  useEffect(() => {
    const handler = (e) => keyHandlerRef.current?.(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Fade console in/out for game mode
  useEffect(() => {
    const el = consoleRef.current;
    if (!el || !introComplete) return;
    if (screen === "game") {
      el.style.transition = "opacity 0.6s ease";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    } else {
      el.style.transition = "opacity 0.6s ease";
      el.style.opacity = "1";
      el.style.pointerEvents = "";
    }
  }, [screen, introComplete, consoleRef]);

  // Cleanup coin timers on unmount
  useEffect(() => {
    const timers = coinTimerRefs.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // The coin: credit accepted, three programs unlocked, the last one lit.
  // Dropped on the title card it also starts the machine, as a coin would.
  const insertCoin = () => {
    if (!introComplete || screen === "boot" || coinCount >= 1) return;
    setCoinCount(3);
    setAnnouncing(3);
    const t2 = setTimeout(() => setAnnouncing(null), 2800);
    playInsertSting(3);
    const t3 = setTimeout(() => {
      const gameIdx =
        PROJECTS.length + SYSTEM_PROGRAMS.length + HIDDEN_PROJECTS.length - 1;
      setSelectedIdx(gameIdx);
      setGameHighlight(true);
      const t4 = setTimeout(() => setGameHighlight(false), 2000);
      coinTimerRefs.current.push(t4);
    }, 3000);
    coinTimerRefs.current.push(t2, t3);
    if (screen === "attract") onNavigate({ type: "enter" });
  };

  const hoverSelect = (idx) => {
    setSelectedIdx(idx);
  };

  const exitGame = () => {
    if (screen === "game" || screen === "detail") {
      lastBackRef.current = Date.now();
      onNavigate({ type: "back" });
    }
  };

  // The panel's A during the boot: the same skip.
  const advanceBoot = skipBoot;

  // D-pad navigation. On select it walks the project list; on detail the same
  // four buttons scroll the body and walk the link rail, because a d-pad that
  // does nothing on the screen you just opened reads as broken. On the title
  // card left and right step the attract loop.
  const navUp = () => {
    if (screen === "select")
      setSelectedIdx((i) => (i - 1 + allProjects.length) % allProjects.length);
    else if (screen === "detail" || screen === "system") scrollDetail(-1);
    else if (screen === "boot") skipBoot();
  };

  const navDown = () => {
    if (screen === "select")
      setSelectedIdx((i) => (i + 1) % allProjects.length);
    else if (screen === "detail" || screen === "system") scrollDetail(1);
  };

  // Left falls through to Back when there is no rail to walk, so the hidden
  // projects (no demo, no source) keep their escape hatch.
  const navLeft = () => {
    if (screen === "attract") {
      setAttractNudge((v) => ({ n: v.n + 1, dir: -1 }));
      return;
    }
    if ((screen === "detail" || screen === "system") && moveLink(-1)) return;
    goBack();
  };

  const navRight = () => {
    if (screen === "attract") {
      setAttractNudge((v) => ({ n: v.n + 1, dir: 1 }));
    } else if (screen === "detail" || screen === "system") {
      moveLink(1);
    } else if (screen === "select" && !isBootTransitioning()) {
      openProject(selectedIdx);
    }
  };

  // A: start the machine, advance the boot, open the selected program, or
  // open the focused link.
  const pressA = () => {
    if (screen === "attract") start();
    else if (screen === "boot") advanceBoot();
    else if (screen === "select") {
      if (!isBootTransitioning()) openProject(selectedIdx);
    } else if (screen === "detail" || screen === "system") activateLink();
  };

  return {
    screen,
    bootPhase,
    bootLine,
    selectedIdx,
    detailProject,
    coinCount,
    announcing,
    dims,
    gameHighlight,
    allProjects,
    attractNudge,
    fs,
    introComplete,
    skipIntro,
    insertCoin,
    start,
    openProject,
    goBack,
    exitGame,
    exitArcade,
    hoverSelect,
    advanceBoot,
    navUp,
    navDown,
    navLeft,
    navRight,
    pressA,
    detailLinks,
    linkIdx,
    linkRefs,
    detailBodyRef,
    playBlip,
    isBootTransitioning,
  };
}
