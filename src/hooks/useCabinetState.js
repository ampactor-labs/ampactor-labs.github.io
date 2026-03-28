import { useState, useEffect, useRef, useMemo } from "react";
import useAmbientHum from "../useAmbientHum";
import useIntroSequence from "../useIntroSequence";
import { PROJECTS, HIDDEN_PROJECTS } from "../data/projects";
import { BOOT_LINES } from "../constants";

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
  const coinTimerRefs = useRef([]);
  const screenTransitionRef = useRef(0);

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

  const fontScale = useMemo(
    () => Math.max(1, Math.min(1 + (dims.w - 300) / 700, 1.5)),
    [dims.w],
  );
  const fs = (size) => Math.round(size * fontScale);

  // Boot phase 0: test pattern (800ms), then phase 1: text sequence
  useEffect(() => {
    if (screen !== "boot" || !introComplete) return;
    if (bootPhase === 0) {
      const t = setTimeout(() => setBootPhase(1), 800);
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
    }, 180);
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
      if (
        screen === "detail" &&
        !allProjects[selectedIdx]?.interactive?.includes("synth")
      ) {
        if (e.key === "Escape" || e.key === "Backspace") {
          setScreen("select");
          setDetailProject(null);
        }
      }
      if (
        screen === "detail" &&
        allProjects[selectedIdx]?.interactive === "synth" &&
        e.key === "Escape"
      ) {
        setScreen("select");
        setDetailProject(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, selectedIdx, bootLine, bootPhase, allProjects]);

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
  };

  const goBack = () => {
    setScreen("select");
    setDetailProject(null);
    playBack();
  };

  const hoverSelect = (idx) => {
    setSelectedIdx(idx);
  };

  const exitGame = () => {
    setScreen("select");
    setDetailProject(null);
  };

  // Boot advancement: phase 0 → 1 → select
  const advanceBoot = () => {
    if (bootPhase === 0) setBootPhase(1);
    else if (bootLine >= BOOT_LINES.length - 1) {
      screenTransitionRef.current = Date.now();
      setScreen("select");
    }
  };

  // D-pad navigation
  const navUp = () => {
    if (screen === "select")
      setSelectedIdx((i) => (i - 1 + allProjects.length) % allProjects.length);
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
  };

  const isBootTransitioning = () =>
    Date.now() - screenTransitionRef.current < 500;

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
    playBlip,
    isBootTransitioning,
  };
}
