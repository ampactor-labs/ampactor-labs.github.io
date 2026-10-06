import { useRef, useState, lazy, Suspense } from "react";
const TunnelGame = lazy(() => import("./TunnelGame"));
import TunnelCanvas from "./TunnelCanvas";
import { crtStyles } from "./styles/crtStyles";
import styles from "./styles/stage.module.css";
import { BOOT_LINES } from "./constants";
import { PROJECTS } from "../data/projects";
import { hasVisited } from "./visited";
import { QUOTES } from "../data/quotes";
import BootScreen from "./components/screens/BootScreen";
import SelectScreen from "./components/screens/SelectScreen";
import DetailScreen from "./components/screens/DetailScreen";
import SystemScreen from "./components/screens/SystemScreen";
import AttractScreen from "./components/screens/AttractScreen";
import Cabinet from "./components/Cabinet";
import useCabinetState from "./hooks/useCabinetState";
import { PALETTE, alpha } from "./palette";

// The A-mark that flickers in during the power-on and then sits, nearly
// dark, in the room behind the console.
function AMarkOverlay({ logoRef }) {
  return (
    <div
      ref={logoRef}
      aria-hidden="true"
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
        style={{ filter: `drop-shadow(0 0 20px ${alpha(PALETTE.mark, 0.3)})` }}
      >
        <line x1="108" y1="408" x2="256" y2="104" stroke={PALETTE.mark} strokeWidth="36" strokeLinecap="round" fill="none" />
        <line x1="404" y1="408" x2="256" y2="104" stroke={PALETTE.mark} strokeWidth="36" strokeLinecap="round" fill="none" />
        <path
          d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
          stroke={PALETTE.mark}
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <line x1="76" y1="408" x2="140" y2="408" stroke={PALETTE.mark} strokeWidth="36" strokeLinecap="round" fill="none" />
        <line x1="372" y1="408" x2="436" y2="408" stroke={PALETTE.mark} strokeWidth="36" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

// The cabinet, standing in its dark room, as the whole page. The URL decides
// the screen (`route`); the cabinet asks for changes through `onNavigate`.
export default function ArcadeStage({
  route,
  onNavigate,
  reducedMotion = false,
  consoleRef,
  tunnelRef,
}) {
  const screenRef = useRef(null);
  const tubeRef = useRef(null);
  const logoRef = useRef(null);
  // A first visit powers the machine on out of the dark: the console starts
  // hidden and the intro brings it up. Decided once, so React never
  // re-applies it over the animation.
  const [darkStart] = useState(
    () => !(hasVisited() || (route.view === "arcade" && route.screen === "project")),
  );
  // Read once: the boot marks the visit, and the title card after a first
  // boot must still greet a first visitor.
  const [returning] = useState(() => hasVisited());

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
    attractNudge,
    fs,
    introComplete,
    skipIntro,
    insertCoin,
    start,
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
    linkIdx,
    linkRefs,
    detailBodyRef,
    playBlip,
    isBootTransitioning,
  } = useCabinetState({
    screenRef,
    tunnelRef,
    logoRef,
    consoleRef,
    tubeRef,
    route,
    onNavigate,
  });

  return (
    <div className={styles.stage} data-screen={screen}>
      <style>{crtStyles}</style>
      <div className={styles.backdrop} data-backdrop="">
        <TunnelCanvas ref={tunnelRef} />
        <AMarkOverlay logoRef={logoRef} />
        {screen === "game" && (
          <Suspense fallback={null}>
            <TunnelGame tunnelRef={tunnelRef} onExit={exitGame} />
          </Suspense>
        )}
      </div>
      <div
        ref={consoleRef}
        className={`${styles.console} cabinet-scope`}
        tabIndex={-1}
        style={{ opacity: darkStart ? 0 : undefined }}
      >
        <div
          ref={screenRef}
          className="crt-screen"
          style={{
            flex: 1,
            margin: "10px 10px 0",
            borderRadius: "16px 16px 0 0",
            border: "3px solid var(--cab-line)",
            borderTop: "3px solid var(--cab-line)",
            borderBottom: "none",
            background: "var(--cab-void)",
            position: "relative",
            overflow: "hidden",
            boxShadow: `inset 0 0 80px ${alpha(PALETTE.void, 0.6)}, 0 0 40px ${alpha(PALETTE.mark, 0.08)}`,
            willChange: "clip-path, filter",
          }}
        >
          {/* The tube's layers, bottom to top: the lit ground, the cartridge's
              bleed, the shade, the content, then the flash and the coin's
              stamp when they happen. Nothing that darkens sits above the
              content. */}
          <div className="tube-ground" />
          <div className="tube-shade" />
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
              <span>{QUOTES.coin}</span>
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
          <div
            ref={tubeRef}
            style={{ position: "relative", zIndex: 50, height: "100%" }}
          >
            {/* Faint skip hint during the power-on */}
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
                  color: alpha(PALETTE.text, 0.25),
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
              {screen === "attract" && (
                <AttractScreen
                  projects={PROJECTS}
                  fs={fs}
                  onStart={start}
                  nudge={attractNudge}
                  reducedMotion={reducedMotion}
                  screenWidth={dims.w}
                  returning={returning}
                />
              )}
              {screen === "boot" && (
                <BootScreen
                  lines={BOOT_LINES}
                  currentLine={bootLine}
                  bootPhase={bootPhase}
                  fs={fs}
                  onSkip={advanceBoot}
                  screenWidth={dims.w}
                  introComplete={introComplete}
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
                  bodyRef={detailBodyRef}
                  linkRefs={linkRefs}
                  focusedLink={linkIdx}
                />
              )}
              {screen === "system" && detailProject && (
                <SystemScreen
                  program={detailProject}
                  onBack={goBack}
                  fs={fs}
                  bodyRef={detailBodyRef}
                  linkRefs={linkRefs}
                  focusedLink={linkIdx}
                  reducedMotion={reducedMotion}
                />
              )}
            </div>
          </div>
        </div>

        <Cabinet
          navUp={navUp}
          navDown={navDown}
          navLeft={navLeft}
          navRight={navRight}
          pressA={pressA}
          goBack={goBack}
          insertCoin={insertCoin}
          screen={screen}
          coinCount={coinCount}
          introComplete={introComplete}
          fs={fs}
        />
      </div>
    </div>
  );
}
