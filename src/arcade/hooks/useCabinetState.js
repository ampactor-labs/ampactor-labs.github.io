import { useState, useEffect, useRef, useMemo } from "react";
import useAmbientHum from "../useAmbientHum";
import useIntroSequence from "../useIntroSequence";
import { PROJECTS, HIDDEN_PROJECTS } from "../../data/projects";
import { BOOT_LINES } from "../constants";

// The detail screen's link rail, in focus order. Demo comes first when a project
// has one, so A opens the running thing rather than the repo. DetailScreen renders
// from this same list, so the rail's order and the focus index cannot drift apart.
export function detailLinksOf(p) {
  if (!p) return [];
  const links = [];
  // liveLabel overrides the pill text for demos that aren't pages —
  // 2-Top's slot serves an APK download, and the pill should say so.
  if (p.live) links.push({ kind: "live", href: p.live, label: p.liveLabel });
  if (p.github) links.push({ kind: "github", href: p.github });
  return links;
}

// One d-pad press of scroll on the detail body.
const SCROLL_STEP = 72;

// B on the select screen leaves the arcade. A B that just closed a detail
// screen must not also leave it when the button is mashed.
const EXIT_SETTLE_MS = 400;

const SELECT_ROUTE = Object.freeze({ view: "arcade", screen: "select" });

