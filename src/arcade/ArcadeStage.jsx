import { useRef, useEffect, useState, lazy, Suspense } from "react";
const TunnelGame = lazy(() => import("./TunnelGame"));
import CrtSvgDefs from "./CrtEffects";
import TunnelCanvas from "./TunnelCanvas";
import { crtStyles } from "./styles/crtStyles";
import styles from "./styles/stage.module.css";
import { BOOT_LINES } from "./constants";
import { PROJECTS } from "../data/projects";
import BootScreen from "./components/screens/BootScreen";
import SelectScreen from "./components/screens/SelectScreen";
import DetailScreen from "./components/screens/DetailScreen";
import AttractScreen from "./components/screens/AttractScreen";
import Cabinet from "./components/Cabinet";
import useCabinetState from "./hooks/useCabinetState";

// The A-mark that flickers in during the intro and then sits, nearly dark, in
// the room behind the console. Moved here verbatim from the old root.
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
        style={{ filter: "drop-shadow(0 0 20px rgba(0,229,255,0.3))" }}
      >
        <line x1="108" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
        <line x1="404" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
        <path
          d="M 168,300 C 183,268 197,268 212,300 C 227,332 241,332 256,300 C 271,268 285,268 300,300 C 315,332 329,332 344,300"
          stroke="#00E5FF"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <line x1="76" y1="408" x2="140" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
        <line x1="372" y1="408" x2="436" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

// The cabinet, at both depths. On the floor it is a miniature in attract mode
// under a single "Enter the arcade" control; zoomed, it is the arcade exactly
// as it always was. The same console element plays both parts; App decides
// which with `zoomed`/`mode` and animates between them (useArcadeZoom).
//
// `coldOpen` is the floor's first-visit show: the machine full-screen and
// powering on before the camera pulls back. It is a picture, not a place to
// be: hidden from assistive tech (the floor underneath stays readable), its
// controls inert, and no way out but the show ending.
export default function ArcadeStage({
  mode,
  zoomed,
  animating,
  scale,
  metrics,
  route,
  onNavigate,
  onEnter,
  introVariant,
  coldOpen = false,
  reducedMotion = false,
  consoleRef,
  backdropRef,
  enterButtonRef,
  tunnelRef,
}) {
  const stageRef = useRef(null);
  const screenRef = useRef(null);
  const tubeRef = useRef(null);
  const logoRef = useRef(null);
  // A machine that powered on in the dark (a hard load of /arcade/, the cold
  // open) starts with its console hidden and the intro brings it up. Decided
  // once, so React never re-applies it over the animation.
  const [darkStart] = useState(introVariant === "console");

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
    exitArcade,
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
    mode,
    route,
    onNavigate,
    animating,
    introVariant,
    coldOpen,
  });

  const live = mode === "live";
  // Inputs are for a zoomed, settled machine. Mid-zoom the panel is already
  // un-inert in the DOM sense, so `animating` keeps it quiet.
  const inert = !zoomed || animating || coldOpen;
  const modal = zoomed && !coldOpen;

  // A cabinet scrolled out of view stops flickering: the CRT keyframes are
  // paused through a class the stylesheet knows.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || zoomed || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      el.classList.toggle("arcade-offscreen", !entry.isIntersecting);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.classList.remove("arcade-offscreen");
    };
  }, [zoomed]);

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-zoomed={zoomed ? "true" : "false"}
      data-mode={mode}
      data-pinned={zoomed || animating || undefined}
      data-cold-open={coldOpen || undefined}
      aria-hidden={coldOpen || undefined}
    >
      <CrtSvgDefs />
      <style>{crtStyles}</style>
      {(zoomed || animating) && (
        <div
          ref={backdropRef}
          className={styles.backdrop}
          data-backdrop=""
          aria-hidden={zoomed ? undefined : "true"}
        >
          <TunnelCanvas ref={tunnelRef} />
          {zoomed && <AMarkOverlay logoRef={logoRef} />}
          {zoomed && screen === "game" && (
            <Suspense fallback={null}>
              <TunnelGame tunnelRef={tunnelRef} onExit={exitGame} />
            </Suspense>
          )}
        </div>
      )}
      <div
        ref={consoleRef}
        className={`${styles.console} cabinet-scope`}
        data-zoomed={zoomed ? "true" : "false"}
        tabIndex={-1}
        role={modal ? "dialog" : undefined}
        aria-modal={modal ? "true" : undefined}
        aria-label={modal ? "Arcade" : undefined}
        style={{
          width: metrics.zoomW,
          height: metrics.zoomH,
          "--k": scale,
          opacity: darkStart ? 0 : undefined,
        }}
      >
        <div
          ref={screenRef}
          className="crt-screen"
          inert={inert || undefined}
          style={{
            flex: 1,
            margin: "10px 10px 0",
            borderRadius: "16px 16px 0 0",
            border: "3px solid var(--color-umber)",
            borderTop: "3px solid var(--color-umber)",
            borderBottom: "none",
            background:
              "radial-gradient(ellipse at center, var(--color-dim) 0%, var(--color-void) 80%)",
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
          <div
            ref={tubeRef}
            style={{ position: "relative", zIndex: 50, height: "100%" }}
          >
            {/* Faint skip hint during GSAP intro */}
            {live && !introComplete && (
              <div
                onClick={skipIntro}
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: fs(7),
                  color: "rgba(212,190,152,0.25)",
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
                  reducedMotion={reducedMotion}
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
          attract={!live}
          inert={inert}
        />
      </div>

      {modal && screen !== "game" && (
        <button
          type="button"
          className={styles.floorReturn}
          onClick={exitArcade}
          aria-label="Back to the floor"
        >
          ‹ FLOOR
        </button>
      )}
      {!zoomed && (
        // Mounted for the whole un-zoomed posture, including the shrink back
        // into the slot, so focus has somewhere to land the moment it ends;
        // pointer-inert until then.
        <button
          ref={enterButtonRef}
          type="button"
          className={styles.enter}
          data-animating={animating || undefined}
          onClick={() => onEnter()}
          aria-label="Enter the arcade"
          aria-describedby="arcade-enter-hint"
        />
      )}
    </div>
  );
}
