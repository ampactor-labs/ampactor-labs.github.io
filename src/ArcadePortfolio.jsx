import { useState, useEffect, useRef, useMemo } from "react";
import TunnelGame from "./TunnelGame";
import CrtSvgDefs from "./CrtEffects";
import TunnelCanvas from "./TunnelCanvas";
import useAmbientHum from "./useAmbientHum";
import useIntroSequence from "./useIntroSequence";
import { PROJECTS, HIDDEN_PROJECTS } from "./data/projects";
import { crtStyles } from "./styles/crtStyles";
import { BOOT_LINES } from "./constants";
import BootScreen from "./components/screens/BootScreen";
import SelectScreen from "./components/screens/SelectScreen";
import DetailScreen from "./components/screens/DetailScreen";

export default function ArcadePortfolio() {
  const [screen, setScreen] = useState("boot");
  const [bootPhase, setBootPhase] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [detailProject, setDetailProject] = useState(null);
  const [bootLine, setBootLine] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [announcing, setAnnouncing] = useState(null);
  const [glitching, setGlitching] = useState(false);
  const [dims, setDims] = useState({ w: 360, h: 500 });
  const screenRef = useRef(null);
  const tunnelRef = useRef(null);
  const logoRef = useRef(null);
  const consoleRef = useRef(null);
  const { playBlip, playInsertSting } = useAmbientHum();
  const { introComplete, skipIntro } = useIntroSequence(
    logoRef,
    tunnelRef,
    consoleRef,
  );

  const allProjects = useMemo(() => {
    let result = [...PROJECTS];
    if (coinCount >= 1) result = [...result, HIDDEN_PROJECTS[0]];
    if (coinCount >= 2) result = [...result, HIDDEN_PROJECTS[1]];
    if (coinCount >= 3) result = [...result, HIDDEN_PROJECTS[2]];
    return result;
  }, [coinCount]);

  const fontScale = useMemo(
    () => Math.max(1, Math.min(1 + (dims.w - 300) / 700, 1.75)),
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
    }, 280);
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
        // Swallow the next click so it doesn't bleed into the select screen
        const eatClick = (e) => {
          e.stopPropagation();
          e.preventDefault();
        };
        window.addEventListener("click", eatClick, {
          capture: true,
          once: true,
        });
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

  const [gameHighlight, setGameHighlight] = useState(false);

  const insertCoin = () => {
    if (!introComplete || screen === "boot" || coinCount >= 1) return;
    setCoinCount(3);
    setGlitching(true);
    setAnnouncing(3);
    setTimeout(() => setGlitching(false), 600);
    setTimeout(() => setAnnouncing(null), 2800);
    playInsertSting(3);
    // After announcement clears, auto-scroll to game and highlight it
    setTimeout(() => {
      const gameIdx = PROJECTS.length + HIDDEN_PROJECTS.length - 1;
      setSelectedIdx(gameIdx);
      setGameHighlight(true);
      setTimeout(() => setGameHighlight(false), 2000);
    }, 3000);
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
    playBlip();
  };
  const goBack = () => {
    setScreen("select");
    setDetailProject(null);
  };
  const exitGame = () => {
    setScreen("select");
    setDetailProject(null);
  };

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

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        background:
          "radial-gradient(ellipse at 50% 40%, #1a1e30 0%, #141824 50%, #10121c 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', monospace",
        position: "relative",
      }}
    >
      <CrtSvgDefs />
      <style>{crtStyles}</style>
      <TunnelCanvas ref={tunnelRef} />
      {/* A-mark logo — intro entry point, then ambient background */}
      <div
        ref={logoRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0,
        }}
      >
        <svg
          viewBox="0 0 512 512"
          width="200"
          height="200"
          style={{ filter: "drop-shadow(0 0 20px rgba(0,229,255,0.3))" }}
        >
          <line
            x1="108"
            y1="408"
            x2="256"
            y2="104"
            stroke="#00E5FF"
            strokeWidth="36"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="404"
            y1="408"
            x2="256"
            y2="104"
            stroke="#00E5FF"
            strokeWidth="36"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
            stroke="#00E5FF"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="76"
            y1="408"
            x2="140"
            y2="408"
            stroke="#00E5FF"
            strokeWidth="36"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="372"
            y1="408"
            x2="436"
            y2="408"
            stroke="#00E5FF"
            strokeWidth="36"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      {screen === "game" && (
        <TunnelGame tunnelRef={tunnelRef} onExit={exitGame} />
      )}
      <div
        ref={consoleRef}
        style={{
          maxWidth: 900,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          background: "#141824",
          borderRadius: 16,
          opacity: 0,
          willChange: "opacity, clip-path",
        }}
      >
        <div
          ref={screenRef}
          className="crt-screen"
          style={{
            flex: 1,
            margin: "10px 10px 0",
            borderRadius: "16px 16px 0 0",
            border: "3px solid #2a2c40",
            borderTop: "3px solid #363650",
            borderBottom: "none",
            background:
              "radial-gradient(ellipse at center, #181830 0%, #10121e 80%)",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              "inset 0 0 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,229,255,0.08), 0 0 80px rgba(0,229,255,0.04), 0 0 120px rgba(0,255,140,0.02)",
            willChange: "clip-path, filter",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
              pointerEvents: "none",
              zIndex: 90,
            }}
          />
          <div className="scanline-bar" />
          <div className="crt-glass" />
          <div className="crt-curvature" />
          <div className="crt-noise" />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
              pointerEvents: "none",
              zIndex: 80,
            }}
          />
          <div className="crt-grid" />
          {glitching && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                animation: "glitchFlash 0.6s ease",
                pointerEvents: "none",
                zIndex: 95,
              }}
            />
          )}
          {announcing === 3 && (
            <div className="coin-announce tier-3">
              CREDIT ACCEPTED
              <br />
              <span>3 PROGRAMS UNLOCKED</span>
            </div>
          )}
          {/* Project color bleed */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: detailProject
                ? `radial-gradient(ellipse at 30% 40%, ${detailProject.color}08 0%, transparent 60%)`
                : allProjects[selectedIdx] && screen === "select"
                  ? `radial-gradient(ellipse at 30% 40%, ${allProjects[selectedIdx].color}06 0%, transparent 60%)`
                  : "none",
              transition: "background 0.5s ease",
              pointerEvents: "none",
              zIndex: 45,
            }}
          />
          <div style={{ position: "relative", zIndex: 50, height: "100%" }}>
            <div
              className="crt-phosphor"
              style={{
                height: "100%",
                padding: "16px 20px",
                overflow: "hidden",
              }}
            >
              {screen === "boot" && (
                <BootScreen
                  lines={BOOT_LINES}
                  currentLine={bootLine}
                  bootPhase={bootPhase}
                  fs={fs}
                  onSkip={() => {
                    if (bootPhase === 0) setBootPhase(1);
                    else setScreen("select");
                  }}
                />
              )}
              {screen === "select" && (
                <SelectScreen
                  projects={allProjects}
                  selectedIdx={selectedIdx}
                  onSelect={openProject}
                  onHover={setSelectedIdx}
                  coinCount={coinCount}
                  onHoverBlip={playBlip}
                  fs={fs}
                  gameHighlight={gameHighlight}
                />
              )}
              {screen === "detail" && detailProject && (
                <DetailScreen
                  project={detailProject}
                  onBack={goBack}
                  screenWidth={dims.w}
                  screenHeight={dims.h}
                  fs={fs}
                />
              )}
            </div>
          </div>
        </div>

        {/* CABINET */}
        <div
          className="cabinet-body"
          style={{
            margin: "0 10px 10px",
            background: "linear-gradient(180deg, #2a2c40 0%, #1e2030 100%)",
            borderRadius: "0 0 16px 16px",
            border: "3px solid #2a2c40",
            borderTop: "1px solid #363650",
            padding: "14px 20px",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div
              className="btn-cabinet"
              role="button"
              aria-label="Navigate up"
              tabIndex={0}
              onClick={() => {
                if (screen === "select")
                  setSelectedIdx(
                    (i) => (i - 1 + allProjects.length) % allProjects.length,
                  );
                if (
                  screen === "boot" &&
                  bootPhase > 0 &&
                  bootLine >= BOOT_LINES.length - 1
                )
                  setScreen("select");
              }}
              style={{
                width: 34,
                height: 34,
                background: "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b8c8d8",
                fontSize: fs(11),
                border: "1px solid #565870",
                boxShadow:
                  "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {"\u25b2"}
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              <div
                className="btn-cabinet"
                role="button"
                aria-label="Go back"
                tabIndex={0}
                onClick={goBack}
                style={{
                  width: 34,
                  height: 34,
                  background:
                    "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#b8c8d8",
                  fontSize: fs(11),
                  border: "1px solid #565870",
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {"\u25c4"}
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  background:
                    "radial-gradient(circle at 50% 50%, #2a2c40, #222436)",
                  borderRadius: 5,
                  border: "1px solid #3a3c52",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
                }}
              />
              <div
                className="btn-cabinet"
                role="button"
                aria-label="Navigate right"
                tabIndex={0}
                style={{
                  width: 34,
                  height: 34,
                  background:
                    "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#b8c8d8",
                  fontSize: fs(11),
                  border: "1px solid #565870",
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {"\u25ba"}
              </div>
            </div>
            <div
              className="btn-cabinet"
              role="button"
              aria-label="Navigate down"
              tabIndex={0}
              onClick={() => {
                if (screen === "select")
                  setSelectedIdx((i) => (i + 1) % allProjects.length);
              }}
              style={{
                width: 34,
                height: 34,
                background: "linear-gradient(180deg, #464860 0%, #3a3c52 100%)",
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b8c8d8",
                fontSize: fs(11),
                border: "1px solid #565870",
                boxShadow:
                  "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {"\u25bc"}
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg
                viewBox="0 0 512 512"
                width="28"
                height="28"
                style={{
                  filter:
                    "drop-shadow(-1.5px 0 0 rgba(219,116,151,0.35)) drop-shadow(1.5px 0 0 rgba(0,80,255,0.3)) drop-shadow(0 0 6px rgba(0,229,255,0.4))",
                }}
              >
                <line
                  x1="108"
                  y1="408"
                  x2="256"
                  y2="104"
                  stroke="#00E5FF"
                  strokeWidth="36"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <line
                  x1="404"
                  y1="408"
                  x2="256"
                  y2="104"
                  stroke="#00E5FF"
                  strokeWidth="36"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
                  stroke="#00E5FF"
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <line
                  x1="76"
                  y1="408"
                  x2="140"
                  y2="408"
                  stroke="#00E5FF"
                  strokeWidth="36"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <line
                  x1="372"
                  y1="408"
                  x2="436"
                  y2="408"
                  stroke="#00E5FF"
                  strokeWidth="36"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              <div
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: fs(9),
                  color: "#00E5FF",
                  letterSpacing: "0.2em",
                  textShadow: "0 0 8px rgba(0,229,255,0.4)",
                }}
              >
                AMPACTOR
              </div>
              <div
                style={{
                  fontSize: fs(7),
                  color: "#b8c8d8",
                  letterSpacing: "0.15em",
                }}
              >
                SALT LAKE CITY {"\u00b7"} EST. 2018
              </div>
            </div>
            <div
              className="coin-slot"
              role="button"
              aria-label="Insert coin"
              tabIndex={0}
              onClick={insertCoin}
              title="Insert coin"
              style={{
                width: 52,
                height: 16,
                background:
                  coinCount > 0
                    ? "rgba(255,184,0,0.1)"
                    : "linear-gradient(180deg, #1e2030 0%, #222436 100%)",
                borderRadius: 8,
                border: `2px solid ${coinCount > 0 ? "rgba(255,184,0,0.35)" : "#3a3a4a"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow:
                  coinCount > 0
                    ? "inset 0 2px 6px rgba(255,184,0,0.15)"
                    : "inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)",
                opacity: introComplete && screen !== "boot" ? 1 : 0.3,
                pointerEvents: introComplete && screen !== "boot" ? "auto" : "none",
                cursor: introComplete && screen !== "boot" ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 3,
                  background:
                    coinCount > 0
                      ? "rgba(255,184,0,0.5)"
                      : "linear-gradient(90deg, #2a2a3a, #383848, #2a2a3a)",
                  borderRadius: 2,
                  boxShadow:
                    coinCount > 0
                      ? "0 0 6px rgba(255,184,0,0.4)"
                      : "inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)",
                }}
              />
            </div>
            {introComplete && screen !== "boot" && (
              <div
                style={{
                  fontSize: fs(7),
                  fontFamily: "'Press Start 2P', monospace",
                  color: "#FFB800",
                  letterSpacing: "0.12em",
                  opacity: coinCount > 0 ? 0 : 1,
                  transition: "opacity 0.4s ease",
                  animation: "blink 1.2s step-end infinite",
                  marginTop: 4,
                }}
              >
                INSERT COIN
              </div>
            )}
            <div
              style={{
                fontSize: fs(6),
                color: coinCount > 0 ? "rgba(255,184,0,0.5)" : "#556",
                letterSpacing: "0.15em",
                transition: "color 0.3s ease",
                animation:
                  coinCount > 0
                    ? "none"
                    : "coinTextPulse 3s ease-in-out infinite",
                fontFamily: "'Press Start 2P', monospace",
              }}
            >
              {coinCount >= 1 ? "\u25c9" : "\u25ce"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              className="btn-cabinet"
              role="button"
              aria-label="Back"
              tabIndex={0}
              onClick={goBack}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 35%, #664040, #441818 70%)",
                border: "2px solid #774444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: fs(9),
                color: "#ff7755",
                fontFamily: "'Press Start 2P', monospace",
                boxShadow:
                  "0 3px 10px rgba(255,100,68,0.3), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.3)",
              }}
            >
              B
            </div>
            <div
              className="btn-cabinet"
              role="button"
              aria-label="Select"
              tabIndex={0}
              onClick={() => {
                if (screen === "boot") {
                  if (bootPhase === 0) setBootPhase(1);
                  else if (bootLine >= BOOT_LINES.length - 1)
                    setScreen("select");
                }
                if (screen === "select") openProject(selectedIdx);
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 35%, #2a5566, #143344 70%)",
                border: "2px solid #3a7799",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: fs(9),
                color: "#00E5FF",
                fontFamily: "'Press Start 2P', monospace",
                boxShadow:
                  "0 3px 10px rgba(0,229,255,0.25), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.3)",
              }}
            >
              A
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