// The cabinet's state machine. Two things it does not own any more:
//
//   * where it stands — `mode` is "attract" while it is a miniature on the
//     floor (no listeners, no audio, the attract loop on the tube) and "live"
//     once it has zoomed in;
//   * the URL — `route` says which screen the address bar wants, and the
//     cabinet asks for changes through `onNavigate` intents ("open", "back",
//     "exit", "select") instead of touching history itself. Boot and attract
//     are the machine's own business and are not routes.
//
// `animating` is true while the cabinet is mid-zoom; every input is ignored
// until it lands.
export default function useCabinetState({
  screenRef,
  tunnelRef,
  logoRef,
  consoleRef,
  tubeRef = null,
  mode = "live",
  route = SELECT_ROUTE,
  onNavigate = () => {},
  animating = false,
  introVariant = "console",
}) {
  const live = mode === "live";
  const deepLinked = route.view === "arcade" && route.screen === "project";

  const hasVisited = useRef(
    typeof localStorage !== "undefined" &&
      !!localStorage.getItem("ampactor_visited"),
  );
  const [screen, setScreen] = useState(() => {
    if (!live) return "attract";
    return hasVisited.current || deepLinked ? "select" : "boot";
  });
  const [bootPhase, setBootPhase] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [detailProject, setDetailProject] = useState(null);
  const [bootLine, setBootLine] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [announcing, setAnnouncing] = useState(null);
  const [glitching, setGlitching] = useState(false);
  const [dims, setDims] = useState({ w: 360, h: 500 });
  const [gameHighlight, setGameHighlight] = useState(false);
  const [linkIdx, setLinkIdx] = useState(0);
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

  const { playBlip, playEnter, playBack, playInsertSting } = useAmbientHum({
    enabled: live,
  });
  const { introComplete, skipIntro } = useIntroSequence(
    logoRef,
    tunnelRef,
    consoleRef,
    {
      active: live,
      // A deep link to a cartridge skips the boot, like a returning visitor.
      skip: hasVisited.current || deepLinked,
      variant: introVariant,
      tubeRef,
    },
  );

  // Walking up to the machine or stepping away resets what the tube shows.
  const prevModeRef = useRef(mode);
  useEffect(() => {
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;
    if (live) {
      setScreen(hasVisited.current || deepLinked ? "select" : "boot");
    } else {
      setScreen("attract");
      setDetailProject(null);
      setBootPhase(0);
      setBootLine(0);
    }
  }, [mode, live, deepLinked]);

  // Write visited key on first boot → select transition
  useEffect(() => {
    if (screen === "select" && !hasVisited.current) {
      localStorage.setItem("ampactor_visited", "1");
      hasVisited.current = true;
    }
  }, [screen]);

  const allProjects = useMemo(() => {
    let result = [...PROJECTS];
    if (coinCount >= 1) result = [...result, HIDDEN_PROJECTS[0]];
    if (coinCount >= 2) result = [...result, HIDDEN_PROJECTS[1]];
    if (coinCount >= 3) result = [...result, HIDDEN_PROJECTS[2]];
    return result;
  }, [coinCount]);

  const detailLinks = useMemo(() => detailLinksOf(detailProject), [detailProject]);

  // The route decides between select, detail and game. A cartridge the
  // machine does not have (a hidden program before the coin drops, a typo in
  // the hash) is corrected to the select screen.
  useEffect(() => {
    if (!live || route.view !== "arcade") return;
    if (route.screen === "project") {
      const idx = allProjects.findIndex((p) => p.id === route.id);
      if (idx === -1) {
        onNavigate({ type: "select" });
        return;
      }
      const project = allProjects[idx];
      const target = project.interactive === "tunnelgame" ? "game" : "detail";
      if (detailProject?.id === project.id && screen === target) return;
      setSelectedIdx(idx);
      setDetailProject(project);
      setScreen(target);
    } else if (screen === "detail" || screen === "game") {
      setDetailProject(null);
      setScreen("select");
      playBack();
    }
    // playBack and onNavigate are stable enough; screen and detailProject are
    // read to keep the effect idempotent, not to trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, route, allProjects]);

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

  // Boot phase 0: test pattern (450ms), then phase 1: text sequence
  useEffect(() => {
    if (!live || screen !== "boot" || !introComplete) return;
    if (bootPhase === 0) {
      const t = setTimeout(() => setBootPhase(1), 450);
      return () => clearTimeout(t);
    }
  }, [live, screen, bootPhase, introComplete]);

  useEffect(() => {
    if (!live || screen !== "boot" || bootPhase < 1) return;
    const interval = setInterval(() => {
      setBootLine((prev) => {
        if (prev >= BOOT_LINES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 130);
    return () => clearInterval(interval);
  }, [live, screen, bootPhase]);

  // The screen's layout size drives the type scale. Layout size, not the
  // bounding rect: on the floor the whole console is scaled down with a CSS
  // transform, and the type must be laid out the same at both depths.
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
    if (!live || animating || introComplete) return;
    const skip = () => skipIntro();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [live, animating, introComplete, skipIntro]);

  // Boot screen: any key OR click/tap advances
  useEffect(() => {
    if (!live || animating || !introComplete || screen !== "boot") return;
    const advance = () => {
      if (bootPhase === 0) {
        setBootPhase(1);
      } else if (bootLine >= BOOT_LINES.length - 1) {
        screenTransitionRef.current = Date.now();
        setScreen("select");
      }
    };
    window.addEventListener("keydown", advance);
    window.addEventListener("pointerdown", advance);
    return () => {
      window.removeEventListener("keydown", advance);
      window.removeEventListener("pointerdown", advance);
    };
  }, [live, animating, introComplete, screen, bootPhase, bootLine]);

  const isBootTransitioning = () =>
    Date.now() - screenTransitionRef.current < 500;

  const openProject = (idx) => {
    const project = allProjects[idx];
    if (!project) return;
    setSelectedIdx(idx);
    playEnter();
    onNavigate({ type: "open", id: project.id });
  };

  const goBack = () => {
    if (screen === "detail" || screen === "game") {
      lastBackRef.current = Date.now();
      onNavigate({ type: "back" });
    } else if (screen === "select") {
      if (Date.now() - lastBackRef.current < EXIT_SETTLE_MS) return;
      onNavigate({ type: "exit" });
    }
  };

  const exitArcade = () => onNavigate({ type: "exit" });

  // The keyboard handler closes over this render's state and callbacks, so it
  // is kept in a ref and the window listener, subscribed once per live/animating
  // change, always calls the latest one.
  const keyHandlerRef = useRef(null);
  keyHandlerRef.current = (e) => {
      if (!introComplete) return;
      if (screen === "game") return;
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
      if (screen === "detail") {
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
        screen === "detail" &&
        (e.key === "Escape" ||
          e.key === "b" ||
          e.key === "B" ||
          (e.key === "Backspace" && !isSynth))
      ) {
        goBack();
      }
  };

  useEffect(() => {
    if (!live || animating) return;
    const handler = (e) => keyHandlerRef.current?.(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [live, animating]);

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

  const insertCoin = () => {
    if (!live || !introComplete || screen === "boot" || coinCount >= 1) return;
    setCoinCount(3);
    setGlitching(true);
    setAnnouncing(3);
    const t1 = setTimeout(() => setGlitching(false), 600);
    const t2 = setTimeout(() => setAnnouncing(null), 2800);
    playInsertSting(3);
    const t3 = setTimeout(() => {
      const gameIdx = PROJECTS.length + HIDDEN_PROJECTS.length - 1;
      setSelectedIdx(gameIdx);
      setGameHighlight(true);
      const t4 = setTimeout(() => setGameHighlight(false), 2000);
      coinTimerRefs.current.push(t4);
    }, 3000);
    coinTimerRefs.current.push(t1, t2, t3);
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

  // Boot advancement: phase 0 → 1 → select
  const advanceBoot = () => {
    if (bootPhase === 0) setBootPhase(1);
    else if (bootLine >= BOOT_LINES.length - 1) {
      screenTransitionRef.current = Date.now();
      setScreen("select");
    }
  };

  // D-pad navigation. On select it walks the project list; on detail the same
  // four buttons scroll the body and walk the link rail, because a d-pad that
  // does nothing on the screen you just opened reads as broken.
  const navUp = () => {
    if (animating) return;
    if (screen === "select")
      setSelectedIdx((i) => (i - 1 + allProjects.length) % allProjects.length);
    else if (screen === "detail") scrollDetail(-1);
    else if (
      screen === "boot" &&
      bootPhase > 0 &&
      bootLine >= BOOT_LINES.length - 1
    )
      setScreen("select");
  };

  const navDown = () => {
    if (animating) return;
    if (screen === "select")
      setSelectedIdx((i) => (i + 1) % allProjects.length);
    else if (screen === "detail") scrollDetail(1);
  };

  // Left falls through to Back when there is no rail to walk, so the hidden
  // projects (no demo, no source) keep their escape hatch.
  const navLeft = () => {
    if (animating) return;
    if (screen === "detail" && moveLink(-1)) return;
    goBack();
  };

  const navRight = () => {
    if (animating) return;
    if (screen === "detail") {
      moveLink(1);
    } else if (screen === "select" && !isBootTransitioning()) {
      openProject(selectedIdx);
    }
  };

  // A: advance the boot, open the selected project, or open the focused link.
  const pressA = () => {
    if (animating) return;
    if (screen === "boot") advanceBoot();
    else if (screen === "select") {
      if (!isBootTransitioning()) openProject(selectedIdx);
    } else if (screen === "detail") activateLink();
  };

  return {
    mode,
    screen,
    bootPhase,
    bootLine,
    selectedIdx,
    detailProject,
    coinCount,
    announcing,
    glitching,
    dims,
    gameHighlight,
    allProjects,
    fs,
    introComplete,
    skipIntro,
    insertCoin,
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
