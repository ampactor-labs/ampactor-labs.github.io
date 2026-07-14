import { useState, useEffect, useRef, useMemo } from "react";
import useAmbientHum from "../useAmbientHum";
import useIntroSequence from "../useIntroSequence";
import { PROJECTS, HIDDEN_PROJECTS } from "../data/projects";
import { BOOT_LINES } from "../constants";

// The detail screen's link rail, in focus order. Demo comes first when a project
// has one, so A opens the running thing rather than the repo. DetailScreen renders
// from this same list, so the rail's order and the focus index cannot drift apart.
export function detailLinksOf(p) {
  if (!p) return [];
  const links = [];
  if (p.live) links.push({ kind: "live", href: p.live });
  if (p.github) links.push({ kind: "github", href: p.github });
  return links;
}

// One d-pad press of scroll on the detail body.
const SCROLL_STEP = 72;

export default function useCabinetState(
  screenRef,
  tunnelRef,
  logoRef,
  consoleRef,
) {
  const hasVisited = useRef(
    typeof localStorage !== "undefined" &&
      !!localStorage.getItem("ampactor_visited"),
  );
  const [screen, setScreen] = useState(() =>
    hasVisited.current ? "select" : "boot",
  );
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
  // The detail body (what up/down scrolls) and its anchors (what A clicks).
  const detailBodyRef = useRef(null);
  const linkRefs = useRef([]);
  const scrollAnchor = useRef({ top: 0, at: 0 });
  // activateLink runs from a window keydown closure that must not go stale
  // between re-subscribes, so it reads the focused index from a ref.
  const linkIdxRef = useRef(0);
  linkIdxRef.current = linkIdx;

  const { playBlip, playEnter, playBack, playInsertSting } = useAmbientHum();
  const { introComplete, skipIntro } = useIntroSequence(
    logoRef,
    tunnelRef,
    consoleRef,
    hasVisited.current,
  );

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

  // Boot phase 0: test pattern (800ms), then phase 1: text sequence
  useEffect(() => {
    if (screen !== "boot" || !introComplete) return;
    if (bootPhase === 0) {
      const t = setTimeout(() => setBootPhase(1), 450);
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
    }, 130);
    return () => clearInterval(interval);
  }, [screen, bootPhase]);

  useEffect(() => {
    const measure = () => {
      if (screenRef.current) {
        const r = screenRef.current.getBoundingClientRect();
        setDims({ w: r.width - 40, h: r.height - 32 });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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

  // Boot screen: any key OR click/tap advances
  useEffect(() => {
    if (!introComplete || screen !== "boot") return;
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
  }, [introComplete, screen, bootPhase, bootLine]);

  useEffect(() => {
    const handler = (e) => {
      if (!introComplete) return;
      if (screen === "game") return;
      if (screen === "select") {
        if (e.key === "ArrowUp") {
          setSelectedIdx(
            (i) => (i - 1 + allProjects.length) % allProjects.length,
          );
          playBlip();
        } else if (e.key === "ArrowDown") {
          setSelectedIdx((i) => (i + 1) % allProjects.length);
          playBlip();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDetailProject(allProjects[selectedIdx]);
          setScreen("detail");
          playBlip();
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
      if (
        screen === "detail" &&
        !allProjects[selectedIdx]?.interactive?.includes("synth")
      ) {
        if (
          e.key === "Escape" ||
          e.key === "Backspace" ||
          e.key === "b" ||
          e.key === "B"
        ) {
          window.history.back();
        }
      }
      // Synth is keyboard-playable; "b" is not one of its note keys, so it is
      // safe as a back shortcut here. Backspace is excluded to avoid surprises
      // while playing.
      if (
        screen === "detail" &&
        allProjects[selectedIdx]?.interactive === "synth" &&
        (e.key === "Escape" || e.key === "b" || e.key === "B")
      ) {
        window.history.back();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, selectedIdx, bootLine, bootPhase, allProjects, detailLinks]);

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
  }, [screen, introComplete]);

  // Handle popstate for Android back button
  useEffect(() => {
    const handlePopState = () => {
      setScreen((prev) => {
        if (prev === "detail" || prev === "game") {
          setDetailProject(null);
          playBack();
          return "select";
        }
        return prev;
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [playBack]);

  // Cleanup coin timers on unmount
  useEffect(() => {
    const timers = coinTimerRefs.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const insertCoin = () => {
    if (!introComplete || screen === "boot" || coinCount >= 1) return;
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

  const openProject = (idx) => {
    setSelectedIdx(idx);
    const project = allProjects[idx];
    setDetailProject(project);
    if (project?.interactive === "tunnelgame") {
      setScreen("game");
    } else {
      setScreen("detail");
    }
    playEnter();
    window.history.pushState({ screen: 'project' }, '');
  };

  const goBack = () => {
    if (screen === "detail" || screen === "game") {
      window.history.back();
    } else {
      setScreen("select");
      setDetailProject(null);
      playBack();
    }
  };

  const hoverSelect = (idx) => {
    setSelectedIdx(idx);
  };

  const exitGame = () => {
    if (screen === "game" || screen === "detail") {
      window.history.back();
    } else {
      setScreen("select");
      setDetailProject(null);
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

  const isBootTransitioning = () =>
    Date.now() - screenTransitionRef.current < 500;

  // D-pad navigation. On select it walks the project list; on detail the same
  // four buttons scroll the body and walk the link rail, because a d-pad that
  // does nothing on the screen you just opened reads as broken.
  const navUp = () => {
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
    if (screen === "select")
      setSelectedIdx((i) => (i + 1) % allProjects.length);
    else if (screen === "detail") scrollDetail(1);
  };

  // Left falls through to Back when there is no rail to walk, so the hidden
  // projects (no demo, no source) keep their escape hatch.
  const navLeft = () => {
    if (screen === "detail" && moveLink(-1)) return;
    goBack();
  };

  const navRight = () => {
    if (screen === "detail") {
      moveLink(1);
    } else if (screen === "select" && !isBootTransitioning()) {
      openProject(selectedIdx);
    }
  };

  // A: advance the boot, open the selected project, or open the focused link.
  const pressA = () => {
    if (screen === "boot") advanceBoot();
    else if (screen === "select") {
      if (!isBootTransitioning()) openProject(selectedIdx);
    } else if (screen === "detail") activateLink();
  };

  return {
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
