import { useRef, lazy, Suspense } from "react";
const TunnelGame = lazy(() => import("./TunnelGame"));
import CrtSvgDefs from "./CrtEffects";
import TunnelCanvas from "./TunnelCanvas";
import { crtStyles } from "./styles/crtStyles";
import { BOOT_LINES } from "./constants";
import BootScreen from "./components/screens/BootScreen";
import SelectScreen from "./components/screens/SelectScreen";
import DetailScreen from "./components/screens/DetailScreen";
import Cabinet from "./components/Cabinet";
import useCabinetState from "./hooks/useCabinetState";

export default function ArcadePortfolio() {
  const screenRef = useRef(null);
  const tunnelRef = useRef(null);
  const logoRef = useRef(null);
  const consoleRef = useRef(null);

  const {
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
  } = useCabinetState(screenRef, tunnelRef, logoRef, consoleRef);

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
        <Suspense fallback={null}>
          <TunnelGame tunnelRef={tunnelRef} onExit={exitGame} />
        </Suspense>
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
            {/* Faint skip hint during GSAP intro */}
            {!introComplete && (
              <div
                onClick={skipIntro}
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: fs(7),
                  color: "rgba(184,200,216,0.25)",
                  letterSpacing: "0.15em",
                  animation: "blink 2s step-end infinite",
                  cursor: "pointer",
                  zIndex: 60,
                  userSelect: "none",
                }}
              >
                [ TAP TO SKIP ]
              </div>
            )}
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
                  onSkip={advanceBoot}
                />
              )}
              {screen === "select" && (
                <SelectScreen
                  projects={allProjects}
                  selectedIdx={selectedIdx}
                  onSelect={(i) => {
                    if (!isBootTransitioning()) openProject(i);
                  }}
                  onHover={(i) => {
                    selectedIdx !== i && playBlip();
                  }}
                  onHoverSelect={hoverSelect}
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

        <Cabinet
          navUp={navUp}
          navDown={navDown}
          goBack={goBack}
          openProject={openProject}
          advanceBoot={advanceBoot}
          insertCoin={insertCoin}
          screen={screen}
          selectedIdx={selectedIdx}
          coinCount={coinCount}
          introComplete={introComplete}
          fs={fs}
          isBootTransitioning={isBootTransitioning}
        />
      </div>
    </div>
  );
}
